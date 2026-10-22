import type { DemoDb } from './db';
import type { Order, TrackPoint } from '@/domain/types';
import type { TrackingSnapshot } from '@/data/api/contract';
import { secondsBetween } from '@/core/format/time';

/** Batas PRD §5: stale > 90 detik; timestamp > 120 detik di masa depan dikarantina. */
export const STALE_AFTER_S = 90;
export const FUTURE_QUARANTINE_S = 120;

const TRACKABLE = new Set(['en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery']);

const REPLAY_PLAN = {
  'O-A06': { start: { lat: -7.2862, lng: 112.7389 }, end: { lat: -7.4478, lng: 112.7183 }, plannedSteps: 360 },
} as const;

/**
 * Replay F-06 berjalan menurut jam demo. Bila replay dijeda, titik berhenti dan menjadi stale secara jujur;
 * tidak ada titik baru yang dikarang. Replay tidak pernah diberi label perangkat.
 */
export function replayPoints(db: DemoDb, orderId: string, now: string): TrackPoint[] {
  const seeded = db.tracks[orderId] ?? [];
  const plan = REPLAY_PLAN[orderId as keyof typeof REPLAY_PLAN];
  if (!plan || !seeded.length) return seeded;
  const first = seeded[0]!;
  const cutoff = db.faults.replayPausedAt && Date.parse(db.faults.replayPausedAt) < Date.parse(now) ? db.faults.replayPausedAt : now;
  const steps = Math.min(plan.plannedSteps, Math.floor(secondsBetween(first.capturedAt, cutoff) / 15));
  const points: TrackPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const f = i / plan.plannedSteps;
    points.push({
      eventId: `loc-${orderId}-${String(i).padStart(4, '0')}`,
      capturedAt: new Date(Date.parse(first.capturedAt) + i * 15_000).toISOString(),
      lat: Number((plan.start.lat + (plan.end.lat - plan.start.lat) * f).toFixed(6)),
      lng: Number((plan.start.lng + (plan.end.lng - plan.start.lng) * f).toFixed(6)),
      accuracyM: 10 + (i % 7),
      source: 'simulated',
    });
  }
  // Titik device (bila pernah dikirim dari perangkat) digabung dengan sumber berbeda, tidak menimpa diam-diam.
  const device = seeded.filter((p) => p.source === 'device');
  return [...points, ...device].sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
}

/** Titik terbaru yang valid: abaikan timestamp masa depan > 120 detik (karantina). */
export function latestValid(points: TrackPoint[], now: string): TrackPoint | null {
  const valid = points.filter((p) => secondsBetween(now, p.capturedAt) <= FUTURE_QUARANTINE_S);
  return valid.length ? valid[valid.length - 1]! : null;
}

export function trackingSnapshot(db: DemoDb, order: Order, now: string, viewer: 'staff' | 'customer'): TrackingSnapshot {
  const req = db.requests.find((r) => r.id === order.requestId)!;
  const base = { orderId: order.id, pickup: req.pickup, dropoff: req.dropoff };
  const empty = { lat: null, lng: null, capturedAt: null, accuracyM: null, source: null, ageSeconds: null, progress: null, eta: null } as const;
  if (!TRACKABLE.has(order.status)) {
    const reason =
      ['confirmed', 'assigned'].includes(order.status)
        ? 'Lokasi tampil setelah petugas mulai menuju lokasi jemput. Sebelum itu hanya status dan jadwal.'
        : ['handed_over', 'closed'].includes(order.status)
          ? 'Layanan selesai; pelacakan berhenti saat serah-terima. Riwayat tahap tetap tersedia.'
          : 'Pelacakan tidak aktif untuk status ini.';
    return { ...base, ...empty, visible: false, hiddenReason: reason, freshness: 'unknown' };
  }
  const points = replayPoints(db, order.id, now);
  const p = latestValid(points, now);
  if (!p) {
    return { ...base, ...empty, visible: viewer === 'staff', hiddenReason: 'Belum ada lokasi diterima.', freshness: 'unknown' };
  }
  const age = Math.max(0, Math.round(secondsBetween(p.capturedAt, now)));
  const plan = REPLAY_PLAN[order.id as keyof typeof REPLAY_PLAN];
  const total = plan
    ? Math.hypot(plan.end.lat - plan.start.lat, plan.end.lng - plan.start.lng)
    : null;
  const done = plan ? Math.hypot(p.lat - plan.start.lat, p.lng - plan.start.lng) : null;
  const progress = total && done !== null ? Math.min(1, done / total) : null;
  const remainingMin = progress !== null ? Math.max(0, Math.round((1 - progress) * 90)) : null;
  return {
    ...base,
    visible: true,
    hiddenReason: null,
    lat: p.lat,
    lng: p.lng,
    capturedAt: p.capturedAt,
    accuracyM: p.accuracyM,
    source: p.source,
    freshness: age > STALE_AFTER_S ? 'stale' : 'live',
    ageSeconds: age,
    progress,
    eta:
      remainingMin === null
        ? null
        : {
            minutes: remainingMin,
            source: 'Simulasi garis lurus F-06',
            fetchedAt: p.capturedAt,
            warning: 'Perkiraan ilustratif; tidak memperhitungkan akses jalan truk atau lalu lintas.',
          },
  };
}

/** Jarak garis lurus (km). Selalu diberi label garis lurus, bukan jarak jalan. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
