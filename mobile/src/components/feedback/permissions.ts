import { useCallback } from 'react';
import { Linking } from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { t } from '@/core/i18n';
import { useDialog } from './dialog';
import { useToast } from './toast';

export type PermissionKind = 'camera' | 'location' | 'photos';

interface PermissionLike {
  granted: boolean;
  canAskAgain: boolean;
}

const SOURCE: Record<PermissionKind, { get: () => Promise<PermissionLike>; request: () => Promise<PermissionLike> }> = {
  camera: { get: () => Camera.getCameraPermissionsAsync(), request: () => Camera.requestCameraPermissionsAsync() },
  location: { get: () => Location.getForegroundPermissionsAsync(), request: () => Location.requestForegroundPermissionsAsync() },
  photos: { get: () => ImagePicker.getMediaLibraryPermissionsAsync(), request: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
};

const COPY: Record<PermissionKind, { name: string; icon: string; title: string; message: string; points: string[] }> = {
  camera: {
    name: 'kamera',
    icon: 'camera-outline',
    title: 'Izinkan kamera?',
    message: 'Kamera dipakai untuk memotret kondisi kendaraan dan bukti serah-terima.',
    points: ['Foto hanya dipakai untuk pekerjaan ini', 'Waktu dan lokasi foto dicatat apa adanya'],
  },
  location: {
    name: 'lokasi',
    icon: 'map-marker-radius-outline',
    title: 'Izinkan lokasi?',
    message: 'Lokasi dipakai untuk mengisi titik jemput, menampilkan posisi Anda di peta, dan mencatat lokasi foto bukti.',
    points: ['Hanya saat aplikasi dibuka', 'Tidak melacak Anda di latar belakang'],
  },
  photos: {
    name: 'galeri',
    icon: 'image-multiple-outline',
    title: 'Izinkan galeri?',
    message: 'Galeri dipakai saat Anda memilih foto yang sudah ada di HP.',
    points: ['Foto dari galeri diberi label "impor", bukan kamera'],
  },
};

/**
 * Minta izin dengan penjelasan Tovv lebih dulu, baru dialog sistem. Bila izin sudah ditolak permanen,
 * tawarkan membuka pengaturan HP. Mengembalikan true bila izin sudah diberikan.
 */
export function usePermission() {
  const dialog = useDialog();
  const toast = useToast();
  return useCallback(
    async (kind: PermissionKind): Promise<boolean> => {
      const src = SOURCE[kind];
      const copy = COPY[kind];
      const now = await src.get().catch(() => null);
      if (now?.granted) return true;
      if (now && !now.canAskAgain) {
        const open = await dialog.confirm({
          title: t('Izin {0} masih ditolak', [t(copy.name)]),
          message: t('Buka pengaturan HP, lalu izinkan {0} untuk Tovv. Setelah itu kembali ke aplikasi.', [t(copy.name)]),
          icon: copy.icon,
          tone: 'warn',
          confirmLabel: 'Buka pengaturan',
          cancelLabel: 'Nanti saja',
        });
        if (open) void Linking.openSettings();
        return false;
      }
      const go = await dialog.confirm({ title: copy.title, message: copy.message, points: copy.points, icon: copy.icon, tone: 'info', confirmLabel: t('Izinkan {0}', [t(copy.name)]), cancelLabel: 'Nanti saja' });
      if (!go) return false;
      const res = await src.request().catch(() => null);
      if (res?.granted) return true;
      toast.show(t('Izin {0} tidak diberikan. Anda tetap bisa lanjut tanpa {0}.', [t(copy.name)]), 'info');
      return false;
    },
    [dialog, toast],
  );
}
