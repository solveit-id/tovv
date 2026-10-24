import type { Ctx } from './ctx';
import { requireOnline } from './ctx';
import { customerCanSeeRequest, requireScope } from './policy';
import { isStaffView, mediaItem, quoteDoc, requestOf, requestSummary, userName } from './mappers';
import { haversineKm } from './tracking';
import type { DemoDb } from './db';
import { PLACES, SERVICE_PACKAGES, STANDARD_RATE } from '@/data/fixtures/reference';
import { ApiError, type NewRequestInput, type PlaceBook, type ServicePackageDTO, type QuoteDoc, type QuoteInput, type RequestDetail, type RequestSummary, type UnitCandidate } from '@/data/api/contract';
import type { CustomerVehicle, Order, Place, Quote, ServiceRequest } from '@/domain/types';
import { evaluatePrice } from '@/domain/pricing';
import { toMoneyString, formatRupiah, formatNumber } from '@/core/format/money';
import { addMinutes, formatAge, formatShortDateTime, secondsBetween } from '@/core/format/time';
import { t } from '@/core/i18n';

const BUFFER_MIN = 30;

function visibleRequests(ctx: Ctx): ServiceRequest[] {
  const db = ctx.store.db;
  const t = ctx.actor.user.tenantId;
  const all = db.requests.filter((r) => r.tenantId === t);
  if (isStaffView(ctx.actor)) return all;
  if (ctx.actor.view === 'customer') return all.filter((r) => customerCanSeeRequest(ctx.actor.user, r));
  return [];
}

function getVisibleRequest(ctx: Ctx, id: string): ServiceRequest {
  const r = visibleRequests(ctx).find((x) => x.id === id);
  if (!r) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
  return r;
}

export function listRequests(ctx: Ctx, filter: 'open' | 'all'): RequestSummary[] {
  const open = new Set(['draft', 'needs_review', 'ready_to_quote', 'quoted']);
  return visibleRequests(ctx)
    .filter((r) => filter === 'all' || open.has(r.status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((r) => requestSummary(ctx.store.db, r, ctx.now));
}

/** Prioritas tarif BIZ-03: tarif akun yang berlaku → tarif standar → review manusia. */
export function resolveRate(db: DemoDb, req: ServiceRequest): RequestDetail['rate'] {
  if (req.businessAccountId) {
    const acc = db.businessAccounts.find((b) => b.id === req.businessAccountId);
    const at = Date.parse(req.createdAt);
    const valid = acc?.rateCards.find((rc) => Date.parse(rc.validFrom) <= at && Date.parse(rc.validTo) > at);
    if (valid) return { source: 'account', amount: toMoneyString(valid.amount), note: t('Tarif akun {0} {1} v{2}', [acc?.name, valid.route, valid.version]) };
    return { source: 'standard', amount: toMoneyString(STANDARD_RATE[req.tenantId]), note: t('Tarif akun {0} kedaluwarsa/tidak ada; pakai tarif standar atau cek manual. Tarif lama tidak dipakai diam-diam.', [acc?.name ?? '']) };
  }
  return { source: 'standard', amount: toMoneyString(STANDARD_RATE[req.tenantId]), note: 'Tarif standar operator' };
}

export function getRequest(ctx: Ctx, id: string): RequestDetail {
  const db = ctx.store.db;
  const r = getVisibleRequest(ctx, id);
  const v = db.vehicles.find((x) => x.id === r.vehicleId)!;
  const acc = r.businessAccountId ? db.businessAccounts.find((b) => b.id === r.businessAccountId) : null;
  const staff = isStaffView(ctx.actor);
  const actions: RequestDetail['allowedActions'] = [];
  if (staff && ['ready_to_quote', 'quoted', 'needs_review'].includes(r.status) && ctx.scopes.has('quote.draft')) actions.push('quote');
  if (staff && r.status === 'needs_review') actions.push('mark_ready');
  if (['draft', 'needs_review', 'ready_to_quote', 'quoted'].includes(r.status) && (staff || r.status === 'draft')) actions.push('cancel');
  if (!['converted', 'lost', 'canceled'].includes(r.status)) actions.push('capture');
  if (r.status === 'draft' && ctx.actor.view === 'customer') actions.push('submit_draft');
  return {
    ...requestSummary(db, r, ctx.now),
    parties: r.parties,
    vehicle: { label: v.label, plate: v.plate, weightKg: v.weightKg, lengthMm: v.lengthMm, widthMm: v.widthMm, condition: v.condition },
    pickup: r.pickup,
    dropoff: r.dropoff,
    timing: { kind: r.timing.kind, start: r.timing.start, end: r.timing.end },
    businessAccount: acc ? { id: acc.id, name: acc.name, poRequired: acc.poRequired, termsVersion: acc.termsVersion } : null,
    poRef: r.poRef ?? null,
    createdByName: userName(db, r.createdBy),
    quotes: db.quotes
      .filter((q) => q.requestId === r.id && (staff || q.status !== 'draft'))
      .sort((a, b) => b.version - a.version)
      .map((q) => quoteDoc(db, q, ctx.actor, ctx.now)),
    media: db.media.filter((m) => m.requestId === r.id && m.stage === 'request_condition').map((m) => mediaItem(db, m)),
    rate: resolveRate(db, r),
    allowedActions: actions,
  };
}

function reviewReasons(input: { vehicle: NewRequestInput['vehicle']; timing: NewRequestInput['timing'] }): string[] {
  const out: string[] = [];
  if (input.vehicle.weightKg === null) out.push('Berat kendaraan belum diketahui');
  if (input.vehicle.lengthMm === null || input.vehicle.widthMm === null) out.push('Dimensi kendaraan belum diketahui');
  if (input.timing.kind === 'immediate' && !input.timing.immediateConfirmed) out.push('Permintaan segera perlu konfirmasi kemampuan unit oleh admin');
  return out;
}

export function createRequest(ctx: Ctx, input: NewRequestInput): RequestSummary {
  const staff = isStaffView(ctx.actor);
  if (staff) requireScope(ctx.scopes, 'request.manage', 'Akun ini tidak dapat mencatat permintaan.');
  else requireScope(ctx.scopes, 'request.create_own', 'Akun ini tidak dapat membuat permintaan.');
  if (!input.pickup.address.trim() || !input.dropoff.address.trim()) {
    throw new ApiError('VALIDATION', t('Lokasi jemput dan tujuan wajib diisi.'), false, { pickup: 'Wajib', dropoff: 'Wajib' });
  }
  if (input.timing.kind !== 'immediate' && !input.timing.start) throw new ApiError('VALIDATION', t('Waktu mulai wajib diisi.'), false, { start: 'Wajib' });
  if (input.timing.kind === 'flexible' && (!input.timing.end || Date.parse(input.timing.end) <= Date.parse(input.timing.start ?? ''))) {
    throw new ApiError('VALIDATION', t('Rentang fleksibel: jam selesai harus setelah jam mulai.'), false, { end: 'Tidak valid' });
  }
  if (staff && input.channel !== 'mobile' && !input.consentNote?.trim()) {
    throw new ApiError('VALIDATION', t('Catat persetujuan pemesan untuk permintaan yang dicatat petugas.'), false, { consent: 'Wajib' });
  }
  return ctx.store.transact((db) => {
    // Idempotensi ORD-05: key sama + payload sama → satu request; payload beda → 409.
    const payloadHash = JSON.stringify({ ...input, idempotencyKey: undefined });
    const dup = db.requests.find((r) => r.idempotencyKey === input.idempotencyKey && r.tenantId === ctx.actor.user.tenantId);
    if (dup) {
      if ((dup as ServiceRequest & { payloadHash?: string }).payloadHash !== payloadHash) {
        throw new ApiError('VERSION_CONFLICT', t('Kode pengiriman ini sudah dipakai untuk isi yang berbeda.'));
      }
      return requestSummary(db, dup, ctx.now);
    }
    const tenant = ctx.actor.user.tenantId;
    const n = db.requests.filter((r) => r.tenantId === tenant).length + 1;
    const alias = `${tenant === 'tenant-a' ? 'A' : 'B'}${String(n).padStart(2, '0')}`;
    const id = `R-${alias}`;
    const vehicle: CustomerVehicle = { id: `V-${alias}`, requestId: id, ...input.vehicle };
    db.vehicles.push(vehicle);
    const reasons = reviewReasons(input);
    const req: ServiceRequest & { payloadHash: string } = {
      id,
      alias,
      tenantId: tenant,
      day: 30,
      channel: input.channel,
      status: input.asDraft ? 'draft' : reasons.length ? 'needs_review' : 'ready_to_quote',
      customerUserId: staff ? input.customerUserId : ctx.actor.user.id,
      businessAccountId: staff ? input.businessAccountId : (ctx.actor.user.businessAccountId ?? null),
      parties: input.parties,
      service: input.service ?? 'car_towing',
      vehicleId: vehicle.id,
      pickup: input.pickup,
      dropoff: input.dropoff,
      timing: input.timing,
      createdAt: ctx.now,
      createdBy: ctx.actor.user.id,
      needsReviewReasons: reasons,
      poRef: input.poRef,
      sourceOrderId: null,
      idempotencyKey: input.idempotencyKey,
      payloadHash,
    };
    db.requests.push(req);
    return requestSummary(db, req, ctx.now);
  });
}

export function submitDraft(ctx: Ctx, id: string): RequestSummary {
  return ctx.store.transact((db) => {
    const r = db.requests.find((x) => x.id === id && x.tenantId === ctx.actor.user.tenantId);
    if (!r || !customerCanSeeRequest(ctx.actor.user, r)) throw new ApiError('NOT_FOUND', t('Draf tidak ditemukan.'));
    if (r.status !== 'draft') throw new ApiError('VERSION_CONFLICT', t('Permintaan ini sudah dikirim.'));
    const v = db.vehicles.find((x) => x.id === r.vehicleId)!;
    r.needsReviewReasons = reviewReasons({ vehicle: v, timing: r.timing });
    r.status = r.needsReviewReasons.length ? 'needs_review' : 'ready_to_quote';
    return requestSummary(db, r, ctx.now);
  });
}

export function completeReview(ctx: Ctx, id: string, spec: { weightKg: number; lengthMm: number; widthMm: number; immediateConfirmed: boolean }): RequestSummary {
  requireScope(ctx.scopes, 'request.manage', 'Hanya admin/owner yang dapat meninjau data permintaan.');
  if (spec.weightKg <= 0 || spec.lengthMm <= 0 || spec.widthMm <= 0) throw new ApiError('VALIDATION', t('Berat dan ukuran harus diisi dari sumber yang jelas.'));
  return ctx.store.transact((db) => {
    const r = db.requests.find((x) => x.id === id && x.tenantId === ctx.actor.user.tenantId);
    if (!r) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
    const v = db.vehicles.find((x) => x.id === r.vehicleId)!;
    Object.assign(v, { weightKg: spec.weightKg, lengthMm: spec.lengthMm, widthMm: spec.widthMm });
    if (r.timing.kind === 'immediate') r.timing.immediateConfirmed = spec.immediateConfirmed;
    r.needsReviewReasons = reviewReasons({ vehicle: v, timing: r.timing });
    r.status = r.needsReviewReasons.length ? 'needs_review' : 'ready_to_quote';
    return requestSummary(db, r, ctx.now);
  });
}

export function cancelRequest(ctx: Ctx, id: string, reason: string): RequestSummary {
  if (!reason.trim()) throw new ApiError('VALIDATION', t('Alasan pembatalan wajib diisi.'));
  return ctx.store.transact((db) => {
    const r = db.requests.find((x) => x.id === id && x.tenantId === ctx.actor.user.tenantId);
    if (!r || (!isStaffView(ctx.actor) && !customerCanSeeRequest(ctx.actor.user, r))) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
    if (['converted', 'lost', 'canceled'].includes(r.status)) throw new ApiError('VERSION_CONFLICT', t('Permintaan ini sudah final.'));
    r.status = 'canceled';
    r.cancelReason = reason;
    db.quotes.filter((q) => q.requestId === r.id && q.status === 'sent').forEach((q) => (q.status = 'superseded'));
    return requestSummary(db, r, ctx.now);
  });
}

function overlaps(db: DemoDb, unitId: string, start: string, end: string, ignoreOrderId?: string) {
  const s = Date.parse(start);
  const e = Date.parse(addMinutes(end, BUFFER_MIN));
  return db.reservations.find(
    (r) => r.unitId === unitId && r.status === 'confirmed' && r.orderId !== ignoreOrderId && Date.parse(r.start) < e && Date.parse(r.end) > s,
  );
}

/** FLT-02/03/09: filter keras dulu, lalu ranking biaya → waktu. Data tidak cukup → review, bukan tebakan. */
export function unitCandidates(ctx: Ctx, requestId: string, start: string, end: string): UnitCandidate[] {
  requireScope(ctx.scopes, 'request.view_all', 'Hanya admin/owner yang melihat kandidat unit.');
  const db = ctx.store.db;
  const r = requestOf(db, requestId);
  if (r.tenantId !== ctx.actor.user.tenantId) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
  const v = db.vehicles.find((x) => x.id === r.vehicleId)!;
  const tripKm = r.pickup.lat !== null && r.dropoff.lat !== null ? haversineKm({ lat: r.pickup.lat, lng: r.pickup.lng! }, { lat: r.dropoff.lat, lng: r.dropoff.lng! }) : null;
  const rows = db.units
    .filter((u) => u.tenantId === r.tenantId)
    .map((u) => {
      const rejections: string[] = [];
      if (u.status !== 'active') rejections.push('Unit tidak beroperasi (out of service)');
      if (v.weightKg === null || v.lengthMm === null || v.widthMm === null) rejections.push('Berat/dimensi kendaraan belum diketahui — perlu review');
      else {
        if (u.capacityKg < v.weightKg) rejections.push(`Kapasitas ${formatNumber(u.capacityKg)} kg < berat ${formatNumber(v.weightKg)} kg`);
        if (u.deckLengthMm < v.lengthMm) rejections.push(`Dek ${u.deckLengthMm} mm < panjang ${v.lengthMm} mm`);
        if (u.deckWidthMm < v.widthMm) rejections.push(`Dek ${u.deckWidthMm} mm < lebar ${v.widthMm} mm`);
      }
      const clash = overlaps(db, u.id, start, end);
      const age = secondsBetween(u.lastPosition.capturedAt, ctx.now);
      const dist = r.pickup.lat !== null ? haversineKm(u.lastPosition, { lat: r.pickup.lat, lng: r.pickup.lng! }) : null;
      const totalKm = dist !== null && tripKm !== null ? dist + tripKm : null;
      const est = totalKm === null ? null : u.ownership === 'partner' ? u.baseCost + 100_000 : Math.round((u.baseCost + u.ratePerKm * totalKm * 2) / 10_000) * 10_000;
      return {
        unitId: u.id,
        code: u.code,
        label: u.label,
        ownership: u.ownership,
        partnerName: u.partnerName ?? null,
        eligible: rejections.length === 0,
        rejections,
        capacityKg: u.capacityKg,
        deck: `${u.deckLengthMm}×${u.deckWidthMm} mm`,
        distanceKm: dist === null ? null : Math.round(dist * 10) / 10,
        distanceNote: 'Jarak garis lurus dari posisi terakhir, bukan jarak jalan',
        etaMinutes: dist === null ? null : Math.max(5, Math.round((dist / 30) * 60)),
        positionAge: formatAge(u.lastPosition.capturedAt, ctx.now),
        positionFreshness: age > 90 ? ('stale' as const) : ('live' as const),
        estimatedDirect: est === null ? null : toMoneyString(est),
        nextFreeAt: clash ? addMinutes(clash.end, 0) : null,
        conflict: !!clash,
        rank: null as number | null,
        reason: '',
        _est: est ?? Number.MAX_SAFE_INTEGER,
      };
    });
  const rankable = rows.filter((x) => x.eligible && !x.conflict).sort((a, b) => a._est - b._est || (a.etaMinutes ?? 999) - (b.etaMinutes ?? 999));
  rankable.forEach((x, i) => {
    x.rank = i + 1;
    x.reason = t('{0} · {1} · ETA ±{2} mnt{3}', [i === 0 ? 'Biaya estimasi terendah yang layak' : 'Alternatif layak', formatRupiah(x._est), x.etaMinutes, x.positionFreshness === 'stale' ? ' dari lokasi lama' : '']);
  });
  rows.forEach((x) => {
    if (!x.eligible) x.reason = t('Tidak cocok: {0}', [x.rejections[0]]);
    else if (x.conflict) x.reason = t('Jadwal bentrok; kosong setelah {0}', [formatShortDateTime(x.nextFreeAt)]);
  });
  return rows
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    .map(({ _est, ...rest }) => rest);
}

export function sendQuote(ctx: Ctx, input: QuoteInput): QuoteDoc {
  requireScope(ctx.scopes, 'quote.draft', 'Akun ini tidak dapat menyusun penawaran.');
  requireOnline(ctx.store.db, 'Mengirim penawaran');
  const db = ctx.store.db;
  const r = requestOf(db, input.requestId);
  if (r.tenantId !== ctx.actor.user.tenantId) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
  if (!['ready_to_quote', 'quoted'].includes(r.status)) throw new ApiError('VERSION_CONFLICT', r.status === 'needs_review' ? 'Lengkapi data kendaraan sebelum menawar.' : 'Permintaan tidak dapat ditawar pada status ini.');
  const unit = db.units.find((u) => u.id === input.unitId);
  if (!unit) throw new ApiError('VALIDATION', t('Pilih unit.'));
  const cand = unitCandidates(ctx, r.id, input.scheduleStart, input.scheduleEnd).find((c) => c.unitId === unit.id);
  if (!cand?.eligible) throw new ApiError('VALIDATION', t('Unit {0} tidak cocok: {1}. Mengubah harga tidak mengubah kapasitas.', [unit.code, cand?.rejections[0] ?? 'tidak memenuhi syarat']));
  const priorityFee = input.priority?.fee ?? 0;
  const tenantFee = r.tenantId === 'tenant-b' ? 10_000 : 0;
  const result = evaluatePrice({ price: input.price + priorityFee, direct: input.direct === null ? null : input.direct, allocation: input.allocation, reserve: input.reserve, feePerService: tenantFee, adminHandling: 0, targetSurplus: input.targetSurplus });
  const isOwner = ctx.scopes.has('quote.override_any');
  if (!ctx.scopes.has('quote.send')) {
    throw new ApiError('ESCALATION_REQUIRED', t('Mengirim penawaran perlu owner atau izin kirim penawaran. Draf bisa diteruskan ke owner.'));
  }
  if (result.certainty === 'incomplete' && !isOwner) {
    throw new ApiError('ESCALATION_REQUIRED', t('Biaya langsung belum lengkap. Delegasi hanya berlaku kalau biaya lengkap; serahkan ke owner.'));
  }
  if (result.gapToTarget !== null && result.gapToTarget < 0) {
    if (!input.belowTargetReason?.trim()) throw new ApiError('VALIDATION', t('Harga di bawah target perlu alasan.'), false, { reason: 'Wajib' });
    if (!isOwner) {
      const d = db.delegations.find((x) => x.delegateId === ctx.actor.user.id && !x.revokedAt && Date.parse(x.expiresAt) > Date.parse(ctx.now));
      const limit = d?.limit ?? 0;
      if (!ctx.scopes.has('quote.override_within_limit') || -result.gapToTarget > limit) {
        throw new ApiError('ESCALATION_REQUIRED', t('Diskon {0} dari target melebihi batas delegasi {1}. Serahkan ke owner.', [formatRupiah(-result.gapToTarget), formatRupiah(limit)]));
      }
    }
  }
  return ctx.store.transact((d) => {
    const req = d.requests.find((x) => x.id === r.id)!;
    const prior = d.quotes.filter((q) => q.requestId === r.id);
    prior.filter((q) => q.status === 'sent').forEach((q) => (q.status = 'superseded'));
    const version = (prior.reduce((m, q) => Math.max(m, q.version), 0) || 0) + 1;
    const base = Math.round((input.price * 0.7) / 10_000) * 10_000;
    const q: Quote = {
      id: `Q-${r.alias}-v${version}`,
      requestId: r.id,
      tenantId: r.tenantId,
      version,
      status: 'sent',
      amount: input.price + priorityFee,
      items: [
        { label: 'Jasa towing flatbed', amount: base },
        { label: 'Jarak tempuh dan tol', amount: input.price - base },
        ...(input.priority ? [{ label: 'Tarif prioritas (jadwal didahulukan)', amount: priorityFee }] : []),
      ],
      priority: input.priority,
      unitId: unit.id,
      scheduleStart: input.scheduleStart,
      scheduleEnd: input.scheduleEnd,
      validUntil: addMinutes(ctx.now, input.validHours * 60),
      sentAt: ctx.now,
      createdAt: ctx.now,
      createdBy: ctx.actor.user.id,
      termsVersion: r.businessAccountId ? (d.businessAccounts.find((b) => b.id === r.businessAccountId)?.termsVersion ?? null) : null,
      estimate: {
        direct: input.direct,
        allocation: input.allocation,
        reserve: input.reserve,
        feePerService: tenantFee,
        adminHandling: 0,
        targetSurplus: input.targetSurplus,
        components: [{ label: 'Biaya langsung (jalan ke lokasi, muat, BBM, tol, kru)', amount: input.direct, source: t('Perkiraan unit {0} {1}', [unit.code, unit.costTemplateVersion]) }],
      },
      belowTargetReason: input.belowTargetReason,
      acceptedBy: null,
      acceptedAt: null,
      assistedConsent: null,
      rejectedReason: null,
    };
    d.quotes.push(q);
    req.status = 'quoted';
    if (req.customerUserId) {
      d.inbox.push({ id: `IB-${d.inbox.length + 1}`, eventId: `evt-quote-${q.id}`, tenantId: req.tenantId, userId: req.customerUserId, type: 'quote', title: t('Penawaran v{0} untuk {1}', [version, req.alias]), body: t('{0} · berlaku sampai {1}', [formatRupiah(q.amount), formatShortDateTime(q.validUntil)]), link: `/quote/${q.id}`, createdAt: ctx.now, read: false });
    }
    return quoteDoc(d, q, ctx.actor, ctx.now);
  });
}

export function getQuote(ctx: Ctx, id: string): QuoteDoc {
  const db = ctx.store.db;
  const q = db.quotes.find((x) => x.id === id);
  if (!q) throw new ApiError('NOT_FOUND', t('Penawaran tidak ditemukan.'));
  getVisibleRequest(ctx, q.requestId);
  return quoteDoc(db, q, ctx.actor, ctx.now);
}

export interface AcceptOptions {
  poRef?: string | null;
  assistedNote?: string | null;
  approverId?: string | null;
}

/** AcceptQuote: validasi versi, expiry, mandat, PO, lalu cek kapasitas dan buat order dalam satu transaksi. */
export function acceptQuote(ctx: Ctx, quoteId: string, opts: AcceptOptions): { orderId: string } {
  requireOnline(ctx.store.db, 'Menyetujui penawaran dan reservasi unit');
  const db0 = ctx.store.db;
  if (db0.faults.planExpired) throw new ApiError('PLAN_BLOCKED', t('Paket langganan DEMO usaha ini kedaluwarsa: order baru diblokir sesuai aturan demo. Pekerjaan yang jalan, bukti, invoice, dan pembayaran tetap bisa dibuka.'));
  return ctx.store.transact((db) => {
    const q = db.quotes.find((x) => x.id === quoteId);
    if (!q || q.tenantId !== ctx.actor.user.tenantId) throw new ApiError('NOT_FOUND', t('Penawaran tidak ditemukan.'));
    const r = db.requests.find((x) => x.id === q.requestId)!;
    if (q.status === 'superseded') throw new ApiError('QUOTE_SUPERSEDED', t('Versi ini sudah diganti. Buka versi terbaru.'));
    if (q.status !== 'sent') throw new ApiError('VERSION_CONFLICT', t('Penawaran ini sudah tidak menunggu persetujuan.'));
    if (Date.parse(q.validUntil) <= Date.parse(ctx.now)) {
      q.status = 'expired';
      throw new ApiError('QUOTE_EXPIRED', t('Penawaran sudah kedaluwarsa. Minta versi baru; versi lama tidak bisa diterima.'));
    }
    const acc = r.businessAccountId ? db.businessAccounts.find((b) => b.id === r.businessAccountId)! : null;
    let acceptedBy = ctx.actor.user.id;
    let consent: Quote['assistedConsent'] = null;
    if (ctx.actor.view === 'customer') {
      if (!customerCanSeeRequest(ctx.actor.user, r)) throw new ApiError('NOT_FOUND', t('Penawaran tidak ditemukan.'));
      if (acc && !ctx.scopes.has('quote.approve_org')) throw new ApiError('FORBIDDEN', t('Pemesan tidak bisa menyetujui harga. Minta penyetuju organisasi.'));
    } else {
      requireScope(ctx.scopes, 'request.manage', 'Akun ini tidak dapat mencatat persetujuan.');
      if (!opts.assistedNote?.trim()) throw new ApiError('VALIDATION', t('Persetujuan yang dicatat petugas wajib menyebut lewat apa dan pernyataan pemesannya.'), false, { assistedNote: 'Wajib' });
      if (acc) {
        const approver = db.users.find((u) => u.id === opts.approverId && u.businessAccountId === acc.id && (u.b2bRoles ?? []).includes('approver'));
        if (!approver) throw new ApiError('FORBIDDEN', t('Pesanan bisnis yang dicatat petugas tetap perlu penyetuju organisasi; pilih penyetujunya.'));
        acceptedBy = approver.id;
      } else if (r.customerUserId) acceptedBy = r.customerUserId;
      consent = { actorId: ctx.actor.user.id, channel: r.channel === 'mobile' ? 'phone' : r.channel, at: ctx.now, note: opts.assistedNote };
    }
    const po = opts.poRef?.trim() || r.poRef || null;
    if (acc?.poRequired && !po) throw new ApiError('VALIDATION', t('Nomor PO wajib untuk {0}.', [acc.name]), false, { poRef: 'Wajib' });
    const clash = overlaps(db, q.unitId!, q.scheduleStart!, q.scheduleEnd!);
    if (clash) {
      const other = db.orders.find((o) => o.id === clash.orderId);
      throw new ApiError('CAPACITY_CONFLICT', t('Unit sudah dipakai {0} pada waktu itu. Penawaran tidak bisa diterima sebagian; pilih jadwal/unit lain.', [other?.alias ?? '']));
    }
    q.status = 'accepted';
    q.acceptedBy = acceptedBy;
    q.acceptedAt = ctx.now;
    q.assistedConsent = consent;
    r.status = 'converted';
    r.poRef = po;
    const tenant = db.tenants.find((t) => t.id === r.tenantId)!;
    const order: Order = {
      id: `O-${r.alias}`,
      alias: r.alias,
      tenantId: r.tenantId,
      requestId: r.id,
      quoteId: q.id,
      status: 'confirmed',
      confirmedAt: ctx.now,
      unitId: q.unitId!,
      scheduleStart: q.scheduleStart!,
      scheduleEnd: q.scheduleEnd!,
      events: [{ id: `EV-${r.alias}-01`, status: 'confirmed', occurredAt: ctx.now, actorId: 'system', source: 'server' }],
      handedOverAt: null,
      closedAt: null,
      canceledAt: null,
      abortedAt: null,
      estimateDirect: q.estimate.direct ?? 0,
      costCompleteness: 'provisional',
      evidence: 'incomplete',
      planSnapshot: { kind: tenant.plan.kind, version: tenant.plan.version, feePerService: tenant.plan.kind === 'success' ? tenant.plan.amount : 0 },
      readiness: { contact: false, pickupReady: false, receiverReady: null },
      version: 1,
    };
    db.orders.push(order);
    db.reservations.push({ id: `RS-${r.alias}`, orderId: order.id, unitId: order.unitId, driverId: 'unassigned', start: order.scheduleStart, end: addMinutes(order.scheduleEnd, BUFFER_MIN), status: 'confirmed' });
    if (tenant.plan.kind === 'success') db.usage.push({ id: `US-${r.alias}`, tenantId: tenant.id, orderId: order.id, status: 'not_eligible', amount: 0, note: '' });
    db.media.filter((m) => m.requestId === r.id && m.orderId === null).forEach((m) => (m.orderId = order.id));
    return { orderId: order.id };
  });
}

export function rejectQuote(ctx: Ctx, quoteId: string, reason: string, endRequest: boolean): QuoteDoc {
  if (!reason.trim()) throw new ApiError('VALIDATION', t('Tulis alasan menolak supaya operator bisa menyesuaikan.'));
  return ctx.store.transact((db) => {
    const q = db.quotes.find((x) => x.id === quoteId);
    if (!q || q.tenantId !== ctx.actor.user.tenantId) throw new ApiError('NOT_FOUND', t('Penawaran tidak ditemukan.'));
    const r = db.requests.find((x) => x.id === q.requestId)!;
    if (ctx.actor.view === 'customer') {
      if (!customerCanSeeRequest(ctx.actor.user, r)) throw new ApiError('NOT_FOUND', t('Penawaran tidak ditemukan.'));
      if (r.businessAccountId && !ctx.scopes.has('quote.approve_org')) throw new ApiError('FORBIDDEN', t('Hanya penyetuju organisasi yang bisa menolak harga.'));
    }
    if (q.status !== 'sent') throw new ApiError('VERSION_CONFLICT', t('Penawaran ini sudah tidak menunggu keputusan.'));
    q.status = 'rejected';
    q.rejectedReason = reason;
    if (endRequest) {
      r.status = 'lost';
      r.lostReason = reason;
    }
    return quoteDoc(db, q, ctx.actor, ctx.now);
  });
}

/** ORD-07/BIZ-04: pesan ulang membuat draf baru; harga, unit, jadwal, approval dan penerima dikonfirmasi ulang. */
export function reorder(ctx: Ctx, orderId: string): RequestSummary {
  const db = ctx.store.db;
  const o = db.orders.find((x) => x.id === orderId && x.tenantId === ctx.actor.user.tenantId);
  if (!o) throw new ApiError('NOT_FOUND', t('Order tidak ditemukan.'));
  const src = requestOf(db, o.requestId);
  if (ctx.actor.view === 'customer' && !customerCanSeeRequest(ctx.actor.user, src)) throw new ApiError('NOT_FOUND', t('Order tidak ditemukan.'));
  const v = db.vehicles.find((x) => x.id === src.vehicleId)!;
  return createRequest(ctx, {
    channel: ctx.actor.view === 'customer' ? (src.businessAccountId ? 'b2b' : 'mobile') : src.channel,
    customerUserId: src.customerUserId,
    businessAccountId: src.businessAccountId,
    parties: { ...src.parties, receiver: '' },
    vehicle: { label: v.label, plate: v.plate, weightKg: v.weightKg, lengthMm: v.lengthMm, widthMm: v.widthMm, condition: 'Konfirmasi ulang kondisi kendaraan' },
    pickup: src.pickup,
    dropoff: src.dropoff,
    timing: { kind: 'scheduled', start: addMinutes(ctx.now, 24 * 60), end: null },
    poRef: null,
    consentNote: ctx.actor.view === 'customer' ? null : 'Pesan ulang dibantu admin',
    asDraft: true,
    idempotencyKey: `reorder-${orderId}-${ctx.now}`,
  });
}

/** Konteks minimum untuk kamera: tanpa harga/biaya, sehingga aman untuk driver yang bertugas. */
export function captureContext(ctx: Ctx, requestId: string) {
  const db = ctx.store.db;
  const r = requestOf(db, requestId);
  if (r.tenantId !== ctx.actor.user.tenantId) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
  const staff = isStaffView(ctx.actor);
  const customer = ctx.actor.view === 'customer' && customerCanSeeRequest(ctx.actor.user, r);
  const order = db.orders.find((o) => o.requestId === r.id);
  const driver = ctx.actor.view === 'driver' && !!order && db.assignments.some((a) => a.orderId === order.id && a.driverId === ctx.actor.user.id && a.status === 'accepted');
  if (!staff && !customer && !driver) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
  const v = db.vehicles.find((x) => x.id === r.vehicleId)!;
  return { id: r.id, alias: r.alias, vehicle: { label: v.label, plate: v.plate }, pickup: r.pickup, dropoff: r.dropoff };
}

/** Daftar pelanggan tenant untuk pencatatan dibantu admin (tanpa data pribadi berlebih). */
export function listCustomers(ctx: Ctx) {
  requireScope(ctx.scopes, 'request.manage', 'Hanya admin/owner.');
  const db = ctx.store.db;
  return db.users
    .filter((u) => u.tenantId === ctx.actor.user.tenantId && u.customerKind)
    .map((u) => {
      const acc = u.businessAccountId ? db.businessAccounts.find((b) => b.id === u.businessAccountId) : null;
      return { userId: u.id, name: u.name, businessAccountId: acc?.id ?? null, businessAccountName: acc?.name ?? null, poRequired: acc?.poRequired ?? false, roles: u.b2bRoles ?? [] };
    });
}

/** Paket layanan; harga "mulai dari" adalah contoh DEMO. */
export function servicePackages(): ServicePackageDTO[] {
  return SERVICE_PACKAGES.map((p) => ({ ...p, startFrom: toMoneyString(p.startFrom) }));
}

export function demoPlaces() {
  return Object.values(PLACES);
}

/**
 * Buku tempat untuk pemilih lokasi: rute favorit akun bisnis, tempat contoh (sintetis), dan lokasi yang
 * terakhir dipakai di permintaan yang boleh dilihat akun ini (terbaru dulu, tanpa duplikat alamat).
 */
export function placeBook(ctx: Ctx): PlaceBook {
  const db = ctx.store.db;
  const ba = ctx.actor.user.businessAccountId ? db.businessAccounts.find((b) => b.id === ctx.actor.user.businessAccountId) : null;
  const saved: PlaceBook['saved'] = [];
  ba?.favoriteRoutes.forEach((r) => {
    saved.push({ key: `${r.id}-from`, kind: 'route', place: r.pickup });
    saved.push({ key: `${r.id}-to`, kind: 'route', place: r.dropoff });
  });
  [PLACES.surabayaB, PLACES.surabayaA, PLACES.sidoarjo, PLACES.gresik].forEach((p, i) => {
    if (!saved.some((x) => x.place.address === p.address)) saved.push({ key: `sample-${i}`, kind: i === 0 ? 'home' : 'sample', place: p });
  });
  const seen = new Set<string>();
  const recent: Place[] = [];
  [...visibleRequests(ctx)]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .forEach((r) => {
      [r.pickup, r.dropoff].forEach((p) => {
        if (recent.length >= 5 || seen.has(p.address)) return;
        seen.add(p.address);
        recent.push(p);
      });
    });
  return { saved, recent };
}
