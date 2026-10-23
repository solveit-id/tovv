import * as Location from 'expo-location';
import type { LocationSource } from '@/domain/types';

export interface CaptureLocation {
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  capturedAt: string | null;
  source: LocationSource;
  note: string;
}

const UNKNOWN = (note: string): CaptureLocation => ({ latitude: null, longitude: null, accuracyM: null, capturedAt: null, source: 'unknown', note });

/**
 * Adapter lokasi foto: izin foreground satu kali (bukan pelacakan pelanggan). Hasil jujur:
 * device bila ada fix baru; stale bila hanya lokasi terakhir (dengan umur); unknown bila ditolak/timeout.
 * Tidak pernah mengisi koordinat default.
 */
export async function readCaptureLocation(timeoutMs = 8000): Promise<CaptureLocation> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return UNKNOWN('Izin lokasi ditolak; foto tetap tersimpan tanpa koordinat.');
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) return UNKNOWN('Layanan lokasi perangkat mati.');
    const fix = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((r) => setTimeout(() => r(null), timeoutMs)),
    ]);
    if (fix) {
      return {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        accuracyM: fix.coords.accuracy !== null ? Math.round(fix.coords.accuracy) : null,
        capturedAt: new Date(fix.timestamp).toISOString(),
        source: 'device',
        note: '',
      };
    }
    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      return {
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
        accuracyM: last.coords.accuracy !== null ? Math.round(last.coords.accuracy) : null,
        capturedAt: new Date(last.timestamp).toISOString(),
        source: 'stale',
        note: 'GPS terlalu lama; dipakai lokasi terakhir HP beserta umurnya.',
      };
    }
    return UNKNOWN('GPS tidak memberi lokasi dalam batas waktu.');
  } catch {
    return UNKNOWN('Lokasi tidak tersedia.');
  }
}
