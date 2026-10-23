import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useApiState } from './provider';
import type { TovvApi } from './demo-api';
import { ApiError } from './contract';
import { useToast } from '@/components/feedback/toast';

/** Query bertipe yang selalu menyertakan konteks sesi pada key agar cache antar akun tidak bercampur. */
export function useTovvQuery<T>(
  key: readonly unknown[],
  fn: (api: TovvApi) => Promise<T>,
  opts: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'> = {},
) {
  const { api, session } = useApiState();
  return useQuery<T, ApiError>({
    queryKey: [session?.userId ?? 'anon', session?.view ?? 'none', ...key],
    queryFn: () => fn(api),
    enabled: !!session && (opts.enabled ?? true),
    ...opts,
  });
}

interface MutationOpts<T> {
  success?: string | ((r: T) => string);
  onSuccess?: (r: T) => void;
  /** Bila true, error ditampilkan di layar (form) dan tidak sebagai toast. */
  inlineError?: boolean;
}

export function useTovvMutation<A, T>(fn: (api: TovvApi, args: A) => Promise<T>, opts: MutationOpts<T> = {}) {
  const { api } = useApiState();
  const toast = useToast();
  return useMutation<T, ApiError, A>({
    mutationFn: (args) => fn(api, args),
    onSuccess: (r) => {
      if (opts.success) toast.show(typeof opts.success === 'function' ? opts.success(r) : opts.success, 'ok');
      opts.onSuccess?.(r);
    },
    onError: (e) => {
      if (!opts.inlineError) toast.show(errorMessage(e), 'danger');
    },
  });
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return `Terjadi kesalahan: ${e.message}`;
  return 'Terjadi kesalahan yang tidak diketahui.';
}

export const ERROR_TITLE: Partial<Record<ApiError['code'], string>> = {
  FORBIDDEN: 'Tidak punya akses',
  NOT_FOUND: 'Tidak ditemukan',
  OFFLINE: 'Sedang offline',
  UNAVAILABLE: 'Data sedang tidak bisa dimuat',
  CAPACITY_CONFLICT: 'Jadwal bentrok',
  ESCALATION_REQUIRED: 'Perlu keputusan owner',
  QUOTE_EXPIRED: 'Penawaran kedaluwarsa',
  QUOTE_SUPERSEDED: 'Versi sudah diganti',
  SELF_APPROVAL: 'Perlu dicek orang lain',
  PLAN_BLOCKED: 'Paket demo berakhir',
};
