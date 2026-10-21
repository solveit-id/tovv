import type { DemoDb } from './db';
import type { DemoStore } from './store';
import { scopesFor, type Actor, type Scope } from './policy';
import type { OutboxItem, User, ViewGroup } from '@/domain/types';
import { ApiError } from '@/data/api/contract';
import { DATASET_GENERATION } from '@/core/format/time';

export interface Ctx {
  store: DemoStore;
  actor: Actor;
  scopes: Set<Scope>;
  now: string;
}

export function makeCtx(store: DemoStore, userId: string, view: ViewGroup): Ctx {
  const user = store.db.users.find((u) => u.id === userId);
  if (!user) throw new ApiError('FORBIDDEN', 'Sesi demo tidak valid. Pilih akun demo lagi.');
  const now = store.now();
  const actor = { user, view };
  return { store, actor, scopes: scopesFor(store.db, actor, now), now };
}

export const isOffline = (db: DemoDb) => db.faults.offline;

/** Aksi yang wajib online (ARCHITECTURE §6): accept quote, reservasi, verifikasi, instruksi pembayaran. */
export function requireOnline(db: DemoDb, what: string): void {
  if (db.faults.offline) {
    throw new ApiError('OFFLINE', `${what} hanya dapat dilakukan saat online. Tidak ada yang disimpan sebagai final.`, true);
  }
}

export function queueOutbox(
  db: DemoDb,
  ctx: Ctx,
  item: Pick<OutboxItem, 'aggregateId' | 'commandType' | 'label' | 'eventAt'> & { dependencyId?: string | null },
  localId: string,
): OutboxItem {
  const row: OutboxItem = {
    localId,
    tenantId: ctx.actor.user.tenantId,
    actorId: ctx.actor.user.id,
    datasetGeneration: DATASET_GENERATION,
    aggregateId: item.aggregateId,
    commandType: item.commandType,
    label: item.label,
    eventAt: item.eventAt,
    idempotencyKey: `idem-${localId}`,
    attempts: 0,
    status: 'pending',
    lastError: null,
    dependencyId: item.dependencyId ?? null,
  };
  db.outbox.push(row);
  return row;
}

export function tenantUsers(db: DemoDb, user: User) {
  return db.users.filter((u) => u.tenantId === user.tenantId);
}
