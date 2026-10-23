import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Storage from 'expo-sqlite/kv-store';
import { DemoStore, type Persistence } from '@/data/demo/store';
import { createDemoApi, type SessionRef, type TovvApi } from './demo-api';
import type { ViewGroup } from '@/domain/types';

const KEY_SESSION = 'tovv.demo.session';

/** Satu aplikasi = satu sesi demo aktif; adapter membaca nilai terbaru saat dipanggil, bukan saat render. */
const sessionHolder: { value: SessionRef | null } = { value: null };

const sqlitePersistence: Persistence = {
  load: (k) => Storage.getItemAsync(k),
  save: (k, v) => Storage.setItemAsync(k, v),
  remove: async (k) => void (await Storage.removeItemAsync(k)),
};

interface ApiState {
  api: TovvApi;
  store: DemoStore;
  session: SessionRef | null;
  setSession: (s: SessionRef | null) => Promise<void>;
  switchView: (view: ViewGroup) => Promise<void>;
  /** Perpindahan mode owner ↔ driver yang sedang ditampilkan transisinya (lihat ModeSwitchOverlay). */
  modeShift: { to: ViewGroup; key: number } | null;
  clearModeShift: () => void;
  queryClient: QueryClient;
}

const ApiContext = createContext<ApiState | null>(null);

export function useApiState(): ApiState {
  const v = useContext(ApiContext);
  if (!v) throw new Error('ApiProvider belum dipasang');
  return v;
}

export const useApi = () => useApiState().api;
export const useSession = () => useApiState().session;

/**
 * Membuka store demo (SQLite key-value), memulihkan sesi demo, lalu menyediakan adapter.
 * Pergantian akun/konteks menghapus cache query lama (PRD §3: perubahan konteks menghapus cache).
 */
export function ApiProvider({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [store, setStore] = useState<DemoStore | null>(null);
  const [session, setSessionState] = useState<SessionRef | null>(null);
  const [modeShift, setModeShift] = useState<ApiState['modeShift']>(null);
  const clearModeShift = useCallback(() => setModeShift(null), []);
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          // Data demo dibaca ulang otomatis setiap ada perubahan (store.subscribe), jadi cache boleh awet:
          // berpindah tab tidak memicu pemuatan ulang yang tidak perlu.
          queries: { retry: 0, staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      }),
    [],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await DemoStore.open(sqlitePersistence);
      const raw = await Storage.getItemAsync(KEY_SESSION);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SessionRef;
          if (s.db.users.some((u) => u.id === parsed.userId)) {
            sessionHolder.value = parsed;
            if (alive) setSessionState(parsed);
          }
        } catch {
          // sesi rusak diabaikan; pengguna memilih akun demo lagi
        }
      }
      if (alive) setStore(s);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!store) return;
    // Mutasi store memicu baca ulang data layar aktif; state dashboard tidak disalin terpisah.
    return store.subscribe(() => {
      void queryClient.invalidateQueries();
    });
  }, [store, queryClient]);

  const api = useMemo(() => (store ? createDemoApi(store, () => sessionHolder.value) : null), [store]);

  const setSession = useCallback(
    async (s: SessionRef | null) => {
      sessionHolder.value = s;
      queryClient.clear();
      setSessionState(s);
      if (s) await Storage.setItemAsync(KEY_SESSION, JSON.stringify(s));
      else await Storage.removeItemAsync(KEY_SESSION);
    },
    [queryClient],
  );

  const switchView = useCallback(
    async (view: ViewGroup) => {
      if (!sessionHolder.value) return;
      if (sessionHolder.value.view !== view) setModeShift({ to: view, key: Date.now() });
      await setSession({ ...sessionHolder.value, view });
    },
    [setSession],
  );

  if (!store || !api) return <>{fallback}</>;
  return (
    <ApiContext.Provider value={{ api, store, session, setSession, switchView, modeShift, clearModeShift, queryClient }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiContext.Provider>
  );
}
