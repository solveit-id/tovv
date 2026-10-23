import type { DemoDb } from './db';
import type { Actor, Scope } from './policy';
import { customerCanSeeRequest } from './policy';
import type { DailyAction } from '@/data/api/contract';
import { userName, currentAssignment, requestOf } from './mappers';
import { invoiceBalance } from '@/domain/ledger';
import { toMoneyString } from '@/core/format/money';
import { formatUntil } from '@/core/format/time';
import { t } from '@/core/i18n';

/**
 * Daftar tindakan harian (FIN-05, PRD §5): proyeksi yang dihitung ulang dari sumber.
 * Item hilang hanya bila sumbernya resolved — tidak ada tombol "selesai" yang mengubah status bisnis.
 * Dedupe per (tenant, source, type).
 */
export function dailyActions(db: DemoDb, actor: Actor, scopes: Set<Scope>, now: string): DailyAction[] {
  const tenant = actor.user.tenantId;
  const items: DailyAction[] = [];
  const push = (a: Omit<DailyAction, 'key'>) => {
    const key = `${tenant}:${a.sourceType}:${a.sourceId}:${a.type}`;
    if (!items.some((x) => x.key === key)) items.push({ ...a, key });
  };
  const staff = actor.view === 'owner' || actor.view === 'admin';
  const dispatcher = scopes.has('request.manage');
  const finance = scopes.has('payment.verify') || scopes.has('invoice.issue');
  const ownerName = userName(db, db.users.find((u) => u.tenantId === tenant && u.staffRoles.includes('owner'))?.id);
  const financeName = userName(db, db.users.find((u) => u.tenantId === tenant && u.staffRoles.includes('finance'))?.id);
  const dispatcherName = userName(db, db.users.find((u) => u.tenantId === tenant && u.staffRoles.includes('dispatcher'))?.id);
  const tNow = Date.parse(now);

  if (staff) {
    const requests = db.requests.filter((r) => r.tenantId === tenant);
    if (dispatcher || actor.view === 'owner') {
      requests.filter((r) => r.status === 'needs_review').forEach((r) =>
        push({ sourceType: 'request', sourceId: r.id, type: 'needs_review', title: t('{0} · data belum lengkap', [r.alias]), reason: r.needsReviewReasons.join('; '), picName: dispatcherName, dueAt: null, link: `/request/${r.id}`, severity: 'attention', amount: null }),
      );
      requests.filter((r) => r.status === 'ready_to_quote').forEach((r) =>
        push({ sourceType: 'request', sourceId: r.id, type: 'ready_to_quote', title: t('{0} · siap diberi harga', [r.alias]), reason: 'Data minimum sudah lengkap; harga dan unit belum ditentukan.', picName: scopes.has('quote.send') ? actor.user.name : ownerName, dueAt: null, link: `/request/${r.id}`, severity: 'info', amount: null }),
      );
      requests.filter((r) => r.status === 'quoted').forEach((r) => {
        const q = db.quotes.filter((x) => x.requestId === r.id).sort((a, b) => b.version - a.version)[0];
        if (!q) return;
        const expired = q.status === 'expired' || (q.status === 'sent' && Date.parse(q.validUntil) <= tNow);
        push({
          sourceType: 'quote', sourceId: q.id, type: expired ? 'quote_expired' : 'quote_waiting',
          title: t('{0} · penawaran v{1} {2}', [r.alias, q.version, expired ? 'kedaluwarsa' : 'menunggu pelanggan']),
          reason: expired ? 'Buat versi baru atau tandai tidak dilanjutkan. Versi lama tidak bisa diterima lagi.' : t('Berlaku sampai {0}.', [formatUntil(q.validUntil, now)]),
          picName: expired ? dispatcherName : r.parties.orderer, dueAt: q.validUntil, link: `/request/${r.id}`, severity: expired ? 'attention' : 'info', amount: toMoneyString(q.amount),
        });
      });
    }
    db.orders.filter((o) => o.tenantId === tenant).forEach((o) => {
      const asg = currentAssignment(db, o.id);
      if ((dispatcher || actor.view === 'owner') && asg?.status === 'offered') {
        push({ sourceType: 'assignment', sourceId: asg.id, type: 'assignment_pending', title: t('{0} · tugas belum diterima', [o.alias]), reason: t('Ditawarkan ke {0}. Belum pasti berangkat.', [userName(db, asg.driverId)]), picName: userName(db, asg.driverId), dueAt: o.scheduleStart, link: `/order/${o.id}`, severity: 'attention', amount: null });
      }
      if (dispatcher || actor.view === 'owner') {
        db.incidents.filter((i) => i.orderId === o.id && i.status === 'open').forEach((i) =>
          push({ sourceType: 'incident', sourceId: i.id, type: 'incident_open', title: `${o.alias} · ${i.type === 'receiver_not_ready' ? 'penerima belum siap' : i.type === 'handover_dispute' ? 'keberatan serah-terima' : 'kendala terbuka'}`, reason: i.note, picName: userName(db, i.pic), dueAt: null, link: `/order/${o.id}`, severity: 'blocker', amount: null }),
        );
        db.changeOrders.filter((c) => c.orderId === o.id && c.status === 'pending').forEach((c) =>
          push({ sourceType: 'change_order', sourceId: c.id, type: 'change_pending', title: t('{0} · biaya tambahan belum disetujui', [o.alias]), reason: t('{0}. Belum masuk tagihan sebelum disetujui.', [c.reason]), picName: requestOf(db, o.requestId).parties.orderer, dueAt: null, link: `/order/${o.id}`, severity: 'attention', amount: toMoneyString(c.amount) }),
        );
      }
      if ((finance || actor.view === 'owner') && o.status === 'handed_over' && !db.invoices.some((i) => i.orderId === o.id && i.status !== 'void')) {
        push({ sourceType: 'order', sourceId: o.id, type: 'handover_not_invoiced', title: t('{0} · sudah diserahkan, invoice belum dibuat', [o.alias]), reason: 'Serah-terima tidak berarti lunas; terbitkan invoice dari penawaran yang disetujui.', picName: financeName, dueAt: null, link: `/order/${o.id}`, severity: 'attention', amount: null });
      }
      if ((finance || actor.view === 'owner') && ['handed_over', 'closed'].includes(o.status) && o.costCompleteness === 'provisional') {
        push({ sourceType: 'order', sourceId: o.id, type: 'cost_not_final', title: t('{0} · biaya belum final', [o.alias]), reason: 'Kontribusi masih sementara; biaya yang belum ada tidak dihitung nol.', picName: financeName, dueAt: null, link: `/order/${o.id}`, severity: 'info', amount: null });
      }
    });
    if (finance || actor.view === 'owner') {
      db.proofs.filter((p) => (p.status === 'pending_review' || p.status === 'flagged_review') && db.invoices.find((i) => i.id === p.invoiceId)?.tenantId === tenant).forEach((p) => {
        const inv = db.invoices.find((i) => i.id === p.invoiceId)!;
        const alias = db.orders.find((o) => o.id === inv.orderId)?.alias ?? '';
        push({ sourceType: 'proof', sourceId: p.id, type: 'proof_review', title: t('{0} · bukti bayar perlu dicek', [alias]), reason: p.flagReason ?? 'Bukti belum mengubah saldo sampai dicek petugas yang berwenang.', picName: financeName, dueAt: null, link: `/proof/${p.id}`, severity: p.status === 'flagged_review' ? 'attention' : 'blocker', amount: toMoneyString(p.amountClaimed) });
      });
      db.invoices.filter((i) => i.tenantId === tenant && i.status === 'issued').forEach((i) => {
        const b = invoiceBalance(db, i.id, now);
        if (b.outstanding > 0 && b.overdueDays !== null) {
          const alias = db.orders.find((o) => o.id === i.orderId)?.alias ?? '';
          push({ sourceType: 'invoice', sourceId: i.id, type: 'receivable_overdue', title: t('{0} · tagihan lewat jatuh tempo', [alias]), reason: t('Lewat {0} hari ({1}).', [b.overdueDays, i.payerLabel]), picName: financeName, dueAt: null, link: `/invoice/${i.id}`, severity: 'attention', amount: toMoneyString(b.outstanding) });
        }
      });
      db.expenses.filter((e) => e.tenantId === tenant && e.status === 'submitted').forEach((e) => {
        const alias = db.orders.find((o) => o.id === e.orderId)?.alias ?? '';
        push({ sourceType: 'expense', sourceId: e.id, type: 'expense_pending', title: `${alias} · biaya menunggu persetujuan`, reason: `${e.category} oleh ${userName(db, e.submittedBy)}.`, picName: financeName, dueAt: null, link: `/finance/expenses`, severity: 'info', amount: toMoneyString(e.amount) });
      });
    }
  }

  if (actor.view === 'driver') {
    db.assignments.filter((a) => a.driverId === actor.user.id && a.tenantId === tenant).forEach((a) => {
      const o = db.orders.find((x) => x.id === a.orderId)!;
      if (a.status === 'offered') push({ sourceType: 'assignment', sourceId: a.id, type: 'assignment_offer', title: t('{0} · tawaran tugas', [o.alias]), reason: 'Terima, atau tolak dengan alasan. Belum pasti berangkat.', picName: actor.user.name, dueAt: o.scheduleStart, link: `/order/${o.id}`, severity: 'blocker', amount: null });
    });
  }

  if (actor.view === 'customer') {
    const visible = db.requests.filter((r) => r.tenantId === tenant && customerCanSeeRequest(actor.user, r));
    visible.forEach((r) => {
      if (r.status === 'draft') push({ sourceType: 'request', sourceId: r.id, type: 'draft', title: t('{0} · draf permintaan belum dikirim', [r.alias]), reason: 'Lengkapi lokasi dan foto kondisi, lalu kirim.', picName: actor.user.name, dueAt: null, link: `/request/${r.id}`, severity: 'info', amount: null });
      const q = db.quotes.filter((x) => x.requestId === r.id).sort((a, b) => b.version - a.version)[0];
      if (q && q.status === 'sent' && Date.parse(q.validUntil) > tNow) {
        const canApprove = !actor.user.businessAccountId || (actor.user.b2bRoles ?? []).includes('approver');
        push({ sourceType: 'quote', sourceId: q.id, type: 'quote_waiting', title: t('{0} · penawaran v{1} menunggu {2}', [r.alias, q.version, canApprove ? 'persetujuan Anda' : 'approver']), reason: t('Berlaku {0}.', [formatUntil(q.validUntil, now)]), picName: canApprove ? actor.user.name : 'Approver organisasi', dueAt: q.validUntil, link: `/quote/${q.id}`, severity: 'attention', amount: toMoneyString(q.amount) });
      }
      const o = db.orders.find((x) => x.requestId === r.id);
      if (o) {
        db.changeOrders.filter((c) => c.orderId === o.id && c.status === 'pending').forEach((c) =>
          push({ sourceType: 'change_order', sourceId: c.id, type: 'change_pending', title: t('{0} · biaya tambahan perlu keputusan', [o.alias]), reason: c.reason, picName: actor.user.name, dueAt: null, link: `/order/${o.id}`, severity: 'attention', amount: toMoneyString(c.amount) }),
        );
        db.invoices.filter((i) => i.orderId === o.id && i.status === 'issued').forEach((i) => {
          const b = invoiceBalance(db, i.id, now);
          const canSeeInvoice = !actor.user.businessAccountId || (actor.user.b2bRoles ?? []).includes('finance');
          if (b.outstanding > 0 && canSeeInvoice) push({ sourceType: 'invoice', sourceId: i.id, type: 'invoice_open', title: t('{0} · tagihan belum lunas', [o.alias]), reason: b.overdueDays ? t('Lewat jatuh tempo {0} hari.', [b.overdueDays]) : 'Belum ada pembayaran yang tercatat.', picName: actor.user.name, dueAt: null, link: `/invoice/${i.id}`, severity: 'attention', amount: toMoneyString(b.outstanding) });
        });
      }
    });
  }

  db.outbox.filter((x) => x.tenantId === tenant && x.actorId === actor.user.id && x.status === 'needs_review').forEach((x) =>
    push({ sourceType: 'outbox', sourceId: x.localId, type: 'sync_review', title: t('Kiriman ulang perlu dicek'), reason: x.lastError ?? x.label, picName: actor.user.name, dueAt: null, link: '/sync', severity: 'blocker', amount: null }),
  );

  const rank = { blocker: 0, attention: 1, info: 2 } as const;
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
