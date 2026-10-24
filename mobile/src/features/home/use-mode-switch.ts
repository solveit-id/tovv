import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useApiState } from '@/data/api/provider';
import { useDialog } from '@/components/feedback/dialog';

/**
 * Pindah mode owner ↔ driver selalu lewat konfirmasi, supaya owner tahu menu apa yang akan berubah.
 * Setelah dikonfirmasi, transisi ganti mode tampil dan beranda mode tujuan dibuka.
 */
export function useModeSwitch() {
  const router = useRouter();
  const dialog = useDialog();
  const { switchView } = useApiState();
  return useCallback(
    async (to: 'owner' | 'driver') => {
      const ok = await dialog.confirm(
        to === 'driver'
          ? {
              title: 'Pindah ke mode driver?',
              message: 'Tampilan berganti ke tugas Anda di jalan.',
              points: ['Hanya tugas yang ditugaskan ke Anda yang tampil', 'Menu keuangan dan armada disembunyikan dulu', 'Bisa kembali ke mode owner kapan saja'],
              icon: 'steering',
              tone: 'mode',
              confirmLabel: 'Pindah ke mode driver',
              cancelLabel: 'Tetap di mode owner',
            }
          : {
              title: 'Kembali ke mode owner?',
              message: 'Semua menu owner aktif lagi: pekerjaan, keuangan, armada, dan laporan.',
              icon: 'briefcase-outline',
              tone: 'info',
              confirmLabel: 'Kembali ke mode owner',
              cancelLabel: 'Tetap di mode driver',
            },
      );
      if (!ok) return;
      await switchView(to);
      router.replace(`/${to}`);
    },
    [dialog, router, switchView],
  );
}
