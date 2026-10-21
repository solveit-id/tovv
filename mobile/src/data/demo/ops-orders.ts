import type { Ctx } from './ctx';
import { queueOutbox, requireOnline } from './ctx';
import { customerCanSeeRequest, requireScope } from './policy';
import { assertCanSeeOrder, currentAssignment, isStaffView, mediaItem, orderDetail, orderSummary, requestOf, userName } from './mappers';
import { trackingSnapshot } from './tracking';
import type { DemoDb } from './db';
import {
  ApiError,
  type AdvanceDTO,
  type ExpenseDTO,
  type MediaCaptureInput,
  type MediaItem,
  type OrderDetail,
  type OrderSummary,
  type OutboxDTO,
  type TrackingSnapshot,
} from '@/data/api/contract';
import type { ExecutionStatus, Incident, MediaPacket, Order } from '@/domain/types';
import { toMoneyString, formatRupiah } from '@/core/format/money';

function orderFor(ctx: Ctx, db: DemoDb, id: string): Order {
  const o = db.orders.find((x) => x.id === id);
  if (!o) throw new ApiError('NOT_FOUND', 'Order tidak ditemukan.');
  assertCanSeeOrder(db, ctx.actor, o);
  return o;
}

export type OrderListFilter = 'active' | 'history' | 'all';

const ACTIVE: ExecutionStatus[] = ['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery', 'handed_over'];

export function listOrders(ctx: Ctx, filter: OrderListFilter): OrderSummary[] {
  const db = ctx.store.db;
  const t = ctx.actor.user.tenantId;
  let orders = db.orders.filter((o) => o.tenantId === t);
  if (ctx.actor.view === 'customer') orders = orders.filter((o) => customerCanSeeRequest(ctx.actor.user, requestOf(db, o.requestId)));
  if (ctx.actor.view === 'driver') {
    orders = orders.filter((o) => db.assignments.some((a) => a.orderId === o.id && a.driverId === ctx.actor.user.id && ['offered', 'accepted', 'completed'].includes(a.status)));
  }
  const isActive = (o: Order) => ACTIVE.includes(o.status) && !(o.status === 'handed_over' && ctx.actor.view === 'driver');
  if (filter === 'active') orders = orders.filter(isActive);
  if (filter === 'history') orders = orders.filter((o) => !isActive(o));
  return orders
    .sort((a, b) => (filter === 'active' ? Date.parse(a.scheduleStart) - Date.parse(b.scheduleStart) : Date.parse(b.confirmedAt) - Date.parse(a.confirmedAt)))
    .map((o) => orderSummary(db, o, ctx.now));
}

export function getOrder(ctx: Ctx, id: string): OrderDetail {
  const db = ctx.store.db;
  return orderDetail(db, orderFor(ctx, db, id), ctx.actor, ctx.now);
}

export function getTracking(ctx: Ctx, id: string): TrackingSnapshot {
  const db = ctx.store.db;
  const o = orderFor(ctx, db, id);
  return trackingSnapshot(db, o, ctx.now, isStaffView(ctx.actor) ? 'staff' : 'customer');
}

// ---------- Penugasan ----------

export function offerAssignment(ctx: Ctx, orderId: string, driverId: string): OrderDetail {
  requireScope(ctx.scopes, 'assignment.manage', 'Akun ini tidak dapat mengatur penugasan. Minta delegasi assignment.manage.');
  requireOnline(ctx.store.db, 'Mengubah penugasan');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    if (!['confirmed', 'assigned'].includes(o.status)) throw new ApiError('VERSION_CONFLICT', 'Penugasan hanya dapat diubah sebelum perjalanan dimulai.');
    const driver = db.users.find((u) => u.id === driverId && u.tenantId === o.tenantId && (u.staffRoles.includes('driver') || u.staffRoles.includes('partner')));
    if (!driver) throw new ApiError('VALIDATION', 'Pilih petugas dari tenant ini.');
    const busy = db.reservations.find(
      (r) => r.driverId === driverId && r.status === 'confirmed' && r.orderId !== o.id && Date.parse(r.start) < Date.parse(o.scheduleEnd) + 30 * 60_000 && Date.parse(r.end) > Date.parse(o.scheduleStart),
    );
    if (busy) throw new ApiError('CAPACITY_CONFLICT', `${driver.name} sudah bertugas pada jadwal yang bertumpuk (${db.orders.find((x) => x.id === busy.orderId)?.alias}).`);
    // Pergantian mengunci resource lama+baru dan mencabut akses tugas lama (FLT-05).
    db.assignments.filter((a) => a.orderId === o.id && (a.status === 'offered' || a.status === 'accepted')).forEach((a) => {
      a.status = 'revoked';
      a.respondedAt = a.respondedAt ?? ctx.now;
      a.reason = `Dialihkan ke ${driver.name}`;
    });
    db.assignments.push({ id: `AS-${o.alias}-${db.assignments.filter((a) => a.orderId === o.id).length + 1}`, orderId: o.id, tenantId: o.tenantId, driverId, unitId: o.unitId, status: 'offered', offeredAt: ctx.now, respondedAt: null, reason: null, offeredBy: ctx.actor.user.id });
    if (o.status === 'assigned') {
      o.status = 'confirmed';
      o.events.push({ id: `EV-${o.alias}-${o.events.length + 1}`, status: 'confirmed', occurredAt: ctx.now, actorId: ctx.actor.user.id, note: 'Penugasan diganti; menunggu petugas baru menerima', source: 'server' });
    }
    db.inbox.push({ id: `IB-${db.inbox.length + 1}`, eventId: `evt-offer-${o.id}-${ctx.now}`, tenantId: o.tenantId, userId: driverId, type: 'assignment', title: `Tawaran tugas ${o.alias}`, body: 'Terima atau tolak dari daftar tugas.', link: `/order/${o.id}`, createdAt: ctx.now, read: false });
    o.version += 1;
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function respondAssignment(ctx: Ctx, orderId: string, accept: boolean, reason: string | null): OrderDetail {
  requireScope(ctx.scopes, 'assignment.execute', 'Hanya petugas yang ditawari dapat merespons.');
  requireOnline(ctx.store.db, 'Menerima/menolak tugas');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    const a = db.assignments.find((x) => x.orderId === o.id && x.driverId === ctx.actor.user.id && x.status === 'offered');
    if (!a) throw new ApiError('VERSION_CONFLICT', 'Tawaran sudah tidak berlaku.');
    if (!accept && !reason?.trim()) throw new ApiError('VALIDATION', 'Tuliskan alasan menolak agar admin dapat mencari pengganti.');
    a.status = accept ? 'accepted' : 'rejected';
    a.respondedAt = ctx.now;
    a.reason = accept ? null : reason;
    if (accept) {
      o.status = 'assigned';
      o.events.push({ id: `EV-${o.alias}-${o.events.length + 1}`, status: 'assigned', occurredAt: ctx.now, actorId: ctx.actor.user.id, source: 'server' });
      db.reservations.filter((r) => r.orderId === o.id && r.status === 'confirmed').forEach((r) => (r.driverId = ctx.actor.user.id));
    }
    o.version += 1;
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

// ---------- Perjalanan ----------

const TRANSITIONS: Record<string, { from: ExecutionStatus; to: ExecutionStatus }> = {
  start_pickup: { from: 'assigned', to: 'en_route_pickup' },
  arrive_pickup: { from: 'en_route_pickup', to: 'arrived_pickup' },
  start_loading: { from: 'arrived_pickup', to: 'loading' },
  start_transit: { from: 'loading', to: 'in_transit' },
  arrive_delivery: { from: 'in_transit', to: 'arrived_delivery' },
};

/**
 * Perpindahan tahap oleh petugas. Saat offline, event disimpan di antrean lokal (pending) dan tampil
 * sebagai "menunggu sinkron"; server tetap pemegang status final.
 */
export function advanceTrip(ctx: Ctx, orderId: string, action: keyof typeof TRANSITIONS, exceptionReason: string | null): OrderDetail {
  requireScope(ctx.scopes, 'assignment.execute', 'Hanya petugas aktif yang dapat memperbarui tahap.');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    const t = TRANSITIONS[action];
    if (!t) throw new ApiError('VALIDATION', 'Aksi tidak dikenal.');
    const a = currentAssignment(db, o.id);
    if (!a || a.driverId !== ctx.actor.user.id || a.status !== 'accepted') throw new ApiError('FORBIDDEN', 'Tugas ini tidak lagi milik Anda.');
    if (o.status !== t.from) throw new ApiError('VERSION_CONFLICT', 'Tahap sudah berubah. Muat ulang tugas.');
    let note: string | undefined;
    if (action === 'start_loading') {
      const photos = db.media.filter((m) => m.orderId === o.id && m.stage === 'pickup_before_loading').length;
      if (photos < 2 && !exceptionReason?.trim()) throw new ApiError('VALIDATION', 'Ambil dua foto pickup atau isi alasan pengecualian.');
      if (photos < 2) note = `Pengecualian foto: ${exceptionReason}`;
    }
    const offline = db.faults.offline;
    o.status = t.to;
    o.events.push({ id: `EV-${o.alias}-${o.events.length + 1}`, status: t.to, occurredAt: ctx.now, actorId: ctx.actor.user.id, note, source: offline ? 'local_pending' : 'server' });
    if (offline) queueOutbox(db, ctx, { aggregateId: o.id, commandType: 'status.event', label: `${o.alias}: ${t.to.replace(/_/g, ' ')}`, eventAt: ctx.now }, `LOC-${db.outbox.length + 1}`);
    o.version += 1;
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function markReadiness(ctx: Ctx, orderId: string, patch: Partial<Order['readiness']>): OrderDetail {
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    if (!isStaffView(ctx.actor) && ctx.actor.view !== 'driver') throw new ApiError('FORBIDDEN', 'Tidak dapat mengubah kesiapan.');
    o.readiness = { ...o.readiness, ...patch };
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function reportIncident(ctx: Ctx, orderId: string, type: Incident['type'], note: string): OrderDetail {
  if (!note.trim()) throw new ApiError('VALIDATION', 'Jelaskan kendala singkat.');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    if (!isStaffView(ctx.actor) && ctx.actor.view !== 'driver') throw new ApiError('FORBIDDEN', 'Tidak dapat melaporkan kendala.');
    const dispatcher = db.users.find((u) => u.tenantId === o.tenantId && u.staffRoles.includes('dispatcher'));
    const id = `IC-${o.alias}-${db.incidents.filter((i) => i.orderId === o.id).length + 1}`;
    db.incidents.push({ id, orderId: o.id, type, status: 'open', pic: dispatcher?.id ?? ctx.actor.user.id, note, openedAt: ctx.now, resolvedAt: null, followUp: 'Admin menindaklanjuti; status perjalanan tidak berubah otomatis.' });
    if (type === 'receiver_not_ready') o.readiness.receiverReady = false;
    if (db.faults.offline) queueOutbox(db, ctx, { aggregateId: id, commandType: 'incident.open', label: `${o.alias}: kendala ${type}`, eventAt: ctx.now }, `LOC-${db.outbox.length + 1}`);
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function resolveIncident(ctx: Ctx, incidentId: string, followUp: string): OrderDetail {
  requireScope(ctx.scopes, 'request.manage', 'Hanya admin/owner yang menutup kendala.');
  if (!followUp.trim()) throw new ApiError('VALIDATION', 'Catat tindak lanjut sebelum menutup kendala.');
  return ctx.store.transact((db) => {
    const i = db.incidents.find((x) => x.id === incidentId);
    if (!i) throw new ApiError('NOT_FOUND', 'Kendala tidak ditemukan.');
    const o = orderFor(ctx, db, i.orderId);
    i.status = 'resolved';
    i.resolvedAt = ctx.now;
    i.followUp = followUp;
    if (i.type === 'receiver_not_ready') o.readiness.receiverReady = true;
    // Kendala selesai tidak otomatis memajukan status eksekusi.
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function proposeChange(ctx: Ctx, orderId: string, amount: number, reason: string): OrderDetail {
  requireScope(ctx.scopes, 'change.propose', 'Akun ini tidak dapat mengajukan biaya tambahan.');
  if (!Number.isSafeInteger(amount) || amount <= 0 || !reason.trim()) throw new ApiError('VALIDATION', 'Nominal dan alasan wajib diisi.');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    db.changeOrders.push({ id: `CO-${o.alias}-${db.changeOrders.filter((c) => c.orderId === o.id).length + 1}`, orderId: o.id, amount, reason, status: 'pending', createdAt: ctx.now, createdBy: ctx.actor.user.id, decidedBy: null, decidedAt: null });
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function decideChange(ctx: Ctx, changeId: string, approve: boolean, assistedNote: string | null): OrderDetail {
  requireOnline(ctx.store.db, 'Menyetujui biaya tambahan');
  return ctx.store.transact((db) => {
    const c = db.changeOrders.find((x) => x.id === changeId);
    if (!c) throw new ApiError('NOT_FOUND', 'Biaya tambahan tidak ditemukan.');
    const o = orderFor(ctx, db, c.orderId);
    const req = requestOf(db, o.requestId);
    if (ctx.actor.view === 'customer') {
      if (req.businessAccountId && !ctx.scopes.has('change.approve')) throw new ApiError('FORBIDDEN', 'Persetujuan biaya tambahan memerlukan approver organisasi.');
    } else {
      requireScope(ctx.scopes, 'request.manage', 'Tidak dapat mencatat keputusan.');
      if (!assistedNote?.trim()) throw new ApiError('VALIDATION', 'Catat pernyataan pelanggan (kanal, waktu) untuk keputusan yang dibantu.');
    }
    if (c.status !== 'pending') throw new ApiError('VERSION_CONFLICT', 'Keputusan sudah tercatat.');
    c.status = approve ? 'approved' : 'rejected';
    c.decidedBy = ctx.actor.user.id;
    c.decidedAt = ctx.now;
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export interface HandoverInput {
  receiverName: string;
  acceptance: 'accepted' | 'objection';
  objectionNote: string | null;
  photoExceptionReason: string | null;
}

export function handover(ctx: Ctx, orderId: string, input: HandoverInput): OrderDetail {
  requireScope(ctx.scopes, 'assignment.execute', 'Hanya petugas aktif yang mencatat serah-terima.');
  if (!input.receiverName.trim()) throw new ApiError('VALIDATION', 'Nama penerima wajib diisi.', false, { receiverName: 'Wajib' });
  if (input.acceptance === 'objection' && !input.objectionNote?.trim()) throw new ApiError('VALIDATION', 'Catat keberatan penerima.', false, { objectionNote: 'Wajib' });
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    const a = currentAssignment(db, o.id);
    if (!a || a.driverId !== ctx.actor.user.id || a.status !== 'accepted') throw new ApiError('FORBIDDEN', 'Tugas ini tidak lagi milik Anda.');
    if (o.status !== 'arrived_delivery') throw new ApiError('VERSION_CONFLICT', 'Serah-terima hanya setelah tiba di tujuan.');
    const delivery = db.media.filter((m) => m.orderId === o.id && m.stage === 'delivery_handover').length;
    if (!delivery && !input.photoExceptionReason?.trim()) throw new ApiError('VALIDATION', 'Ambil foto serah-terima atau isi alasan pengecualian.');
    const offline = db.faults.offline;
    o.status = 'handed_over';
    o.handedOverAt = ctx.now;
    o.handover = { receiverName: input.receiverName, acceptance: input.acceptance, objectionNote: input.objectionNote ?? undefined, at: ctx.now };
    o.events.push({ id: `EV-${o.alias}-${o.events.length + 1}`, status: 'handed_over', occurredAt: ctx.now, actorId: ctx.actor.user.id, note: input.acceptance === 'objection' ? `Keberatan: ${input.objectionNote}` : undefined, source: offline ? 'local_pending' : 'server' });
    const pickup = db.media.filter((m) => m.orderId === o.id && m.stage === 'pickup_before_loading').length;
    o.evidence = input.acceptance === 'objection' ? 'disputed' : pickup >= 2 && delivery >= 1 ? 'complete' : 'incomplete';
    a.status = 'completed';
    db.reservations.filter((r) => r.orderId === o.id).forEach((r) => (r.status = 'released'));
    if (input.acceptance === 'objection') {
      db.incidents.push({ id: `IC-${o.alias}-${db.incidents.filter((i) => i.orderId === o.id).length + 1}`, orderId: o.id, type: 'handover_dispute', status: 'open', pic: db.users.find((u) => u.tenantId === o.tenantId && u.staffRoles.includes('dispatcher'))?.id ?? ctx.actor.user.id, note: input.objectionNote ?? '', openedAt: ctx.now, resolvedAt: null, followUp: 'Bandingkan foto pickup dan serah-terima.' });
    }
    const usage = db.usage.find((u) => u.orderId === o.id);
    if (usage) {
      // Handover + bukti minimum + acceptance sah = satu success; disputed → review. Ulang handover tidak menambah biaya.
      usage.status = o.evidence === 'complete' ? 'billable' : 'eligible_pending_review';
      usage.amount = o.planSnapshot.feePerService;
      usage.note = o.evidence === 'complete' ? '' : 'Menunggu review bukti/keberatan';
    }
    if (offline) queueOutbox(db, ctx, { aggregateId: o.id, commandType: 'handover.submit', label: `${o.alias}: serah-terima`, eventAt: ctx.now }, `LOC-${db.outbox.length + 1}`);
    o.version += 1;
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function cancelOrder(ctx: Ctx, orderId: string, reason: string): OrderDetail {
  requireScope(ctx.scopes, 'request.manage', 'Hanya admin/owner yang dapat membatalkan order.');
  if (!reason.trim()) throw new ApiError('VALIDATION', 'Alasan pembatalan wajib.');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    if (!['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup'].includes(o.status)) {
      throw new ApiError('VERSION_CONFLICT', 'Setelah loading tidak dapat dibatalkan; gunakan abort dengan custody dan PIC.');
    }
    o.status = 'canceled';
    o.canceledAt = ctx.now;
    o.events.push({ id: `EV-${o.alias}-${o.events.length + 1}`, status: 'canceled', occurredAt: ctx.now, actorId: ctx.actor.user.id, note: reason, source: 'server' });
    db.reservations.filter((r) => r.orderId === o.id).forEach((r) => (r.status = 'released'));
    db.assignments.filter((a) => a.orderId === o.id && ['offered', 'accepted'].includes(a.status)).forEach((a) => {
      a.status = 'revoked';
      a.reason = 'Order dibatalkan';
    });
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function abortOrder(ctx: Ctx, orderId: string, info: { location: string; custody: string; pic: string; plan: string }): OrderDetail {
  if (!info.location.trim() || !info.custody.trim() || !info.pic.trim() || !info.plan.trim()) {
    throw new ApiError('VALIDATION', 'Abort wajib mencatat lokasi, custody kendaraan, PIC dan rencana penyelesaian.');
  }
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    const isDriver = ctx.actor.view === 'driver' && currentAssignment(db, o.id)?.driverId === ctx.actor.user.id;
    if (!isDriver) requireScope(ctx.scopes, 'request.manage', 'Tidak dapat menghentikan order.');
    if (!['loading', 'in_transit', 'arrived_delivery'].includes(o.status)) throw new ApiError('VERSION_CONFLICT', 'Abort hanya setelah loading; sebelum itu gunakan pembatalan.');
    o.status = 'aborted';
    o.abortedAt = ctx.now;
    o.abortInfo = info;
    o.events.push({ id: `EV-${o.alias}-${o.events.length + 1}`, status: 'aborted', occurredAt: ctx.now, actorId: ctx.actor.user.id, note: info.custody, source: 'server' });
    db.incidents.push({ id: `IC-${o.alias}-${db.incidents.filter((i) => i.orderId === o.id).length + 1}`, orderId: o.id, type: 'custody_abort', status: 'open', pic: ctx.actor.user.id, note: `${info.location} · ${info.custody}`, openedAt: ctx.now, resolvedAt: null, followUp: info.plan });
    // Kapasitas hanya dilepas setelah custody bebas tercatat (PRD §8.1); di sini tetap tertahan.
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function closeOrder(ctx: Ctx, orderId: string): OrderDetail {
  requireScope(ctx.scopes, 'request.manage', 'Hanya admin/owner yang menutup order.');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    if (o.status !== 'handed_over') throw new ApiError('VERSION_CONFLICT', 'Order belum diserahkan.');
    if (o.evidence === 'disputed') throw new ApiError('VALIDATION', 'Tinjau keberatan serah-terima sebelum menutup order.');
    o.status = 'closed';
    o.closedAt = ctx.now;
    o.events.push({ id: `EV-${o.alias}-${o.events.length + 1}`, status: 'closed', occurredAt: ctx.now, actorId: ctx.actor.user.id, note: 'Ditutup; piutang boleh masih ada', source: 'server' });
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

// ---------- Biaya & uang jalan ----------

export function listExpenses(ctx: Ctx): ExpenseDTO[] {
  const db = ctx.store.db;
  const staff = isStaffView(ctx.actor);
  return db.expenses
    .filter((e) => e.tenantId === ctx.actor.user.tenantId && (staff || e.submittedBy === ctx.actor.user.id))
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
    .map((e) => ({ id: e.id, orderId: e.orderId, alias: db.orders.find((o) => o.id === e.orderId)?.alias ?? '', category: e.category, amount: toMoneyString(e.amount), status: e.status, submittedByName: userName(db, e.submittedBy), submittedAt: e.submittedAt, source: e.source, note: e.note }));
}

export function addExpense(ctx: Ctx, orderId: string, category: string, amount: number, note: string): ExpenseDTO[] {
  if (!category.trim() || !Number.isSafeInteger(amount) || amount <= 0) throw new ApiError('VALIDATION', 'Kategori dan nominal (rupiah bulat) wajib diisi.');
  ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    const isDriver = ctx.actor.view === 'driver' && currentAssignment(db, o.id)?.driverId === ctx.actor.user.id;
    if (!isDriver && !isStaffView(ctx.actor)) throw new ApiError('FORBIDDEN', 'Tidak dapat mencatat biaya.');
    const offline = db.faults.offline;
    const id = `EX-${o.alias}-${db.expenses.filter((e) => e.orderId === o.id).length + 1}`;
    db.expenses.push({ id, orderId: o.id, tenantId: o.tenantId, category, amount, status: 'submitted', submittedBy: ctx.actor.user.id, submittedAt: ctx.now, decidedBy: null, note, source: offline ? 'local_pending' : 'server' });
    if (offline) queueOutbox(db, ctx, { aggregateId: id, commandType: 'expense.submit', label: `${o.alias}: biaya ${category} ${formatRupiah(amount)}`, eventAt: ctx.now }, `LOC-${db.outbox.length + 1}`);
  });
  return listExpenses(ctx);
}

export function decideExpense(ctx: Ctx, expenseId: string, approve: boolean): ExpenseDTO[] {
  requireScope(ctx.scopes, 'expense.approve', 'Persetujuan biaya memerlukan finance/owner atau delegasi expense.approve.');
  ctx.store.transact((db) => {
    const e = db.expenses.find((x) => x.id === expenseId && x.tenantId === ctx.actor.user.tenantId);
    if (!e) throw new ApiError('NOT_FOUND', 'Biaya tidak ditemukan.');
    if (e.source === 'local_pending') throw new ApiError('VERSION_CONFLICT', 'Biaya masih di antrean perangkat dan belum diterima server.');
    if (e.submittedBy === ctx.actor.user.id) throw new ApiError('SELF_APPROVAL', 'Biaya yang Anda ajukan sendiri harus disetujui pihak lain.');
    if (e.status !== 'submitted') throw new ApiError('VERSION_CONFLICT', 'Biaya sudah diputuskan.');
    e.status = approve ? 'approved' : 'rejected';
    e.decidedBy = ctx.actor.user.id;
  });
  return listExpenses(ctx);
}

export function finalizeCosts(ctx: Ctx, orderId: string): OrderDetail {
  requireScope(ctx.scopes, 'expense.approve', 'Finalisasi biaya memerlukan finance/owner.');
  return ctx.store.transact((db) => {
    const o = orderFor(ctx, db, orderId);
    if (db.expenses.some((e) => e.orderId === o.id && e.status === 'submitted')) throw new ApiError('VALIDATION', 'Masih ada biaya menunggu persetujuan.');
    if (!db.expenses.some((e) => e.orderId === o.id && e.status === 'approved')) throw new ApiError('VALIDATION', 'Belum ada biaya aktual yang disetujui; biaya kosong bukan nol.');
    o.costCompleteness = 'final';
    return orderDetail(db, o, ctx.actor, ctx.now);
  });
}

export function listAdvances(ctx: Ctx): AdvanceDTO[] {
  const db = ctx.store.db;
  return db.advances
    .filter((a) => db.orders.find((o) => o.id === a.orderId)?.tenantId === ctx.actor.user.tenantId && (isStaffView(ctx.actor) || a.driverId === ctx.actor.user.id))
    .map((a) => {
      const spent = a.orderId === 'O-A01' ? 420_000 : db.expenses.filter((e) => e.orderId === a.orderId && e.submittedBy === a.driverId && e.status === 'approved').reduce((s, e) => s + e.amount, 0);
      return {
        id: a.id,
        orderId: a.orderId,
        alias: db.orders.find((o) => o.id === a.orderId)?.alias ?? '',
        driverName: userName(db, a.driverId),
        amount: toMoneyString(a.amount),
        spent: toMoneyString(spent),
        returned: toMoneyString(a.returned),
        outstanding: toMoneyString(Math.max(0, a.amount - spent - a.returned)),
        settled: !!a.settledAt,
      };
    });
}

// ---------- Media & sinkronisasi ----------

export function captureMedia(ctx: Ctx, input: MediaCaptureInput): MediaItem {
  requireScope(ctx.scopes, 'evidence.capture', 'Akun ini tidak dapat menambah bukti.');
  if (ctx.store.db.faults.lowStorage) {
    throw new ApiError('UNAVAILABLE', 'Ruang penyimpanan perangkat tidak cukup. Foto TIDAK tersimpan; kosongkan ruang lalu ambil ulang. Foto lain yang menunggu tidak dihapus.');
  }
  return ctx.store.transact((db) => {
    const req = requestOf(db, input.requestId);
    if (req.tenantId !== ctx.actor.user.tenantId) throw new ApiError('NOT_FOUND', 'Permintaan tidak ditemukan.');
    if (ctx.actor.view === 'customer' && !customerCanSeeRequest(ctx.actor.user, req)) throw new ApiError('NOT_FOUND', 'Permintaan tidak ditemukan.');
    if (ctx.actor.view === 'driver') {
      const o = db.orders.find((x) => x.requestId === req.id);
      const a = o ? currentAssignment(db, o.id) : null;
      if (!a || a.driverId !== ctx.actor.user.id || a.status !== 'accepted') throw new ApiError('FORBIDDEN', 'Foto hanya untuk tugas aktif Anda.');
    }
    const existing = db.media.find((m) => m.clientMediaId === input.clientMediaId && m.tenantId === req.tenantId);
    if (existing) return mediaItem(db, existing);
    const id = `MP-${req.alias}-${input.slot}-${db.media.length + 1}`;
    const packet: MediaPacket = {
      id,
      clientMediaId: input.clientMediaId,
      tenantId: req.tenantId,
      requestId: req.id,
      orderId: input.orderId,
      vehicleId: req.vehicleId,
      stage: input.stage,
      slot: input.slot,
      captureOrigin: input.captureOrigin,
      eventAt: input.eventAt,
      deviceCapturedAt: input.deviceCapturedAt,
      deviceRecordedAt: input.deviceRecordedAt,
      locationCapturedAt: input.locationCapturedAt,
      serverReceivedAt: null,
      timezone: 'Asia/Jakarta',
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyM: input.accuracyM,
      locationSource: input.locationSource,
      note: input.note,
      uploaderId: ctx.actor.user.id,
      isDemo: true,
      synthetic: false,
      status: 'pending_upload',
      originalUri: input.originalUri,
      overlayUri: input.overlayUri,
      originalMd5: input.md5,
      byteSize: input.byteSize,
    };
    db.media.push(packet);
    queueOutbox(db, ctx, { aggregateId: id, commandType: 'media.upload', label: `Foto ${input.slot} · ${req.alias}`, eventAt: input.deviceRecordedAt }, `LOC-${db.outbox.length + 1}`);
    return mediaItem(db, packet);
  });
}

export function listOutbox(ctx: Ctx): OutboxDTO[] {
  return ctx.store.db.outbox
    .filter((x) => x.actorId === ctx.actor.user.id)
    .slice()
    .reverse()
    .map((x) => ({ localId: x.localId, label: x.label, commandType: x.commandType, aggregateId: x.aggregateId, eventAt: x.eventAt, attempts: x.attempts, status: x.status, lastError: x.lastError }));
}

/**
 * Simulasi drain antrean: tanpa backend, "synced" berarti adapter demo menerima event — bukan bukti
 * upload ke server nyata. Event milik tugas yang sudah dialihkan menjadi needs_review, tidak memundurkan status.
 */
export function syncOutbox(ctx: Ctx): OutboxDTO[] {
  if (ctx.store.db.faults.offline) throw new ApiError('OFFLINE', 'Masih offline. Antrean tetap tersimpan dan akan dicoba lagi saat online.', true);
  ctx.store.transact((db) => {
    db.outbox.filter((x) => x.actorId === ctx.actor.user.id && (x.status === 'pending' || x.status === 'sending')).forEach((x) => {
      x.attempts += 1;
      if (x.commandType === 'status.event' || x.commandType === 'handover.submit') {
        const o = db.orders.find((y) => y.id === x.aggregateId);
        const a = o ? currentAssignment(db, o.id) : null;
        if (!o || !a || a.driverId !== x.actorId) {
          x.status = 'needs_review';
          x.lastError = 'Tugas sudah dialihkan saat Anda offline. Event dikirim ke review, status tidak dimundurkan.';
          return;
        }
        o.events.forEach((e) => {
          if (e.source === 'local_pending') e.source = 'server';
        });
      }
      if (x.commandType === 'media.upload') {
        const m = db.media.find((y) => y.id === x.aggregateId);
        if (m) {
          m.status = 'ready';
          m.serverReceivedAt = ctx.now;
        }
      }
      if (x.commandType === 'expense.submit') {
        const e = db.expenses.find((y) => y.id === x.aggregateId);
        if (e) e.source = 'server';
      }
      x.status = 'synced';
      x.lastError = null;
    });
  });
  return listOutbox(ctx);
}
