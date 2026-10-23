import { useReducedMotion, Easing, FadeInDown, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';
import { duration } from './tokens';

/**
 * Bahasa gerak Tovv: pendek, tenang, tanpa memantul. Kemunculan memakai perlambatan halus
 * (ease-out quint), tekan memakai pegas yang tidak melewati target. Tidak ada loop dekoratif;
 * yang berulang hanya penanda yang memang sedang menunggu (kerangka muat, titik "langsung").
 */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.inOut(Easing.cubic);

/** Pegas tekan: cepat dan tidak memantul. */
export const pressSpring: WithSpringConfig = { damping: 26, stiffness: 420, mass: 0.6, overshootClamping: true };
/** Pegas indikator/tata letak: lembut, tetap tanpa memantul. */
export const glideSpring: WithSpringConfig = { damping: 24, stiffness: 240, mass: 0.8, overshootClamping: true };
/** Waktu standar untuk perubahan keadaan (buka/tutup, ganti langkah). */
export const stateTiming: WithTimingConfig = { duration: duration.base, easing: easeOut };

/** Durasi yang menghormati pengaturan "kurangi gerakan" sistem. */
export function useMotionDuration(key: keyof typeof duration): number {
  const reduced = useReducedMotion();
  return reduced ? 0 : duration[key];
}

/** Hanya beberapa item pertama yang masuk bertahap; sisanya langsung tampil agar daftar panjang tetap ringan. */
const STAGGER_LIMIT = 6;

/**
 * Animasi masuk untuk kartu daftar: memudar sambil naik 6 dp, jeda 30 ms per item.
 * Mengembalikan `undefined` bila "kurangi gerakan" aktif atau indeks melewati batas.
 */
export function useEnter(index = 0) {
  const reduced = useReducedMotion();
  if (reduced || index >= STAGGER_LIMIT) return undefined;
  return FadeInDown.duration(duration.slow).delay(index * 30).easing(easeOut).withInitialValues({ opacity: 0, transform: [{ translateY: 6 }] });
}

export { useReducedMotion };
