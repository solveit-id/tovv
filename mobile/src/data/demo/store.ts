import { buildF09 } from '@/data/fixtures/f09';
import { DATASET_GENERATION, DEMO_CLOCK_C0 } from '@/core/format/time';
import type { DemoDb } from './db';

/**
 * Penyimpanan state demo. Snapshot JSON disimpan lokal (SQLite key-value) agar draf, antrean
 * sinkronisasi dan transaksi demo bertahan saat aplikasi ditutup (MOB-03), tanpa backend.
 */
export interface Persistence {
  load(key: string): Promise<string | null>;
  save(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export const memoryPersistence = (): Persistence => {
  const m = new Map<string, string>();
  return {
    load: async (k) => m.get(k) ?? null,
    save: async (k, v) => void m.set(k, v),
    remove: async (k) => void m.delete(k),
  };
};

const KEY_DB = `tovv.demo.db.${DATASET_GENERATION}`;
const KEY_ANCHOR = `tovv.demo.clock.${DATASET_GENERATION}`;

type Listener = () => void;

/** Jam bisnis demo: C0 + waktu nyata sejak reset. Jam keamanan/autentikasi tidak memakai jam ini. */
export class DemoClock {
  constructor(private anchorRealMs: number) {}
  now(): string {
    return new Date(Date.parse(DEMO_CLOCK_C0) + Math.max(0, Date.now() - this.anchorRealMs)).toISOString();
  }
  get anchor() {
    return this.anchorRealMs;
  }
  reset(realMs = Date.now()) {
    this.anchorRealMs = realMs;
  }
}

export class DemoStore {
  db: DemoDb;
  readonly clock: DemoClock;
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private persistence: Persistence,
    db?: DemoDb,
    anchor = Date.now(),
  ) {
    this.db = db ?? buildF09();
    this.clock = new DemoClock(anchor);
  }

  static async open(persistence: Persistence): Promise<DemoStore> {
    const [raw, anchorRaw] = await Promise.all([persistence.load(KEY_DB), persistence.load(KEY_ANCHOR)]);
    let db: DemoDb | undefined;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DemoDb;
        // Snapshot generasi lain tidak di-replay ke dataset baru (PRD §8.4).
        if (parsed.generation === DATASET_GENERATION) db = parsed;
      } catch {
        db = undefined;
      }
    }
    const anchor = anchorRaw ? Number(anchorRaw) : Date.now();
    const store = new DemoStore(persistence, db, Number.isFinite(anchor) ? anchor : Date.now());
    if (!anchorRaw) await persistence.save(KEY_ANCHOR, String(store.clock.anchor));
    return store;
  }

  now(): string {
    return this.clock.now();
  }

  nextId(prefix: string): string {
    this.db.sequences.idCounter += 1;
    return `${prefix}-${String(this.db.sequences.idCounter).padStart(5, '0')}`;
  }

  /** Mutasi atomik: perubahan diterapkan ke salinan; bila fungsi melempar error, state lama tetap. */
  transact<T>(fn: (db: DemoDb) => T): T {
    const draft = JSON.parse(JSON.stringify(this.db)) as DemoDb;
    const result = fn(draft);
    this.db = draft;
    this.emit();
    this.scheduleSave();
    return result;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async reset(): Promise<void> {
    this.db = buildF09();
    this.clock.reset();
    await Promise.all([this.persistence.save(KEY_ANCHOR, String(this.clock.anchor)), this.flush()]);
    this.emit();
  }

  async flush(): Promise<void> {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    await this.persistence.save(KEY_DB, JSON.stringify(this.db));
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      void this.flush();
    }, 250);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}
