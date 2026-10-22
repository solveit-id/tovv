import type { DemoDb } from './db';
import type { FleetDTO } from '@/data/api/contract';
import type { TenantId } from '@/domain/types';
import { toMoneyString } from '@/core/format/money';
import { formatAge, secondsBetween } from '@/core/format/time';
import { replayPoints, latestValid } from './tracking';

/** Registry armada FLT-01: spesifikasi, status, sumber spesifikasi, posisi terakhir dan reservasi berikutnya. */
export function unitCandidatesForFleet(db: DemoDb, tenantId: TenantId, now: string): FleetDTO['units'] {
  return db.units
    .filter((u) => u.tenantId === tenantId)
    .map((u) => {
      // Posisi unit yang sedang menjalankan tugas mengikuti titik perjalanan terakhir (sumber tetap dicatat).
      const activeOrder = db.orders.find((o) => o.unitId === u.id && ['en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery'].includes(o.status));
      const p = activeOrder ? latestValid(replayPoints(db, activeOrder.id, now), now) : null;
      const pos = p ? { capturedAt: p.capturedAt } : u.lastPosition;
      const next = db.reservations
        .filter((r) => r.unitId === u.id && r.status === 'confirmed' && Date.parse(r.end) > Date.parse(now))
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
      return {
        unitId: u.id,
        code: u.code,
        label: u.label,
        ownership: u.ownership,
        partnerName: u.partnerName ?? null,
        eligible: u.status === 'active',
        rejections: u.status === 'active' ? [] : ['Out of service'],
        capacityKg: u.capacityKg,
        deck: `${u.deckLengthMm}×${u.deckWidthMm} mm`,
        distanceKm: null,
        distanceNote: '',
        etaMinutes: null,
        positionAge: formatAge(pos.capturedAt, now),
        positionFreshness: secondsBetween(pos.capturedAt, now) > 90 ? 'stale' : 'live',
        estimatedDirect: toMoneyString(u.baseCost),
        nextFreeAt: next?.end ?? null,
        conflict: !!next && Date.parse(next.start) <= Date.parse(now),
        rank: null,
        reason: activeOrder ? `Menjalankan ${activeOrder.alias}` : next ? `Terjadwal ${db.orders.find((o) => o.id === next.orderId)?.alias}` : 'Tersedia',
        status: u.status,
        equipment: u.equipment,
        costTemplate: u.costTemplateVersion,
        specSource: 'Sintetis (fixture F-04)',
      };
    });
}
