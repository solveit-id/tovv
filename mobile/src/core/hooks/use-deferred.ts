import { useEffect, useState } from 'react';

/**
 * true setelah JS thread sempat lengang (biasanya setelah animasi transisi halaman), paling lambat
 * 350 ms. Bagian bawah layar (riwayat, daftar panjang, gambar) dirender belakangan supaya perpindahan
 * halaman tetap mulus; sebelum itu tampilkan kerangka muat.
 */
export function useDeferred(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof requestIdleCallback !== 'function') {
      const timer = setTimeout(() => setReady(true), 120);
      return () => clearTimeout(timer);
    }
    const id = requestIdleCallback(() => setReady(true), { timeout: 350 });
    return () => cancelIdleCallback(id);
  }, []);
  return ready;
}
