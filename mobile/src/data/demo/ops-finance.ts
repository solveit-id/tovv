import type { Ctx } from './ctx';
import { requireOnline } from './ctx';
import { customerCanSeeRequest, requireScope } from './policy';
import { invoiceDoc, isStaffView, paymentRequestDto, proofDto, requestOf } from './mappers';
import type { DemoDb } from './db';
import { ApiError, type InvoiceDoc, type PaymentRequestDTO, type ProofDTO, type ProofInput, type VerifyInput } from '@/data/api/contract';
import type { Invoice, PaymentProof } from '@/domain/types';
import { invoiceBalance, receiptUnapplied } from '@/domain/ledger';
import { addLocalDays, addMinutes, localDate } from '@/core/format/time';
import { formatRupiah } from '@/core/format/money';
import { t } from '@/core/i18n';

const normRef = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Siapa yang boleh melihat invoice: staff finance/owner/admin tenant, pembayar pribadi, finance/approver B2B organisasinya. */
function canSeeInvoice(ctx: Ctx, db: DemoDb, inv: Invoice): boolean {
  if (inv.tenantId !== ctx.actor.user.tenantId) return false;
  if (isStaffView(ctx.actor)) return true;
  if (ctx.actor.view !== 'customer') return false;
  const order = db.orders.find((o) => o.id === inv.orderId)!;
  const req = requestOf(db, order.requestId);
  if (!customerCanSeeRequest(ctx.actor.user, req)) return false;
  // Penerima/requester bukan otomatis pembayar (BIZ-06).
  if (ctx.actor.user.businessAccountId) return ctx.scopes.has('invoice.view_org');
  return true;
}

function invoiceFor(ctx: Ctx, db: DemoDb, id: string): Invoice {
  const inv = db.invoices.find((i) => i.id === id);
  if (!inv || !canSeeInvoice(ctx, db, inv)) throw new ApiError('NOT_FOUND', t('Invoice tidak ditemukan.'));
  return inv;
}

export function listInvoices(ctx: Ctx, filter: 'open' | 'all'): InvoiceDoc[] {
  const db = ctx.store.db;
  return db.invoices
    .filter((i) => i.status !== 'draft' && canSeeInvoice(ctx, db, i))
    .filter((i) => filter === 'all' || invoiceBalance(db, i.id, ctx.now).outstanding > 0)
    .sort((a, b) => Date.parse(b.issuedAt ?? '') - Date.parse(a.issuedAt ?? ''))
    .map((i) => invoiceDoc(db, i, ctx.actor, ctx.now));
}

export function getInvoice(ctx: Ctx, id: string): InvoiceDoc {
  const db = ctx.store.db;
  return invoiceDoc(db, invoiceFor(ctx, db, id), ctx.actor, ctx.now);
}

export function issueInvoice(ctx: Ctx, orderId: string): InvoiceDoc {
  requireScope(ctx.scopes, 'invoice.issue', 'Penerbitan invoice memerlukan finance/owner atau delegasi invoice.issue.');
  requireOnline(ctx.store.db, 'Menerbitkan invoice');
  return ctx.store.transact((db) => {
    const o = db.orders.find((x) => x.id === orderId && x.tenantId === ctx.actor.user.tenantId);
    if (!o) throw new ApiError('NOT_FOUND', t('Order tidak ditemukan.'));
    if (!['handed_over', 'closed'].includes(o.status)) throw new ApiError('VALIDATION', t('Invoice dibuat setelah serah-terima.'));
    if (db.invoices.some((i) => i.orderId === o.id && i.status !== 'void')) throw new ApiError('VERSION_CONFLICT', t('Order ini sudah memiliki invoice.'));
    const q = db.quotes.find((x) => x.id === o.quoteId)!;
    const req = requestOf(db, o.requestId);
    const acc = req.businessAccountId ? db.businessAccounts.find((b) => b.id === req.businessAccountId) : null;
    const approved = db.changeOrders.filter((c) => c.orderId === o.id && c.status === 'approved');
    db.sequences.invoice[o.tenantId] += 1;
    const seq = db.sequences.invoice[o.tenantId];
    const inv: Invoice = {
      id: `I-${o.alias}`,
      number: `INV/${o.tenantId === 'tenant-a' ? 'A' : 'B'}/2026/${String(seq).padStart(4, '0')}`,
      tenantId: o.tenantId,
      orderId: o.id,
      status: 'issued',
      issuedAt: ctx.now,
      dueDate: addLocalDays(localDate(ctx.now), acc?.netDays ?? 7),
      // Item pending tidak ditagih; hanya change order yang disetujui (QTE-06).
      gross: q.amount + approved.reduce((s, c) => s + c.amount, 0),
      items: [...q.items, ...approved.map((c) => ({ label: t('Tambahan disetujui: {0}', [c.reason]), amount: c.amount }))],
      correctsInvoiceId: null,
      payerLabel: req.parties.payer,
      businessAccountId: req.businessAccountId,
      customerUserId: req.customerUserId,
      version: 1,
    };
    db.invoices.push(inv);
    if (req.customerUserId) {
      db.inbox.push({ id: `IB-${db.inbox.length + 1}`, eventId: `evt-invoice-${inv.id}`, tenantId: inv.tenantId, userId: req.customerUserId, type: 'invoice', title: t('Invoice {0}', [inv.number]), body: t('{0} · jatuh tempo {1}', [formatRupiah(inv.gross), inv.dueDate]), link: `/invoice/${inv.id}`, createdAt: ctx.now, read: false });
    }
    return invoiceDoc(db, inv, ctx.actor, ctx.now);
  });
}

export function createPaymentRequest(ctx: Ctx, invoiceId: string, amount: number, expiryHours: number): PaymentRequestDTO {
  requireScope(ctx.scopes, 'payment.request', 'Hanya finance/owner yang membuat permintaan pembayaran.');
  requireOnline(ctx.store.db, 'Membuat permintaan pembayaran');
  return ctx.store.transact((db) => {
    const inv = invoiceFor(ctx, db, invoiceId);
    if (inv.status !== 'issued') throw new ApiError('VERSION_CONFLICT', t('Invoice ini tidak berstatus terbit.'));
    const due = invoiceBalance(db, inv.id, ctx.now).outstanding;
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > due) {
      throw new ApiError('VALIDATION', t('Nominal harus lebih dari 0 dan tidak lebih dari sisa {0}.', [formatRupiah(due)]), false, { amount: 'Tidak valid' });
    }
    db.paymentRequests.filter((p) => p.invoiceId === inv.id && p.status === 'active').forEach((p) => {
      p.status = 'superseded';
      p.history.push({ at: ctx.now, status: 'superseded', note: 'Diganti permintaan baru' });
    });
    const n = db.paymentRequests.filter((p) => p.invoiceId === inv.id).length + 1;
    const alias = db.orders.find((o) => o.id === inv.orderId)?.alias ?? inv.id;
    const pr = {
      id: `PR-${alias}-${n}`,
      invoiceId: inv.id,
      reference: `DEMO-${alias}-${String(n).padStart(2, '0')}`,
      requestedAmount: amount,
      outstandingSnapshot: due,
      invoiceVersion: inv.version,
      instructionVersion: db.tenants.find((t) => t.id === inv.tenantId)!.paymentInstruction.version,
      createdAt: ctx.now,
      expiresAt: addMinutes(ctx.now, expiryHours * 60),
      status: 'active' as const,
      createdBy: ctx.actor.user.id,
      history: [{ at: ctx.now, status: 'active' as const, note: amount < due ? 'Permintaan sebagian' : 'Permintaan penuh' }],
    };
    db.paymentRequests.push(pr);
    return paymentRequestDto(db, pr, ctx.now);
  });
}

export function getPaymentRequest(ctx: Ctx, id: string): PaymentRequestDTO {
  const db = ctx.store.db;
  const pr = db.paymentRequests.find((p) => p.id === id);
  // Deep link internal tidak menambah hak: tetap diperiksa terhadap invoice dan tenant (MOB-02).
  if (!pr) throw new ApiError('NOT_FOUND', t('Permintaan pembayaran tidak ditemukan.'));
  invoiceFor(ctx, db, pr.invoiceId);
  return paymentRequestDto(db, pr, ctx.now);
}

export function submitProof(ctx: Ctx, input: ProofInput): ProofDTO {
  const db0 = ctx.store.db;
  const staff = isStaffView(ctx.actor);
  if (staff) {
    requireScope(ctx.scopes, 'payment.submit_assisted', 'Akun ini tidak dapat mencatat bukti atas nama pelanggan.');
    if (!input.assistedReason?.trim()) throw new ApiError('VALIDATION', t('Tulis kenapa dicatat oleh petugas (mis. bukti dikirim lewat chat).'));
  } else requireScope(ctx.scopes, 'payment.submit_own', 'Akun ini tidak dapat mengajukan bukti.');
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new ApiError('VALIDATION', t('Nominal harus rupiah bulat lebih dari 0.'), false, { amount: 'Tidak valid' });
  if (!input.reference.trim()) throw new ApiError('VALIDATION', t('Referensi transfer/kuitansi wajib diisi.'), false, { reference: 'Wajib' });
  invoiceFor(ctx, db0, input.invoiceId);
  return ctx.store.transact((db) => {
    const inv = invoiceFor(ctx, db, input.invoiceId);
    const pr = input.paymentRequestId ? db.paymentRequests.find((p) => p.id === input.paymentRequestId && p.invoiceId === inv.id) : null;
    const prExpired = pr && (pr.status !== 'active' || Date.parse(pr.expiresAt) <= Date.parse(ctx.now));
    const similar = db.proofs.find((p) => normRef(p.referenceClaimed) === normRef(input.reference));
    const flag = similar
      ? t('Referensi mirip dengan bukti {0}; perlu keputusan pemeriksa (belum tentu penipuan).', [similar.id])
      : prExpired
        ? 'Diajukan setelah permintaan pembayaran kedaluwarsa/diganti; tetap ditinjau.'
        : null;
    const proof: PaymentProof = {
      id: `PF-${db.orders.find((o) => o.id === inv.orderId)?.alias}-${db.proofs.filter((p) => p.invoiceId === inv.id).length + 1}`,
      invoiceId: inv.id,
      paymentRequestId: pr?.id ?? null,
      amountClaimed: input.amount,
      method: input.method,
      referenceClaimed: input.reference,
      eventAt: input.eventAt,
      submittedBy: ctx.actor.user.id,
      receivedAt: ctx.now,
      status: flag ? 'flagged_review' : 'pending_review',
      flagReason: flag,
      priorProofId: null,
      review: null,
      assistedReason: staff ? input.assistedReason : null,
      attachmentLabel: input.attachmentLabel,
    };
    db.proofs.push(proof);
    return proofDto(db, proof, ctx.actor, ctx.now);
  });
}

export function listProofs(ctx: Ctx, filter: 'review' | 'all'): ProofDTO[] {
  const db = ctx.store.db;
  return db.proofs
    .filter((p) => {
      const inv = db.invoices.find((i) => i.id === p.invoiceId);
      return !!inv && canSeeInvoice(ctx, db, inv);
    })
    .filter((p) => filter === 'all' || p.status === 'pending_review' || p.status === 'flagged_review')
    .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))
    .map((p) => proofDto(db, p, ctx.actor, ctx.now));
}

export function getProof(ctx: Ctx, id: string): ProofDTO {
  const db = ctx.store.db;
  const p = db.proofs.find((x) => x.id === id);
  if (!p) throw new ApiError('NOT_FOUND', t('Bukti tidak ditemukan.'));
  invoiceFor(ctx, db, p.invoiceId);
  return proofDto(db, p, ctx.actor, ctx.now);
}

/** PAY-11: verifikasi berizin membuat satu receipt + alokasi; sisa menjadi unapplied. Bukti tidak pernah melunasi sendiri. */
export function verifyProof(ctx: Ctx, input: VerifyInput): ProofDTO {
  requireScope(ctx.scopes, 'payment.verify', 'Pemeriksaan pembayaran memerlukan finance/owner atau izin payment.verify eksplisit.');
  requireOnline(ctx.store.db, 'Memverifikasi penerimaan');
  if (!Number.isSafeInteger(input.amountVerified) || input.amountVerified <= 0) throw new ApiError('VALIDATION', t('Jumlah diterima (demo) harus lebih dari 0.'), false, { amount: 'Tidak valid' });
  if (!input.reason.trim()) throw new ApiError('VALIDATION', t('Tulis alasan keputusan.'), false, { reason: 'Wajib' });
  return ctx.store.transact((db) => {
    const p = db.proofs.find((x) => x.id === input.proofId);
    if (!p) throw new ApiError('NOT_FOUND', t('Bukti tidak ditemukan.'));
    const inv = invoiceFor(ctx, db, p.invoiceId);
    if (p.status !== 'pending_review' && p.status !== 'flagged_review') throw new ApiError('PROOF_ALREADY_REVIEWED', t('Bukti ini sudah dicek; tidak membuat tanda terima kedua.'));
    if (p.submittedBy === ctx.actor.user.id) throw new ApiError('SELF_APPROVAL', t('Bukti yang Anda kirim harus dicek oleh orang lain (keuangan/owner).'));
    if (p.status === 'flagged_review' && !input.duplicateResolution?.trim()) {
      throw new ApiError('DUPLICATE_REFERENCE_REVIEW_REQUIRED', t('Referensinya mirip bukti lain. Tulis keputusan Anda sebelum menerima.'));
    }
    const due = invoiceBalance(db, inv.id, ctx.now).outstanding;
    const receiptId = `RC-${p.id.replace('PF-', '')}`;
    db.receipts.push({ id: receiptId, tenantId: inv.tenantId, proofId: p.id, invoiceId: inv.id, amount: input.amountVerified, postedAt: ctx.now, method: p.method, custody: input.custody, status: 'posted', verifiedBy: ctx.actor.user.id });
    const alloc = Math.min(due, input.amountVerified);
    if (alloc > 0) db.allocations.push({ id: `AL-${p.id.replace('PF-', '')}`, receiptId, invoiceId: inv.id, amount: alloc, postedAt: ctx.now });
    p.status = 'verified';
    p.review = { by: ctx.actor.user.id, at: ctx.now, reason: [input.reason, input.duplicateResolution].filter(Boolean).join(' · '), amountVerified: input.amountVerified, custody: input.custody, receivedEventAt: input.receivedEventAt };
    const pr = p.paymentRequestId ? db.paymentRequests.find((x) => x.id === p.paymentRequestId) : null;
    if (pr && (pr.status === 'active' || pr.status === 'expired') && alloc >= pr.requestedAmount) {
      pr.status = 'fulfilled';
      pr.history.push({ at: ctx.now, status: 'fulfilled', note: 'Jumlah yang diminta sudah teralokasi' });
    }
    return proofDto(db, p, ctx.actor, ctx.now);
  });
}

export function rejectProof(ctx: Ctx, proofId: string, reason: string): ProofDTO {
  requireScope(ctx.scopes, 'payment.verify', 'Pemeriksaan pembayaran memerlukan finance/owner.');
  if (!reason.trim()) throw new ApiError('VALIDATION', t('Alasan penolakan wajib.'), false, { reason: 'Wajib' });
  return ctx.store.transact((db) => {
    const p = db.proofs.find((x) => x.id === proofId);
    if (!p) throw new ApiError('NOT_FOUND', t('Bukti tidak ditemukan.'));
    invoiceFor(ctx, db, p.invoiceId);
    if (p.status !== 'pending_review' && p.status !== 'flagged_review') throw new ApiError('PROOF_ALREADY_REVIEWED', t('Bukti ini sudah dicek.'));
    if (p.submittedBy === ctx.actor.user.id) throw new ApiError('SELF_APPROVAL', t('Bukti yang Anda kirim harus dicek orang lain.'));
    p.status = 'rejected';
    p.review = { by: ctx.actor.user.id, at: ctx.now, reason, amountVerified: null, custody: null, receivedEventAt: null };
    return proofDto(db, p, ctx.actor, ctx.now);
  });
}

export function addCreditNote(ctx: Ctx, invoiceId: string, amount: number, reason: string): InvoiceDoc {
  requireScope(ctx.scopes, 'payment.correct', 'Koreksi memerlukan finance/owner.');
  if (!reason.trim() || !Number.isSafeInteger(amount) || amount <= 0) throw new ApiError('VALIDATION', t('Nominal dan alasan kredit wajib.'));
  return ctx.store.transact((db) => {
    const inv = invoiceFor(ctx, db, invoiceId);
    const b = invoiceBalance(db, inv.id, ctx.now);
    if (amount > b.net) throw new ApiError('VALIDATION', t('Kredit melebihi nilai net {0}.', [formatRupiah(b.net)]));
    const id = `CN-${inv.id.replace('I-', '')}-${db.creditNotes.filter((c) => c.invoiceId === inv.id).length + 1}`;
    db.creditNotes.push({ id, invoiceId: inv.id, amount, postedAt: ctx.now, reason });
    // Kredit setelah settled: reversal alokasi sebesar kelebihan dalam transaksi yang sama.
    const excess = b.allocated - (b.net - amount);
    if (excess > 0) {
      const alloc = [...db.allocations].reverse().find((a) => a.invoiceId === inv.id);
      if (alloc) db.allocationReversals.push({ id: `ALR-${id}`, allocationId: alloc.id, amount: excess, postedAt: ctx.now, reason: 'Kelebihan alokasi setelah kredit' });
    }
    return invoiceDoc(db, inv, ctx.actor, ctx.now);
  });
}

export function recordRefund(ctx: Ctx, receiptId: string, amount: number, reason: string): InvoiceDoc {
  requireScope(ctx.scopes, 'payment.correct', 'Pencatatan refund memerlukan finance/owner.');
  if (!reason.trim()) throw new ApiError('VALIDATION', t('Alasan refund wajib.'));
  return ctx.store.transact((db) => {
    const r = db.receipts.find((x) => x.id === receiptId);
    if (!r) throw new ApiError('NOT_FOUND', t('Tanda terima tidak ditemukan.'));
    const inv = invoiceFor(ctx, db, r.invoiceId);
    const avail = receiptUnapplied(db, r.id, ctx.now);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > avail) throw new ApiError('VALIDATION', t('Refund paling banyak {0} (sisa kelebihan bayar).', [formatRupiah(avail)]));
    db.refunds.push({ id: `RF-${r.id}-${db.refunds.length + 1}`, receiptId: r.id, amount, status: 'recorded', recordedAt: ctx.now, reason });
    return invoiceDoc(db, inv, ctx.actor, ctx.now);
  });
}

export function reverseVerification(ctx: Ctx, proofId: string, reason: string): InvoiceDoc {
  requireScope(ctx.scopes, 'payment.correct', 'Pembatalan verifikasi memerlukan finance/owner.');
  requireOnline(ctx.store.db, 'Membatalkan verifikasi');
  if (!reason.trim()) throw new ApiError('VALIDATION', t('Alasan pembatalan verifikasi wajib.'));
  return ctx.store.transact((db) => {
    const p = db.proofs.find((x) => x.id === proofId);
    if (!p || p.status !== 'verified') throw new ApiError('VERSION_CONFLICT', t('Hanya bukti yang sudah diverifikasi yang bisa dibatalkan.'));
    const inv = invoiceFor(ctx, db, p.invoiceId);
    const r = db.receipts.find((x) => x.proofId === p.id && x.status === 'posted');
    if (!r) throw new ApiError('VERSION_CONFLICT', t('Tanda terima tidak ditemukan atau sudah dibalik.'));
    if (db.refunds.some((f) => f.receiptId === r.id && f.status === 'recorded')) {
      throw new ApiError('DEPENDENT_FINANCIAL_ENTRY', t('Tanda terima ini sudah punya refund. Selesaikan koreksi refund dulu.'));
    }
    db.allocations.filter((a) => a.receiptId === r.id).forEach((a) => {
      const reversed = db.allocationReversals.filter((x) => x.allocationId === a.id).reduce((s, x) => s + x.amount, 0);
      if (a.amount - reversed > 0) db.allocationReversals.push({ id: `ALR-${a.id}-rv`, allocationId: a.id, amount: a.amount - reversed, postedAt: ctx.now, reason });
    });
    db.receiptReversals.push({ id: `RCR-${r.id}`, receiptId: r.id, amount: r.amount, postedAt: ctx.now, reason });
    r.status = 'reversed';
    p.status = 'verification_reversed';
    db.paymentRequests.filter((x) => x.id === p.paymentRequestId && x.status === 'fulfilled').forEach((x) => {
      x.status = 'superseded';
      x.history.push({ at: ctx.now, status: 'superseded', note: 'Tanda terima dibalik; buat permintaan baru kalau perlu' });
    });
    return invoiceDoc(db, inv, ctx.actor, ctx.now);
  });
}
