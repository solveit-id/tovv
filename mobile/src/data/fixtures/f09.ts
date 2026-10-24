import type { DemoDb } from '@/data/demo/db';
import type {
  Assignment,
  Channel,
  CostCompleteness,
  CustomerVehicle,
  ExecutionStatus,
  Expense,
  Invoice,
  MediaPacket,
  Order,
  PaymentProof,
  PaymentRequest,
  Quote,
  RequestStatus,
  ServiceRequest,
  StatusEvent,
  TenantId,
  TrackPoint,
} from '@/domain/types';
import {
  addDays,
  addLocalDays,
  addMinutes,
  DATASET_GENERATION,
  dayAt,
  DEMO_CLOCK_C0,
  localDate,
} from '@/core/format/time';
import { BUSINESS_ACCOUNTS, PLACES, TENANTS, UNITS, USERS } from './reference';

/**
 * Seed F-09 (PRD §8.2) — versi `tovv-2.1-f09`. Tabel dibaca baris demi baris; turunan (order, invoice,
 * receipt, alokasi, biaya) dibentuk dari kolomnya. `null` pada D aktual berarti belum lengkap, bukan nol.
 */
type Account = 'BA1' | 'BA2' | 'P1' | 'P2' | 'BB1' | 'BP1';

interface Row {
  alias: string;
  day: number;
  channel: Channel;
  request: RequestStatus;
  execution: ExecutionStatus | null;
  account: Account;
  invoiceGross: number;
  credit: number;
  receiptGross: number;
  refund: number;
  dEstimate: number;
  dActual: number | null;
  cost: CostCompleteness;
}

// prettier-ignore
export const F09_ROWS: Row[] = [
  { alias: 'A01', day: 1, channel: 'phone', request: 'converted', execution: 'closed', account: 'BA1', invoiceGross: 1_000_000, credit: 0, receiptGross: 1_000_000, refund: 0, dEstimate: 650_000, dActual: 650_000, cost: 'final' },
  { alias: 'A02', day: 3, channel: 'mobile', request: 'converted', execution: 'closed', account: 'P1', invoiceGross: 1_500_000, credit: 0, receiptGross: 500_000, refund: 0, dEstimate: 900_000, dActual: 950_000, cost: 'final' },
  { alias: 'A03', day: 5, channel: 'b2b', request: 'converted', execution: 'closed', account: 'BA1', invoiceGross: 2_000_000, credit: 0, receiptGross: 2_200_000, refund: 0, dEstimate: 1_300_000, dActual: 1_400_000, cost: 'final' },
  { alias: 'A04', day: 7, channel: 'phone', request: 'converted', execution: 'closed', account: 'BA2', invoiceGross: 1_200_000, credit: 0, receiptGross: 0, refund: 0, dEstimate: 800_000, dActual: null, cost: 'provisional' },
  { alias: 'A05', day: 9, channel: 'mobile', request: 'converted', execution: 'handed_over', account: 'P2', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 850_000, dActual: 900_000, cost: 'final' },
  { alias: 'A06', day: 11, channel: 'b2b', request: 'converted', execution: 'in_transit', account: 'BA2', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 900_000, dActual: null, cost: 'provisional' },
  { alias: 'A07', day: 13, channel: 'phone', request: 'converted', execution: 'confirmed', account: 'P1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 800_000, dActual: null, cost: 'provisional' },
  { alias: 'A08', day: 15, channel: 'mobile', request: 'converted', execution: 'canceled', account: 'P2', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 700_000, dActual: null, cost: 'provisional' },
  { alias: 'A09', day: 17, channel: 'phone', request: 'converted', execution: 'aborted', account: 'BA1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 1_100_000, dActual: null, cost: 'provisional' },
  { alias: 'A10', day: 19, channel: 'b2b', request: 'converted', execution: 'closed', account: 'BA1', invoiceGross: 1_000_000, credit: 200_000, receiptGross: 1_000_000, refund: 200_000, dEstimate: 500_000, dActual: 550_000, cost: 'final' },
  { alias: 'A11', day: 21, channel: 'phone', request: 'quoted', execution: null, account: 'P1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'A12', day: 23, channel: 'mobile', request: 'lost', execution: null, account: 'P2', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'A13', day: 25, channel: 'b2b', request: 'quoted', execution: null, account: 'BA2', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'A14', day: 27, channel: 'phone', request: 'needs_review', execution: null, account: 'P1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'A15', day: 28, channel: 'mobile', request: 'draft', execution: null, account: 'P2', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'A16', day: 29, channel: 'phone', request: 'canceled', execution: null, account: 'P1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'B01', day: 2, channel: 'phone', request: 'converted', execution: 'closed', account: 'BB1', invoiceGross: 1_000_000, credit: 0, receiptGross: 1_000_000, refund: 0, dEstimate: 650_000, dActual: 700_000, cost: 'final' },
  { alias: 'B02', day: 6, channel: 'b2b', request: 'converted', execution: 'closed', account: 'BB1', invoiceGross: 1_800_000, credit: 0, receiptGross: 800_000, refund: 0, dEstimate: 1_100_000, dActual: 1_200_000, cost: 'final' },
  { alias: 'B03', day: 10, channel: 'mobile', request: 'converted', execution: 'handed_over', account: 'BP1', invoiceGross: 1_400_000, credit: 0, receiptGross: 0, refund: 0, dEstimate: 850_000, dActual: null, cost: 'provisional' },
  { alias: 'B04', day: 14, channel: 'phone', request: 'converted', execution: 'assigned', account: 'BP1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 900_000, dActual: null, cost: 'provisional' },
  { alias: 'B05', day: 18, channel: 'b2b', request: 'quoted', execution: null, account: 'BB1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'B06', day: 22, channel: 'phone', request: 'lost', execution: null, account: 'BP1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'B07', day: 26, channel: 'mobile', request: 'ready_to_quote', execution: null, account: 'BP1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
  { alias: 'B08', day: 30, channel: 'phone', request: 'draft', execution: null, account: 'BP1', invoiceGross: 0, credit: 0, receiptGross: 0, refund: 0, dEstimate: 0, dActual: null, cost: 'na' },
];

/** Harga accepted/quote untuk baris tanpa invoice (PRD §8.1). */
const QUOTE_PRICE: Record<string, number> = {
  A05: 1_300_000, A06: 1_400_000, A07: 1_250_000, A08: 1_000_000, A09: 1_600_000, B04: 1_500_000,
  A11: 1_200_000, A12: 1_100_000, A13: 1_500_000, B05: 1_300_000, B06: 1_000_000,
};
const QUOTE_ESTIMATE_D: Record<string, number> = { A11: 780_000, A12: 720_000, A13: 950_000, B05: 840_000, B06: 650_000 };

const ACCOUNT_CUSTOMER: Record<Account, string> = {
  BA1: 'ba1-req', BA2: 'ba2-req', P1: 'customer-a1', P2: 'customer-a2', BB1: 'bb1-req', BP1: 'customer-b1',
};
const ACCOUNT_APPROVER: Partial<Record<Account, string>> = { BA1: 'ba1-appr', BA2: 'ba2-appr', BB1: 'bb1-appr' };
const ACCOUNT_BIZ: Partial<Record<Account, string>> = { BA1: 'ba1', BA2: 'ba2', BB1: 'bb1' };

const VEHICLE_TYPES = ['MPV 7 kursi', 'Sedan', 'SUV', 'Hatchback', 'Pikap kabin tunggal', 'Minibus'];

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const tenantOf = (alias: string): TenantId => (alias.startsWith('A') ? 'tenant-a' : 'tenant-b');
const userName = (id: string) => USERS.find((u) => u.id === id)?.name ?? id;

function dispatcherOf(t: TenantId) {
  return t === 'tenant-a' ? 'admin-a1' : 'admin-b';
}
function financeOf(t: TenantId) {
  return t === 'tenant-a' ? 'finance-a' : 'finance-b';
}

/** Order aktif dijadwalkan pada hari C0 agar demo relevan; tanggal historis tetap berbeda (tanpa overlap). */
const ACTIVE_SCHEDULE: Record<string, { start: string; end: string }> = {
  A06: { start: addMinutes(DEMO_CLOCK_C0, -120), end: addMinutes(DEMO_CLOCK_C0, 90) },
  A07: { start: addMinutes(DEMO_CLOCK_C0, 180), end: addMinutes(DEMO_CLOCK_C0, 330) },
  B04: { start: addMinutes(DEMO_CLOCK_C0, 120), end: addMinutes(DEMO_CLOCK_C0, 240) },
};

const EXEC_CHAIN: ExecutionStatus[] = [
  'confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery', 'handed_over', 'closed',
];

function buildEvents(alias: string, status: ExecutionStatus, day: number, actor: string): StatusEvent[] {
  const historicTimes: Record<ExecutionStatus, string> = {
    confirmed: dayAt(day, 8, 20), assigned: dayAt(day, 8, 25), en_route_pickup: dayAt(day, 8, 35),
    arrived_pickup: dayAt(day, 8, 50), loading: dayAt(day, 9, 0), in_transit: dayAt(day, 9, 10),
    arrived_delivery: dayAt(day, 9, 25), handed_over: dayAt(day, 9, 30), closed: dayAt(day, 10, 5),
    canceled: dayAt(day, 8, 50), aborted: dayAt(day, 9, 40),
  };
  const activeTimes: Partial<Record<ExecutionStatus, string>> =
    alias === 'A06'
      ? {
          assigned: addMinutes(DEMO_CLOCK_C0, -150), en_route_pickup: addMinutes(DEMO_CLOCK_C0, -110),
          arrived_pickup: addMinutes(DEMO_CLOCK_C0, -80), loading: addMinutes(DEMO_CLOCK_C0, -65),
          in_transit: addMinutes(DEMO_CLOCK_C0, -42),
        }
      : alias === 'B04'
        ? { assigned: addMinutes(DEMO_CLOCK_C0, -30) }
        : {};
  const chain =
    status === 'canceled'
      ? ['confirmed', 'assigned', 'canceled']
      : status === 'aborted'
        ? ['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'aborted']
        : EXEC_CHAIN.slice(0, EXEC_CHAIN.indexOf(status) + 1);
  return (chain as ExecutionStatus[]).map((s, i) => ({
    id: `EV-${alias}-${String(i + 1).padStart(2, '0')}`,
    status: s,
    occurredAt: s === 'confirmed' ? historicTimes.confirmed : activeTimes[s] ?? historicTimes[s],
    actorId: s === 'confirmed' ? 'system' : actor,
    source: 'server',
  }));
}

function trackForA06(): TrackPoint[] {
  // Replay 15 detik dari pickup sampai posisi saat C0; jalur garis lurus sintetis berlabel simulasi.
  const start = { lat: -7.2862, lng: 112.7389 };
  const end = { lat: -7.4478, lng: 112.7183 };
  const startAt = addMinutes(DEMO_CLOCK_C0, -42);
  const totalSteps = 42 * 4;
  const plannedSteps = 90 * 4; // perjalanan direncanakan ±90 menit; C0 berada di 47% jalur
  const points: TrackPoint[] = [];
  for (let i = 0; i <= totalSteps; i += 1) {
    const f = i / plannedSteps;
    points.push({
      eventId: `loc-A06-${String(i).padStart(4, '0')}`,
      capturedAt: new Date(Date.parse(startAt) + i * 15_000).toISOString(),
      lat: Number((start.lat + (end.lat - start.lat) * f).toFixed(6)),
      lng: Number((start.lng + (end.lng - start.lng) * f).toFixed(6)),
      accuracyM: 10 + (i % 7),
      source: 'simulated',
    });
  }
  return points;
}

/** Komponen biaya aktual final per pekerjaan; total sama dengan kolom D aktual. */
function costRows(alias: string, total: number): { category: string; amount: number }[] {
  if (alias === 'A01') return [{ category: 'BBM & tol (dari uang jalan)', amount: 420_000 }, { category: 'Personel', amount: 230_000 }];
  if (alias === 'A03') return [{ category: 'Biaya mitra P1 (termasuk BBM mitra)', amount: 1_150_000 }, { category: 'Koordinasi & tol operator', amount: 250_000 }];
  const fuel = Math.round((total * 0.55) / 10_000) * 10_000;
  return [{ category: 'BBM & tol', amount: fuel }, { category: 'Personel & approach', amount: total - fuel }];
}

export function buildF09(): DemoDb {
  const db: DemoDb = {
    generation: DATASET_GENERATION,
    seededAt: DEMO_CLOCK_C0,
    tenants: clone(TENANTS),
    users: clone(USERS),
    businessAccounts: clone(BUSINESS_ACCOUNTS),
    units: clone(UNITS),
    vehicles: [], requests: [], quotes: [], orders: [], assignments: [], reservations: [], incidents: [],
    changeOrders: [], invoices: [], creditNotes: [], paymentRequests: [], proofs: [], receipts: [],
    allocations: [], allocationReversals: [], receiptReversals: [], refunds: [], expenses: [], advances: [],
    media: [], outbox: [], delegations: [], usage: [], inbox: [], supportGrants: [], tracks: {}, planChanges: [],
    sequences: { invoice: { 'tenant-a': 0, 'tenant-b': 0 }, idCounter: 1 },
    faults: { offline: false, failNextRead: false, lowStorage: false, replayPausedAt: null, planExpired: false },
  };

  const issueOrder = [...F09_ROWS].filter((r) => r.invoiceGross > 0).sort((a, b) => a.day - b.day);

  F09_ROWS.forEach((row, idx) => {
    const t = tenantOf(row.alias);
    const customer = ACCOUNT_CUSTOMER[row.account];
    const bizId = ACCOUNT_BIZ[row.account] ?? null;
    const dispatcher = dispatcherOf(t);
    const created = dayAt(row.day, 8, 0);
    const vehicleId = `V-${row.alias}`;
    const unknownSpec = row.request === 'needs_review';
    const vehicle: CustomerVehicle = {
      id: vehicleId,
      requestId: `R-${row.alias}`,
      label: VEHICLE_TYPES[idx % VEHICLE_TYPES.length]!,
      plate: `L ${String(1000 + idx * 37).slice(0, 4)} DMO`,
      weightKg: unknownSpec ? null : 1_400 + (idx % 5) * 100,
      lengthMm: unknownSpec ? null : 4_300 + (idx % 4) * 100,
      widthMm: unknownSpec ? null : 1_750,
      condition: row.alias === 'A09' ? 'Mogok, roda depan terkunci' : row.alias === 'A14' ? 'Rusak setelah benturan, kondisi belum dinilai' : 'Mogok, dapat didorong',
    };
    db.vehicles.push(vehicle);

    const isActiveSchedule = ACTIVE_SCHEDULE[row.alias];
    const timingStart = isActiveSchedule?.start ?? dayAt(row.day, 8, 30);
    const req: ServiceRequest = {
      id: `R-${row.alias}`,
      alias: row.alias,
      tenantId: t,
      day: row.day,
      channel: row.channel,
      status: row.request,
      customerUserId: customer,
      businessAccountId: bizId,
      parties: {
        orderer: userName(customer),
        sender: row.account.startsWith('B') && row.account !== 'BP1' ? `${userName(customer)} (bengkel)` : userName(customer),
        receiver: row.alias === 'A06' ? 'Petugas gudang Dealer Demo' : row.account === 'P2' ? 'Keluarga pelanggan (sintetis)' : userName(customer),
        payer: bizId ? (BUSINESS_ACCOUNTS.find((b) => b.id === bizId)?.name ?? '') : userName(customer),
      },
      vehicleId,
      pickup: row.alias === 'A06' ? PLACES.surabayaA : idx % 2 ? PLACES.surabayaB : PLACES.surabayaA,
      dropoff: row.alias === 'A06' ? PLACES.sidoarjo : idx % 3 === 0 ? PLACES.gresik : PLACES.sidoarjo,
      timing: { kind: row.alias === 'A14' ? 'flexible' : 'scheduled', start: timingStart, end: row.alias === 'A14' ? addMinutes(timingStart, 240) : null },
      createdAt: created,
      createdBy: row.channel === 'phone' ? dispatcher : customer,
      needsReviewReasons: unknownSpec ? ['Berat kendaraan belum diketahui', 'Dimensi kendaraan belum diketahui'] : [],
      lostReason: row.request === 'lost' ? 'Penawaran ditolak: di atas anggaran pelanggan' : undefined,
      cancelReason: row.request === 'canceled' ? 'Pelanggan membatalkan sebelum penawaran' : undefined,
      poRef: bizId && row.request === 'converted' ? `DEMO-PO-${row.alias}` : null,
      idempotencyKey: `idem-R-${row.alias}`,
    };
    db.requests.push(req);

    const quoted = ['converted', 'quoted', 'lost'].includes(row.request);
    if (!quoted) return;

    const price = row.invoiceGross > 0 ? row.invoiceGross : (QUOTE_PRICE[row.alias] ?? 0);
    const dEst = row.dEstimate || QUOTE_ESTIMATE_D[row.alias] || 0;
    const quoteStatus: Quote['status'] =
      row.request === 'converted' ? 'accepted'
        : row.request === 'lost' ? 'rejected'
          : row.alias === 'A13' ? 'sent' : 'expired';
    const sentAt = dayAt(row.day, 8, 10);
    const unitId = row.alias === 'A03' ? 'A-P1' : t === 'tenant-a' ? 'A-U2' : 'B-U1';
    const sched = ACTIVE_SCHEDULE[row.alias] ?? { start: dayAt(row.day, 8, 30), end: dayAt(row.day, 10, 30) };
    const quote: Quote = {
      id: `Q-${row.alias}-v1`,
      requestId: req.id,
      tenantId: t,
      version: 1,
      status: quoteStatus,
      amount: price,
      items: [
        { label: 'Jasa towing flatbed reguler', amount: Math.round((price * 0.7) / 10_000) * 10_000 },
        { label: 'Jarak tempuh dan tol', amount: price - Math.round((price * 0.7) / 10_000) * 10_000 },
      ],
      priority: null,
      unitId,
      scheduleStart: sched.start,
      scheduleEnd: sched.end,
      validUntil: row.alias === 'A13' ? DEMO_CLOCK_C0 : addDays(sentAt, 1),
      sentAt,
      createdAt: dayAt(row.day, 8, 5),
      createdBy: dispatcher,
      termsVersion: bizId ? (t === 'tenant-a' ? 'TA1' : 'TB1') : null,
      estimate: {
        direct: dEst,
        allocation: 150_000,
        reserve: 50_000,
        feePerService: t === 'tenant-b' ? 10_000 : 0,
        adminHandling: 0,
        targetSurplus: 200_000,
        components: [
          { label: 'Approach + muat + reposisi', amount: Math.round((dEst * 0.45) / 10_000) * 10_000, source: 'Template CT-1, jarak sintetis' },
          { label: 'BBM & tol', amount: dEst - Math.round((dEst * 0.45) / 10_000) * 10_000, source: 'Template CT-1' },
        ],
      },
      belowTargetReason: null,
      acceptedBy: quoteStatus === 'accepted' ? (ACCOUNT_APPROVER[row.account] ?? customer) : null,
      acceptedAt: quoteStatus === 'accepted' ? dayAt(row.day, 8, 20) : null,
      assistedConsent:
        quoteStatus === 'accepted' && row.channel === 'phone'
          ? { actorId: dispatcher, channel: 'phone', at: dayAt(row.day, 8, 18), note: 'Persetujuan lisan via telepon dicatat petugas' }
          : null,
      rejectedReason: quoteStatus === 'rejected' ? 'Di atas anggaran pelanggan' : null,
    };
    db.quotes.push(quote);

    if (!row.execution) return;

    // ---- Order & eksekusi ----
    const driver =
      row.alias === 'A06' ? 'owner-a'
        : row.alias === 'A03' ? 'partner-a'
          : row.alias === 'A09' ? 'driver-a2'
            : t === 'tenant-a' ? 'driver-a1' : 'driver-b1';
    const events = row.execution === 'confirmed' ? buildEvents(row.alias, 'confirmed', row.day, driver) : buildEvents(row.alias, row.execution, row.day, driver);
    const completed = ['handed_over', 'closed'].includes(row.execution);
    const order: Order = {
      id: `O-${row.alias}`,
      alias: row.alias,
      tenantId: t,
      requestId: req.id,
      quoteId: quote.id,
      status: row.execution,
      confirmedAt: dayAt(row.day, 8, 20),
      unitId,
      scheduleStart: sched.start,
      scheduleEnd: sched.end,
      events,
      handedOverAt: completed ? dayAt(row.day, 9, 30) : null,
      closedAt: row.execution === 'closed' ? dayAt(row.day, 10, 5) : null,
      canceledAt: row.execution === 'canceled' ? dayAt(row.day, 8, 50) : null,
      abortedAt: row.execution === 'aborted' ? dayAt(row.day, 9, 40) : null,
      estimateDirect: row.dEstimate,
      costCompleteness: row.cost,
      evidence: row.alias === 'B03' ? 'disputed' : completed ? 'complete' : 'incomplete',
      planSnapshot: t === 'tenant-a'
        ? { kind: 'subscription', version: 'SUB-A-v1', feePerService: 0 }
        : { kind: 'success', version: 'SUC-B-v1', feePerService: 10_000 },
      readiness: row.alias === 'A06'
        ? { contact: true, pickupReady: true, receiverReady: false, note: 'Penerima di gudang belum siap menerima sebelum 14.00' }
        : { contact: true, pickupReady: true, receiverReady: completed ? true : null },
      abortInfo: row.execution === 'aborted'
        ? { location: 'Rest area tol Surabaya–Gempol KM 21 (sintetis)', custody: 'Kendaraan diturunkan dan dititipkan di pool operator', pic: 'Sinta Maharani (dispatcher)', plan: 'Pelanggan memilih bengkel lain; penjemputan ulang dijadwalkan terpisah' }
        : undefined,
      handover: completed
        ? row.alias === 'B03'
          ? { receiverName: 'Putri Anjani', acceptance: 'objection', objectionNote: 'Penerima menyatakan baret baru di bumper belakang', at: dayAt(row.day, 9, 30) }
          : { receiverName: req.parties.receiver, acceptance: 'accepted', at: dayAt(row.day, 9, 30) }
        : undefined,
      version: events.length,
    };
    db.orders.push(order);

    // Assignment
    if (row.alias === 'A07') {
      db.assignments.push(
        { id: `AS-A07-1`, orderId: order.id, tenantId: t, driverId: 'driver-a1', unitId, status: 'rejected', offeredAt: dayAt(row.day, 8, 25), respondedAt: dayAt(row.day, 8, 40), reason: 'Bentrok jadwal pribadi', offeredBy: dispatcher },
        { id: `AS-A07-2`, orderId: order.id, tenantId: t, driverId: 'driver-a2', unitId, status: 'offered', offeredAt: addMinutes(DEMO_CLOCK_C0, -50), respondedAt: null, reason: null, offeredBy: dispatcher },
      );
    } else {
      const status: Assignment['status'] =
        row.execution === 'canceled' || row.execution === 'aborted' ? 'revoked' : completed ? 'completed' : 'accepted';
      db.assignments.push({
        id: `AS-${row.alias}-1`, orderId: order.id, tenantId: t, driverId: driver, unitId, status,
        offeredAt: dayAt(row.day, 8, 22), respondedAt: dayAt(row.day, 8, 25),
        reason: row.execution === 'canceled' ? 'Order dibatalkan sebelum loading' : row.execution === 'aborted' ? 'Order dihentikan (abort) setelah loading' : null,
        offeredBy: dispatcher,
      });
    }

    db.reservations.push({
      id: `RS-${row.alias}`, orderId: order.id, unitId, driverId: driver,
      start: sched.start, end: addMinutes(sched.end, 30),
      status: ['A06', 'A07', 'B04'].includes(row.alias) ? 'confirmed' : 'released',
    });

    // Evidence packets (sintetis, origin gallery, lokasi simulated — PRD §8.1.1)
    const packet = (slot: string, stage: MediaPacket['stage'], at: string): MediaPacket => ({
      id: `MP-${row.alias}-${slot}`, clientMediaId: `seed-${row.alias}-${slot}`, tenantId: t, requestId: req.id, orderId: order.id,
      vehicleId, stage, slot, captureOrigin: 'gallery', eventAt: at, deviceCapturedAt: null, deviceRecordedAt: at,
      locationCapturedAt: at, serverReceivedAt: addMinutes(at, 2), timezone: 'Asia/Jakarta',
      latitude: stage === 'delivery_handover' ? req.dropoff.lat : req.pickup.lat,
      longitude: stage === 'delivery_handover' ? req.dropoff.lng : req.pickup.lng,
      accuracyM: 20, locationSource: 'simulated', note: 'Fixture SIMULASI — bukan hasil kamera perangkat', uploaderId: driver,
      isDemo: true, synthetic: true, status: 'ready', originalUri: null, overlayUri: null, originalMd5: null, byteSize: null,
    });
    if (completed || row.alias === 'A06') {
      const pickupAt = row.alias === 'A06' ? addMinutes(DEMO_CLOCK_C0, -70) : dayAt(row.day, 8, 55);
      db.media.push(packet('PU1', 'pickup_before_loading', pickupAt), packet('PU2', 'pickup_before_loading', addMinutes(pickupAt, 1)));
    }
    if (completed) db.media.push(packet('DO1', 'delivery_handover', dayAt(row.day, 9, 29)));
    if (row.alias === 'A06') db.media.push(packet('IN1', 'incident', addMinutes(DEMO_CLOCK_C0, -28)));

    // Biaya aktual (baris expense approved) — final saja yang lengkap.
    if (row.dActual !== null) {
      costRows(row.alias, row.dActual).forEach((c, i) => {
        const exp: Expense = {
          id: `EX-${row.alias}-${i + 1}`, orderId: order.id, tenantId: t, category: c.category, amount: c.amount,
          status: 'approved', submittedBy: driver, submittedAt: dayAt(row.day, 9, 35), decidedBy: financeOf(t),
          note: '', source: 'server',
        };
        db.expenses.push(exp);
      });
    } else if (row.alias === 'A04') {
      db.expenses.push({
        id: 'EX-A04-1', orderId: order.id, tenantId: t, category: 'BBM & tol', amount: 480_000, status: 'approved',
        submittedBy: driver, submittedAt: dayAt(row.day, 9, 35), decidedBy: 'finance-a', note: 'Nota personel belum diserahkan', source: 'server',
      });
    } else if (row.alias === 'A06') {
      db.expenses.push({
        id: 'EX-A06-1', orderId: order.id, tenantId: t, category: 'Tol Surabaya–Sidoarjo', amount: 32_000, status: 'submitted',
        submittedBy: 'owner-a', submittedAt: addMinutes(DEMO_CLOCK_C0, -35), decidedBy: null, note: '', source: 'server',
      });
    }

    // ---- Invoice & ledger ----
    if (row.invoiceGross > 0) {
      const seq = issueOrder.filter((r) => tenantOf(r.alias) === t).findIndex((r) => r.alias === row.alias) + 1;
      db.sequences.invoice[t] = Math.max(db.sequences.invoice[t], seq);
      const issuedAt = dayAt(row.day, 10, 0);
      const invoice: Invoice = {
        id: `I-${row.alias}`,
        number: `INV/${t === 'tenant-a' ? 'A' : 'B'}/2026/${String(seq).padStart(4, '0')}`,
        tenantId: t, orderId: order.id, status: 'issued', issuedAt,
        dueDate: addLocalDays(localDate(issuedAt), 7), gross: row.invoiceGross, items: quote.items,
        correctsInvoiceId: null, payerLabel: req.parties.payer, businessAccountId: bizId, customerUserId: customer, version: 1,
      };
      db.invoices.push(invoice);
      if (row.credit > 0) {
        db.creditNotes.push({ id: `CN-${row.alias}`, invoiceId: invoice.id, amount: row.credit, postedAt: dayAt(row.day + 1, 11, 0), reason: 'Koreksi komersial: potongan keterlambatan jadwal (sintetis)' });
      }

      const prStatus: PaymentRequest['status'] =
        row.alias === 'A10' ? 'superseded' : ['A01', 'A03', 'B01'].includes(row.alias) ? 'fulfilled' : 'expired';
      db.paymentRequests.push({
        id: `PR-${row.alias}`, invoiceId: invoice.id, reference: `DEMO-${row.alias}-01`, requestedAmount: row.invoiceGross,
        outstandingSnapshot: row.invoiceGross, invoiceVersion: 1, instructionVersion: 1, createdAt: dayAt(row.day, 10, 5),
        expiresAt: dayAt(row.day + 1, 10, 5), status: prStatus, createdBy: financeOf(t),
        history: [
          { at: dayAt(row.day, 10, 5), status: 'active', note: 'Dibuat dari invoice terbit' },
          ...[{ at: prStatus === 'fulfilled' ? dayAt(row.day, 10, 30) : prStatus === 'superseded' ? dayAt(row.day + 1, 11, 0) : dayAt(row.day + 1, 10, 5), status: prStatus, note: prStatus === 'superseded' ? 'Diganti karena koreksi invoice' : prStatus === 'fulfilled' ? 'Jumlah diminta telah dialokasikan' : 'Melewati masa berlaku 24 jam DEMO' }],
        ],
      });

      const submitter = row.channel === 'phone' ? dispatcherOf(t) : customer;
      const proofBase: PaymentProof = {
        id: `PF-${row.alias}`, invoiceId: invoice.id, paymentRequestId: `PR-${row.alias}`, amountClaimed: row.receiptGross || row.invoiceGross,
        method: row.alias === 'A01' ? 'cash_demo' : 'transfer_demo', referenceClaimed: `TRF-DEMO-${row.alias}`,
        eventAt: dayAt(row.day, 10, 20), submittedBy: submitter, receivedAt: dayAt(row.day, 10, 25), status: 'verified',
        flagReason: null, priorProofId: null, review: null,
        assistedReason: submitter === dispatcherOf(t) ? 'Pelanggan mengirim bukti lewat telepon/chat; dicatat petugas' : null,
        attachmentLabel: 'Bukti sintetis (gambar placeholder DEMO)',
      };
      if (row.alias === 'A04') {
        db.proofs.push({ ...proofBase, amountClaimed: 1_200_000, status: 'rejected', review: { by: 'finance-a', at: dayAt(row.day, 10, 40), reason: 'Referensi tidak ditemukan pada catatan penerimaan demo; nominal pada bukti tidak terbaca', amountVerified: null, custody: null, receivedEventAt: null } });
      } else if (row.alias === 'B03') {
        db.proofs.push({ ...proofBase, amountClaimed: 1_400_000, status: 'flagged_review', eventAt: dayAt(row.day + 2, 9, 0), receivedAt: dayAt(row.day + 2, 9, 5), flagReason: 'Diajukan setelah permintaan pembayaran kedaluwarsa' });
      } else if (row.receiptGross > 0) {
        const verifier = financeOf(t);
        db.proofs.push({ ...proofBase, review: { by: verifier, at: dayAt(row.day, 10, 30), reason: row.receiptGross < row.invoiceGross ? 'Pembayaran sebagian sesuai bukti' : row.receiptGross > row.invoiceGross ? 'Diterima lebih dari tagihan; sisa menjadi unapplied' : 'Sesuai', amountVerified: row.receiptGross, custody: row.alias === 'A01' ? 'driver_demo' : 'operator_demo', receivedEventAt: dayAt(row.day, 10, 20) } });
        const receiptId = `RC-${row.alias}`;
        db.receipts.push({ id: receiptId, tenantId: t, proofId: proofBase.id, invoiceId: invoice.id, amount: row.receiptGross, postedAt: dayAt(row.day, 10, 30), method: proofBase.method, custody: row.alias === 'A01' ? 'driver_demo' : 'operator_demo', status: 'posted', verifiedBy: verifier });
        const alloc = Math.min(row.invoiceGross, row.receiptGross);
        db.allocations.push({ id: `AL-${row.alias}`, receiptId, invoiceId: invoice.id, amount: alloc, postedAt: dayAt(row.day, 10, 30) });
        if (row.credit > 0) {
          db.allocationReversals.push({ id: `ALR-${row.alias}`, allocationId: `AL-${row.alias}`, amount: row.credit, postedAt: dayAt(row.day + 1, 11, 0), reason: 'Kelebihan alokasi setelah kredit' });
        }
        if (row.refund > 0) {
          db.refunds.push({ id: `RF-${row.alias}`, receiptId, amount: row.refund, status: 'recorded', recordedAt: dayAt(row.day + 1, 11, 0), reason: 'Pengembalian demo atas kredit; pencatatan keputusan, tanpa transfer' });
        }
      }
    }

    // Usage SaaS (tenant B per layanan sukses)
    if (t === 'tenant-b') {
      const usageStatus = row.alias === 'B03' ? 'eligible_pending_review' : completed ? 'billable' : 'not_eligible';
      db.usage.push({ id: `US-${row.alias}`, tenantId: t, orderId: order.id, status: usageStatus, amount: usageStatus === 'not_eligible' ? 0 : 10_000, note: row.alias === 'B03' ? 'Serah-terima berkeberatan; menunggu review' : '' });
    }
  });

  // Kendala & change order aktif
  db.incidents.push(
    { id: 'IC-A06-1', orderId: 'O-A06', type: 'receiver_not_ready', status: 'open', pic: 'admin-a1', note: 'Petugas gudang tujuan baru siap menerima pukul 14.00 WIB', openedAt: addMinutes(DEMO_CLOCK_C0, -30), resolvedAt: null, followUp: 'Admin menghubungi gudang dan menawarkan biaya tunggu/penyimpanan' },
    { id: 'IC-A09-1', orderId: 'O-A09', type: 'custody_abort', status: 'resolved', pic: 'admin-a1', note: 'Pelanggan membatalkan setelah loading; kendaraan dititipkan di pool', openedAt: dayAt(17, 9, 35), resolvedAt: dayAt(17, 11, 0), followUp: 'Serah ulang ke pelanggan di pool tercatat' },
    { id: 'IC-B03-1', orderId: 'O-B03', type: 'handover_dispute', status: 'open', pic: 'admin-b', note: 'Penerima mencatat keberatan baret bumper belakang', openedAt: dayAt(10, 9, 31), resolvedAt: null, followUp: 'Bandingkan foto pickup dan serah-terima' },
  );
  db.changeOrders.push({ id: 'CO-A06-1', orderId: 'O-A06', amount: 200_000, reason: 'Biaya tunggu & penyimpanan sementara karena penerima belum siap', status: 'pending', createdAt: addMinutes(DEMO_CLOCK_C0, -25), createdBy: 'admin-a1', decidedBy: null, decidedAt: null });

  // F-08 uang jalan: advance 500.000, expense 420.000, return 80.000
  db.advances.push({ id: 'ADV-A01', orderId: 'O-A01', driverId: 'driver-a1', amount: 500_000, returned: 80_000, settledAt: dayAt(1, 12, 0) });
  db.advances.push({ id: 'ADV-A06', orderId: 'O-A06', driverId: 'owner-a', amount: 300_000, returned: 0, settledAt: null });

  // F-12 delegasi owner-A → admin-A1
  db.delegations.push({
    id: 'DL-A-1', tenantId: 'tenant-a', delegatorId: 'owner-a', delegateId: 'admin-a1',
    scopes: ['quote.send', 'quote.override_within_limit', 'assignment.manage', 'expense.approve', 'invoice.issue'],
    limit: 100_000, effectiveAt: addMinutes(DEMO_CLOCK_C0, -60), expiresAt: addMinutes(DEMO_CLOCK_C0, 7 * 60),
    reason: 'Owner mengemudi A06; admin menangani penawaran dan penugasan dalam batas', revokedAt: null, version: 1,
  });

  // F-13 support grant lama yang kedaluwarsa
  db.supportGrants.push({ id: 'SG-A-1', tenantId: 'tenant-a', actorLabel: 'Staf dukungan Solveit (sintetis)', scopes: ['trips.read'], reason: 'Pemeriksaan sinkronisasi', createdAt: dayAt(20, 9, 0), expiresAt: dayAt(20, 17, 0), revokedAt: null });

  db.tracks['O-A06'] = trackForA06();

  // Inbox (simulasi); push nyata tidak diaktifkan.
  const inbox = (userId: string, tenantId: TenantId, type: string, title: string, body: string, link: string | null, minutesAgo: number) =>
    db.inbox.push({ id: `IB-${db.inbox.length + 1}`, eventId: `evt-${type}-${db.inbox.length + 1}`, tenantId, userId, type, title, body, link, createdAt: addMinutes(DEMO_CLOCK_C0, -minutesAgo), read: false });
  inbox('owner-a', 'tenant-a', 'change-order', 'Biaya tambahan menunggu', 'A06: biaya tunggu Rp 200.000 belum disetujui pelanggan.', '/order/O-A06', 25);
  inbox('admin-a1', 'tenant-a', 'incident', 'Penerima belum siap', 'A06: gudang tujuan siap pukul 14.00 WIB.', '/order/O-A06', 30);
  inbox('driver-a2', 'tenant-a', 'assignment', 'Tawaran tugas baru', 'A07: penjemputan hari ini 15.00 WIB. Terima atau tolak.', '/order/O-A07', 50);
  inbox('customer-a2', 'tenant-a', 'trip', 'Kendaraan telah diserahkan', 'A05: serah-terima tercatat. Invoice akan diterbitkan.', '/order/O-A05', 300);
  inbox('finance-b', 'tenant-b', 'proof', 'Bukti perlu ditinjau', 'B03: bukti diajukan setelah permintaan kedaluwarsa.', '/proof/PF-B03', 600);

  return db;
}
