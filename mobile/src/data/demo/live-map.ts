import type { Ctx } from './ctx';
import { listOrders, getTracking } from './ops-orders';
import { REPLAY_PLAN, STALE_AFTER_S, continuousPoint } from './tracking';
import type { LiveMapDTO, LiveUnit } from '@/data/api/contract';
import { secondsBetween } from '@/core/format/time';
import { PLACES } from '@/data/fixtures/reference';

const ON_JOB = ['en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery'];

/**
 * Peta langsung per peran. Posisi berasal dari replay perjalanan F-06 dan posisi terakhir unit di fixture
 * (keduanya sintetis dan diberi label), bukan koordinat karangan baru.
 * - owner: semua unit tenant + pekerjaan berjalan;
 * - driver: hanya tugas miliknya;
 * - pelanggan: hanya pesanannya, dan lokasi truk baru tampil setelah petugas berangkat (PRD §5).
 */
export function liveMap(ctx: Ctx): LiveMapDTO {
  const db = ctx.store.db;
  const now = ctx.now;
  const view = ctx.actor.view;
  const orders = listOrders(ctx, 'active');

  const jobs = orders.map((o) => {
    const tr = getTracking(ctx, o.id);
    return {
      orderId: o.id,
      alias: o.alias,
      status: o.status,
      customerLabel: view === 'customer' ? null : o.customerLabel,
      unitCode: o.unitCode,
      driverName: o.driverName,
      pickup: o.pickup,
      dropoff: o.dropoff,
      trackingVisible: tr.visible && tr.lat !== null,
      hiddenReason: tr.hiddenReason,
      progress: tr.progress,
      etaMinutes: tr.eta?.minutes ?? null,
    };
  });

  const unitFor = (unitId: string): LiveUnit | null => {
    const u = db.units.find((x) => x.id === unitId);
    if (!u) return null;
    const order = db.orders.find((o) => o.unitId === u.id && ON_JOB.includes(o.status));
    const p = order && REPLAY_PLAN[order.id as keyof typeof REPLAY_PLAN] ? continuousPoint(db, order.id, now) : null;
    const pos = p ?? u.lastPosition;
    const age = Math.max(0, Math.round(secondsBetween(pos.capturedAt, now)));
    const driverId = order ? db.assignments.find((a) => a.orderId === order.id && ['accepted', 'completed'].includes(a.status))?.driverId : undefined;
    return {
      unitId: u.id,
      code: u.code,
      label: u.label,
      lat: pos.lat,
      lng: pos.lng,
      accuracyM: pos.accuracyM,
      capturedAt: pos.capturedAt,
      ageSeconds: age,
      freshness: age > STALE_AFTER_S ? 'stale' : 'live',
      source: pos.source === 'device' ? 'device' : 'simulated',
      state: u.status !== 'active' ? 'out_of_service' : order ? 'on_job' : 'available',
      orderId: order?.id ?? null,
      orderAlias: order?.alias ?? null,
      driverName: driverId ? (db.users.find((x) => x.id === driverId)?.name ?? null) : null,
    };
  };

  let units: LiveUnit[] = [];
  if (view === 'owner' || view === 'admin') {
    units = db.units.filter((u) => u.tenantId === ctx.actor.user.tenantId).map((u) => unitFor(u.id)).filter((u): u is LiveUnit => !!u);
  } else {
    // Driver dan pelanggan hanya melihat truk dari pekerjaan yang lokasinya boleh tampil.
    const visibleOrderIds = new Set(jobs.filter((j) => j.trackingVisible).map((j) => j.orderId));
    units = db.orders
      .filter((o) => visibleOrderIds.has(o.id))
      .map((o) => unitFor(o.unitId))
      .filter((u): u is LiveUnit => !!u)
      .map((u) => (view === 'customer' ? { ...u, driverName: u.driverName ? u.driverName.split(' ')[0]! : null } : u));
  }

  return {
    generatedAt: now,
    view,
    base: view === 'customer' ? null : { label: PLACES.surabayaPool.label, lat: PLACES.surabayaPool.lat!, lng: PLACES.surabayaPool.lng! },
    units,
    jobs,
  };
}
