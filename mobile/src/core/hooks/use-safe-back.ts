import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';

/**
 * Kembali bila ada riwayat; bila layar dibuka langsung dari tautan/notifikasi, pindah ke rute cadangan.
 * Mencegah aksi "kembali" yang tidak tertangani setelah tindakan berhasil.
 */
export function useSafeBack(fallback: Href) {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
