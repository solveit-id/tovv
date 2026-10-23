import type { DemoDb } from './db';
import type { Actor } from './policy';
import { customerCanSeeRequest } from './policy';
import type {
  Assignment,
  ExecutionStatus,
  Invoice,
  MediaPacket,
  Order,
  PaymentProof,
  PaymentRequest,
  Quote,
  ServiceRequest,
} from '@/domain/types';
import type {
  AssignmentDTO,
  IncidentDTO,
  InvoiceDoc,
  MediaItem,
  OrderAction,
  OrderDetail,
  OrderSummary,
  PaymentRequestDTO,
  ProofDTO,
  QuoteDoc,
  RequestSummary,
  TimelineEntry,
} from '@/data/api/contract';
import { ApiError } from '@/data/api/contract';
import { toMoneyString } from '@/core/format/money';
import { executionStatus, EXECUTION_FLOW } from '@/core/i18n/status';
import { evaluatePrice } from '@/domain/pricing';
import { invoiceBalance, receiptUnapplied } from '@/domain/ledger';
import { contributionFor } from '@/domain/analytics';
import { formatTime } from '@/core/format/time';
import { t } from '@/core/i18n';

export const userName = (db: DemoDb, id: string | null | undefined) =>
  !id ? '—' : id === 'system' ? 'Sistem' : (db.users.find((u) => u.id === id)?.name ?? id);

export const isStaffView = (actor: Actor) => actor.view === 'owner' || actor.view === 'admin';

export function requestOf(db: DemoDb, id: string): ServiceRequest {
  const r = db.requests.find((x) => x.id === id);
  if (!r) throw new ApiError('NOT_FOUND', t('Permintaan tidak ditemukan.'));
  return r;
}

export function currentAssignment(db: DemoDb, orderId: string): Assignment | null {
  const list = db.assignments.filter((a) => a.orderId === orderId);
  return (
    list.find((a) => a.status === 'accepted') ??
    list.find((a) => a.status === 'offered') ??
    list.find((a) => a.status === 'completed') ??
    list[list.length - 1] ??
    null
  );
}

/** Policy baca order: tenant sama + peran; customer hanya miliknya/organisasinya; driver hanya tugasnya. */
export function assertCanSeeOrder(db: DemoDb, actor: Actor, order: Order): void {
  if (order.tenantId !== actor.user.tenantId) throw new ApiError('NOT_FOUND', t('Order tidak ditemukan.'));
  if (isStaffView(actor)) return;
  if (actor.view === 'customer') {
    if (!customerCanSeeRequest(actor.user, requestOf(db, order.requestId))) throw new ApiError('NOT_FOUND', t('Order tidak ditemukan.'));
    return;
  }
  const mine = db.assignments.some((a) => a.orderId === order.id && a.driverId === actor.user.id && ['offered', 'accepted', 'completed'].includes(a.status));
  if (!mine) throw new ApiError('NOT_FOUND', t('Tugas tidak ditemukan atau sudah dipindahkan.'));
}

export function mediaItem(db: DemoDb, m: MediaPacket): MediaItem {
  const out = db.outbox.find((o) => o.aggregateId === m.id && o.commandType === 'media.upload');
  return {
    id: m.id,
    stage: m.stage,
    slot: m.slot,
    captureOrigin: m.captureOrigin,
    status: m.status,
    eventAt: m.eventAt,
    deviceCapturedAt: m.deviceCapturedAt,
    serverReceivedAt: m.serverReceivedAt,
    locationSource: m.locationSource,
    latitude: m.latitude,
    longitude: m.longitude,
    accuracyM: m.accuracyM,
    locationCapturedAt: m.locationCapturedAt,
    note: m.note,
    synthetic: m.synthetic,
    originalUri: m.originalUri,
    overlayUri: m.overlayUri,
    md5: m.originalMd5,
    uploaderName: userName(db, m.uploaderId),
    syncStatus: out?.status ?? null,
  };
}

function invoiceStateFor(db: DemoDb, orderId: string, now: string) {
  const inv = db.invoices.find((i) => i.orderId === orderId && (i.status === 'issued' || i.status === 'corrected'));
  if (!inv) return { invoiceStatus: null, collection: null, outstanding: null };
  const b = invoiceBalance(db, inv.id, now);
  return { invoiceStatus: inv.status, collection: b.collection, outstanding: toMoneyString(b.outstanding) };
}

const NEXT_STEP: Record<ExecutionStatus, string> = {
  confirmed: 'Tunggu petugas menerima tugas',
  assigned: 'Petugas berangkat ke lokasi jemput',
  en_route_pickup: 'Petugas menuju lokasi jemput',
  arrived_pickup: 'Foto kondisi sebelum dimuat',
  loading: 'Konfirmasi kendaraan sudah aman dimuat',
  in_transit: 'Menuju lokasi tujuan',
  arrived_delivery: 'Serah-terima dengan penerima',
  handed_over: 'Terbitkan invoice',
  closed: 'Selesai',
  canceled: 'Dibatalkan',
  aborted: 'Dihentikan; cek penguasaan kendaraan',
};

export function orderSummary(db: DemoDb, order: Order, now: string): OrderSummary {
  const req = requestOf(db, order.requestId);
  const vehicle = db.vehicles.find((v) => v.id === req.vehicleId)!;
  const asg = currentAssignment(db, order.id);
  const unit = db.units.find((u) => u.id === order.unitId);
  const inv = invoiceStateFor(db, order.id, now);
  const coPending = db.changeOrders.some((c) => c.orderId === order.id && c.status === 'pending');
  let next = NEXT_STEP[order.status];
  if (order.status === 'handed_over' && inv.invoiceStatus) next = order.evidence === 'disputed' ? 'Tinjau keberatan serah-terima' : inv.collection === 'settled' ? 'Tagihan tercatat lunas (demo)' : 'Menunggu penerimaan pembayaran';
  if (order.status === 'confirmed' && asg?.status === 'offered') next = t('Menunggu {0} menerima tugas', [userName(db, asg.driverId)]);
  return {
    id: order.id,
    alias: order.alias,
    tenantId: order.tenantId,
    status: order.status,
    customerLabel: req.parties.orderer + (req.businessAccountId ? ` · ${db.businessAccounts.find((b) => b.id === req.businessAccountId)?.name}` : ''),
    vehicleLabel: vehicle.label,
    plate: vehicle.plate,
    pickup: req.pickup,
    dropoff: req.dropoff,
    scheduleStart: order.scheduleStart,
    scheduleEnd: order.scheduleEnd,
    unitCode: unit?.code ?? '—',
    driverName: asg ? userName(db, asg.driverId) : null,
    assignmentStatus: asg?.status ?? null,
    evidence: order.evidence,
    costCompleteness: order.costCompleteness,
    incidentOpen: db.incidents.some((i) => i.orderId === order.id && i.status === 'open'),
    changeOrderPending: coPending,
    ...inv,
    nextStep: next,
  };
}

export function timeline(order: Order): TimelineEntry[] {
  const at = (s: ExecutionStatus) => order.events.find((e) => e.status === s);
  if (order.status === 'canceled' || order.status === 'aborted') {
    return order.events.map((e, i, arr) => ({
      status: e.status,
      label: executionStatus[e.status].label,
      at: e.occurredAt,
      state: i === arr.length - 1 ? 'current' : 'done',
    }));
  }
  const idx = EXECUTION_FLOW.indexOf(order.status);
  return EXECUTION_FLOW.map((s, i) => {
    const ev = at(s);
    return {
      status: s,
      label: executionStatus[s].label,
      at: ev?.occurredAt ?? null,
      state: ev?.source === 'local_pending' ? 'pending_sync' : i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
    };
  });
}

export function quoteDoc(db: DemoDb, q: Quote, actor: Actor, now: string): QuoteDoc {
  const req = requestOf(db, q.requestId);
  const tenant = db.tenants.find((t) => t.id === q.tenantId)!;
  const unit = q.unitId ? db.units.find((u) => u.id === q.unitId) : null;
  const staff = isStaffView(actor);
  const expired = q.status === 'sent' && Date.parse(q.validUntil) <= Date.parse(now);
  const status = expired ? 'expired' : q.status;
  const actions: QuoteDoc['allowedActions'] = [];
  let approvalNote: string | null = null;
  if (status === 'sent' && actor.view === 'customer') {
    const b2b = !!actor.user.businessAccountId;
    if (!b2b || (actor.user.b2bRoles ?? []).includes('approver')) actions.push('accept', 'reject');
    else approvalNote = 'Anda pemesan. Persetujuan harga memerlukan approver organisasi.';
  }
  if (staff && (status === 'expired' || status === 'sent' || status === 'rejected')) actions.push('new_version');
  return {
    id: q.id,
    requestId: q.requestId,
    version: q.version,
    status,
    amount: toMoneyString(q.amount),
    items: q.items.map((i) => ({ label: i.label, amount: toMoneyString(i.amount) })),
    priority: q.priority ? { fee: toMoneyString(q.priority.fee), commitment: q.priority.commitment, failureTerms: q.priority.failureTerms } : null,
    validUntil: q.validUntil,
    sentAt: q.sentAt,
    unitLabel: unit ? `${unit.code} · ${unit.ownership === 'partner' ? 'mitra' : 'unit sendiri'}` : null,
    scheduleStart: q.scheduleStart,
    scheduleEnd: q.scheduleEnd,
    termsVersion: q.termsVersion,
    operatorName: tenant.name,
    acceptedByName: q.acceptedBy ? userName(db, q.acceptedBy) : null,
    acceptedAt: q.acceptedAt,
    assistedConsent: q.assistedConsent
      ? { actorName: userName(db, q.assistedConsent.actorId), channel: q.assistedConsent.channel, at: q.assistedConsent.at, note: q.assistedConsent.note }
      : null,
    rejectedReason: q.rejectedReason,
    internal: staff
      ? {
          estimate: evaluatePrice({
            price: q.amount,
            direct: q.estimate.direct,
            allocation: q.estimate.allocation,
            reserve: q.estimate.reserve,
            feePerService: q.estimate.feePerService,
            adminHandling: q.estimate.adminHandling,
            targetSurplus: q.estimate.targetSurplus,
          }),
          directCost: q.estimate.direct === null ? null : toMoneyString(q.estimate.direct),
          belowTargetReason: q.belowTargetReason,
          components: q.estimate.components.map((c) => ({ label: c.label, amount: c.amount === null ? null : toMoneyString(c.amount), source: c.source })),
        }
      : null,
    allowedActions: actions,
    approvalNote: req.businessAccountId && !approvalNote && actor.view === 'customer' && status === 'sent' ? 'Anda approver organisasi.' : approvalNote,
  };
}

export function assignmentDto(db: DemoDb, a: Assignment): AssignmentDTO {
  return {
    id: a.id,
    driverId: a.driverId,
    driverName: userName(db, a.driverId),
    unitCode: db.units.find((u) => u.id === a.unitId)?.code ?? '—',
    status: a.status,
    offeredAt: a.offeredAt,
    respondedAt: a.respondedAt,
    reason: a.reason,
  };
}

const INCIDENT_LABEL: Record<string, string> = {
  receiver_not_ready: 'Penerima belum siap',
  vehicle_issue: 'Masalah kendaraan',
  access_blocked: 'Akses jalan terhalang',
  custody_abort: 'Abort dan penitipan',
  handover_dispute: 'Keberatan serah-terima',
  other: 'Kendala lain',
};

const EVIDENCE_SLOTS: { stage: MediaPacket['stage']; slot: string; label: string }[] = [
  { stage: 'pickup_before_loading', slot: 'PU1', label: 'Pickup · sisi depan & kiri' },
  { stage: 'pickup_before_loading', slot: 'PU2', label: 'Pickup · sisi belakang & kanan' },
  { stage: 'delivery_handover', slot: 'DO1', label: 'Serah-terima · kondisi akhir' },
];

const STEP_ACTION: Partial<Record<ExecutionStatus, { action: OrderAction; label: string; hint: string }>> = {
  assigned: { action: 'start_pickup', label: 'Berangkat ke lokasi jemput', hint: 'Lokasi mulai dibagikan ke pelanggan setelah ini.' },
  en_route_pickup: { action: 'arrive_pickup', label: 'Tiba di lokasi jemput', hint: 'Tekan setelah kendaraan berhenti.' },
  arrived_pickup: { action: 'start_loading', label: 'Mulai memuat', hint: 'Wajib dua foto saat jemput, atau tulis alasan kenapa tidak bisa.' },
  loading: { action: 'start_transit', label: 'Kendaraan aman, berangkat', hint: 'Pastikan muatan sudah diikat.' },
  in_transit: { action: 'arrive_delivery', label: 'Tiba di tujuan', hint: 'Tekan setelah berhenti di lokasi tujuan.' },
  arrived_delivery: { action: 'handover', label: 'Serah-terima', hint: 'Foto kondisi akhir, lalu catat siapa yang menerima.' },
};

export function orderDetail(db: DemoDb, order: Order, actor: Actor, now: string): OrderDetail {
  assertCanSeeOrder(db, actor, order);
  const req = requestOf(db, order.requestId);
  const vehicle = db.vehicles.find((v) => v.id === req.vehicleId)!;
  const staff = isStaffView(actor);
  const asg = currentAssignment(db, order.id);
  const quote = db.quotes.find((q) => q.id === order.quoteId) ?? null;
  const media = db.media.filter((m) => m.orderId === order.id || (m.requestId === order.requestId && m.stage === 'request_condition'));
  const invoices = db.invoices.filter((i) => i.orderId === order.id && i.status !== 'draft');
  const isMyTask = actor.view === 'driver' && asg?.driverId === actor.user.id;

  const actions: OrderAction[] = [];
  let next: OrderDetail['nextAction'] = null;
  let blockedReason: string | null = null;
  if (isMyTask && asg) {
    if (asg.status === 'offered') actions.push('accept_assignment', 'reject_assignment');
    if (asg.status === 'accepted') {
      const step = STEP_ACTION[order.status];
      if (step) {
        actions.push(step.action);
        next = step;
        if (step.action === 'start_loading') {
          const pickupCount = media.filter((m) => m.stage === 'pickup_before_loading').length;
          if (pickupCount < 2) blockedReason = t('Foto jemput {0}/2. Ambil foto atau tulis alasan kenapa tidak bisa.', [pickupCount]);
        }
      }
      actions.push('report_incident', 'capture_evidence', 'add_expense', 'mark_readiness');
      if (['loading', 'in_transit', 'arrived_delivery'].includes(order.status)) actions.push('abort');
    }
  }
  if (staff) {
    if (['confirmed', 'assigned'].includes(order.status) && actor.view !== 'driver') actions.push('manage_assignment');
    if (['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup'].includes(order.status)) actions.push('cancel');
    if (['loading', 'in_transit', 'arrived_delivery'].includes(order.status)) actions.push('abort');
    if (!['closed', 'canceled', 'aborted'].includes(order.status)) actions.push('propose_change', 'report_incident');
    if (order.status === 'handed_over' && !invoices.length) actions.push('issue_invoice');
    if (order.status === 'handed_over' && order.evidence !== 'disputed') actions.push('close');
    if (db.incidents.some((i) => i.orderId === order.id && i.status === 'open')) actions.push('resolve_incident');
  }
  if (actor.view === 'customer') {
    if (db.changeOrders.some((c) => c.orderId === order.id && c.status === 'pending')) actions.push('approve_change');
    if (['closed', 'handed_over'].includes(order.status)) actions.push('reorder');
  }
  if (['en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery'].includes(order.status)) actions.push('view_tracking');

  const contribution = staff ? contributionFor(db, order, now) : null;
  const advance = db.advances.find((a) => a.orderId === order.id);
  const advanceSpent = advance
    ? db.expenses.filter((e) => e.orderId === order.id && e.status === 'approved' && e.submittedBy === advance.driverId && e.category.includes('uang jalan')).reduce((s, e) => s + e.amount, 0)
    : 0;

  // Driver hanya menerima data yang diperlukan untuk menjalankan tugas: tanpa harga, tagihan, atau pembayar.
  const driverView = actor.view === 'driver';
  const summaryBase = orderSummary(db, order, now);
  return {
    summary: driverView
      ? { ...summaryBase, outstanding: null, collection: null, invoiceStatus: null, nextStep: ['handed_over', 'closed'].includes(order.status) ? 'Tugas selesai' : summaryBase.nextStep }
      : summaryBase,
    requestId: req.id,
    channel: req.channel,
    parties: driverView ? { ...req.parties, payer: '—' } : req.parties,
    vehicle: { label: vehicle.label, plate: vehicle.plate, weightKg: vehicle.weightKg, lengthMm: vehicle.lengthMm, widthMm: vehicle.widthMm, condition: vehicle.condition },
    timing: { kind: req.timing.kind, start: req.timing.start, end: req.timing.end },
    poRef: driverView ? null : (req.poRef ?? null),
    businessAccountName: req.businessAccountId ? (db.businessAccounts.find((b) => b.id === req.businessAccountId)?.name ?? null) : null,
    timeline: timeline(order),
    quote: quote && !driverView ? quoteDoc(db, quote, actor, now) : null,
    // Customer dan driver tidak melihat histori penolakan internal petugas lain.
    assignments: (staff ? db.assignments.filter((a) => a.orderId === order.id) : asg ? [asg] : []).map((a) => assignmentDto(db, a)),
    incidents: db.incidents
      .filter((i) => i.orderId === order.id)
      .map<IncidentDTO>((i) => ({ id: i.id, type: i.type, typeLabel: INCIDENT_LABEL[i.type] ?? i.type, status: i.status, picName: userName(db, i.pic), note: i.note, openedAt: i.openedAt, resolvedAt: i.resolvedAt, followUp: i.followUp })),
    changeOrders: db.changeOrders
      .filter((c) => c.orderId === order.id && !driverView)
      .map((c) => ({ id: c.id, amount: toMoneyString(c.amount), reason: c.reason, status: c.status, createdAt: c.createdAt, decidedByName: c.decidedBy ? userName(db, c.decidedBy) : null })),
    media: media.map((m) => mediaItem(db, m)),
    evidenceSlots: EVIDENCE_SLOTS.map((s) => ({ ...s, mediaId: media.find((m) => m.slot === s.slot && m.stage === s.stage)?.id ?? null })),
    readiness: { ...order.readiness, note: order.readiness.note ?? null },
    handover: order.handover ? { ...order.handover, objectionNote: order.handover.objectionNote ?? null } : null,
    abortInfo: order.abortInfo ?? null,
    invoices: (driverView ? [] : invoices).map((i) => {
      const b = invoiceBalance(db, i.id, now);
      return { id: i.id, number: i.number, status: i.status, net: toMoneyString(b.net), outstanding: toMoneyString(b.outstanding), collection: b.collection };
    }),
    pickupContact: `${req.parties.sender} · ${db.users.find((u) => u.name === req.parties.sender)?.phoneLabel ?? '+62 000-0000-0900 (DEMO)'}`,
    receiverContact: t('{0} · +62 000-0000-0901 (DEMO)', [req.parties.receiver]),
    instructions: [
      t('Jemput: {0}', [req.pickup.address]),
      t('Tujuan: {0}', [req.dropoff.address]),
      t('Jadwal {0}–{1}', [formatTime(order.scheduleStart), formatTime(order.scheduleEnd)]),
      vehicle.condition,
      'Jangan mengoperasikan aplikasi saat kendaraan berjalan.',
    ],
    internal: staff
      ? {
          estimateDirect: toMoneyString(order.estimateDirect),
          actualDirect: contribution?.actualDirect === null || contribution === null ? null : toMoneyString(contribution.actualDirect),
          contribution: contribution?.contribution == null ? null : toMoneyString(contribution.contribution),
          contributionState: contribution?.state ?? 'provisional',
          reason: contribution?.reason ?? null,
          advance: advance ? { amount: toMoneyString(advance.amount), returned: toMoneyString(advance.returned), outstanding: toMoneyString(Math.max(0, advance.amount - advance.returned - advanceSpent)) } : null,
        }
      : null,
    expenses: (staff || isMyTask ? db.expenses.filter((e) => e.orderId === order.id && (staff || e.submittedBy === actor.user.id)) : []).map((e) => ({
      id: e.id, category: e.category, amount: toMoneyString(e.amount), status: e.status, submittedByName: userName(db, e.submittedBy), source: e.source,
    })),
    allowedActions: [...new Set(actions)],
    nextAction: next,
    blockedReason,
  };
}

export function paymentRequestDto(db: DemoDb, pr: PaymentRequest, now: string): PaymentRequestDTO {
  const inv = db.invoices.find((i) => i.id === pr.invoiceId)!;
  const expired = pr.status === 'active' && Date.parse(pr.expiresAt) <= Date.parse(now);
  return {
    id: pr.id,
    invoiceId: pr.invoiceId,
    invoiceNumber: inv.number,
    reference: pr.reference,
    requestedAmount: toMoneyString(pr.requestedAmount),
    outstandingSnapshot: toMoneyString(pr.outstandingSnapshot),
    expiresAt: pr.expiresAt,
    status: expired ? 'expired' : pr.status,
    createdAt: pr.createdAt,
    deepLink: `tovv-demo://payment-request/${pr.id}`,
    history: pr.history,
  };
}

export function proofDto(db: DemoDb, p: PaymentProof, actor: Actor, now: string): ProofDTO {
  const inv = db.invoices.find((i) => i.id === p.invoiceId)!;
  const order = db.orders.find((o) => o.id === inv.orderId)!;
  const b = invoiceBalance(db, inv.id, now);
  const similar = db.proofs
    .filter((x) => x.id !== p.id && x.referenceClaimed.toUpperCase().replace(/\W/g, '') === p.referenceClaimed.toUpperCase().replace(/\W/g, ''))
    .map((x) => x.id);
  const reviewable = p.status === 'pending_review' || p.status === 'flagged_review';
  const canVerify = (actor.view === 'owner' || actor.view === 'admin') && reviewable;
  const self = p.submittedBy === actor.user.id;
  return {
    id: p.id,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    alias: order.alias,
    amountClaimed: toMoneyString(p.amountClaimed),
    method: p.method,
    referenceClaimed: p.referenceClaimed,
    eventAt: p.eventAt,
    receivedAt: p.receivedAt,
    submittedByName: userName(db, p.submittedBy),
    submittedById: p.submittedBy,
    status: p.status,
    flagReason: p.flagReason,
    review: p.review
      ? { byName: userName(db, p.review.by), at: p.review.at, reason: p.review.reason, amountVerified: p.review.amountVerified === null ? null : toMoneyString(p.review.amountVerified), custody: p.review.custody }
      : null,
    assistedReason: p.assistedReason,
    attachmentLabel: p.attachmentLabel,
    outstandingNow: toMoneyString(b.outstanding),
    similarReferences: similar,
    allowedActions: canVerify && !self ? ['verify', 'reject'] : [],
    blockedReason: canVerify && self ? 'Anda yang mengajukan bukti ini. Pemeriksaan harus oleh finance/owner lain.' : null,
  };
}

export function invoiceDoc(db: DemoDb, inv: Invoice, actor: Actor, now: string): InvoiceDoc {
  const order = db.orders.find((o) => o.id === inv.orderId)!;
  const tenant = db.tenants.find((t) => t.id === inv.tenantId)!;
  const b = invoiceBalance(db, inv.id, now);
  const staff = isStaffView(actor);
  const actions: InvoiceDoc['allowedActions'] = [];
  if (b.outstanding > 0) actions.push('submit_proof');
  if (staff && b.outstanding > 0) actions.push('create_payment_request', 'assisted_cash');
  if (staff) actions.push('credit_note');
  return {
    id: inv.id,
    number: inv.number,
    status: inv.status,
    orderId: order.id,
    alias: order.alias,
    operatorName: tenant.name,
    payerLabel: inv.payerLabel,
    issuedAt: inv.issuedAt,
    dueDate: inv.dueDate,
    items: inv.items.map((i) => ({ label: i.label, amount: toMoneyString(i.amount) })),
    gross: toMoneyString(inv.gross),
    credits: db.creditNotes.filter((c) => c.invoiceId === inv.id).map((c) => ({ id: c.id, amount: toMoneyString(c.amount), postedAt: c.postedAt, reason: c.reason })),
    net: toMoneyString(b.net),
    allocated: toMoneyString(b.allocated),
    outstanding: toMoneyString(b.outstanding),
    collection: b.collection,
    overdueDays: b.overdueDays,
    fullyCredited: b.fullyCredited,
    instruction: { account: tenant.paymentInstruction.account, payeeLabel: tenant.paymentInstruction.payeeLabel, version: tenant.paymentInstruction.version },
    paymentRequests: db.paymentRequests.filter((p) => p.invoiceId === inv.id).map((p) => paymentRequestDto(db, p, now)).reverse(),
    proofs: db.proofs.filter((p) => p.invoiceId === inv.id).map((p) => proofDto(db, p, actor, now)).reverse(),
    receipts: db.receipts
      .filter((r) => r.invoiceId === inv.id)
      .map((r) => ({
        id: r.id,
        amount: toMoneyString(r.amount),
        postedAt: r.postedAt,
        method: r.method,
        custody: r.custody,
        unapplied: toMoneyString(receiptUnapplied(db, r.id, now)),
        verifiedByName: userName(db, r.verifiedBy),
        refunds: db.refunds.filter((f) => f.receiptId === r.id).map((f) => ({ amount: toMoneyString(f.amount), recordedAt: f.recordedAt, status: f.status })),
      })),
    allowedActions: actions,
  };
}

export function requestSummary(db: DemoDb, r: ServiceRequest, now: string): RequestSummary {
  const vehicle = db.vehicles.find((v) => v.id === r.vehicleId);
  const quotes = db.quotes.filter((q) => q.requestId === r.id).sort((a, b) => b.version - a.version);
  const latest = quotes[0];
  const latestStatus = latest && latest.status === 'sent' && Date.parse(latest.validUntil) <= Date.parse(now) ? 'expired' : latest?.status;
  return {
    id: r.id,
    alias: r.alias,
    status: r.status,
    channel: r.channel,
    customerLabel: r.parties.orderer + (r.businessAccountId ? ` · ${db.businessAccounts.find((b) => b.id === r.businessAccountId)?.name}` : ''),
    vehicleLabel: vehicle ? `${vehicle.label} · ${vehicle.plate}` : '—',
    pickupLabel: r.pickup.label,
    dropoffLabel: r.dropoff.label,
    createdAt: r.createdAt,
    needsReviewReasons: r.needsReviewReasons,
    latestQuote: latest && latestStatus
      ? { id: latest.id, version: latest.version, status: latestStatus, amount: toMoneyString(latest.amount), validUntil: latest.validUntil }
      : null,
    orderId: db.orders.find((o) => o.requestId === r.id)?.id ?? null,
  };
}
