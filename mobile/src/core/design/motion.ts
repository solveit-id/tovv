import { useReducedMotion, Easing, FadeInDown, type WithSpringConfig } from 'react-native-reanimated';
import { duration } from './tokens';

/** Ease-out eksponensial untuk kemunculan; tidak dipakai untuk loop dekoratif. */
export const easeOut = Easing.out(Easing.exp);
export const easeInOut = Easing.inOut(Easing.cubic);

/** Pegas tekan: cepat, tanpa memantul berlebihan. */
export const pressSpring: WithSpringConfig = { damping: 18, stiffness: 320, mass: 0.6 };
/** Pegas indikator/tata letak: sedikit lebih lembut. */
export const glideSpring: WithSpringConfig = { damping: 20, stiffness: 220, mass: 0.8 };

/** Durasi yang menghormati pengaturan "kurangi gerakan" sistem. */
export function useMotionDuration(key: keyof typeof duration): number {
  const reduced = useReducedMotion();
  return reduced ? 0 : duration[key];
}

/** Hanya beberapa item pertama yang masuk bertahap; sisanya langsung tampil agar daftar panjang tetap ringan. */
const STAGGER_LIMIT = 8;

/**
 * Animasi masuk bertahap untuk kartu/daftar (naik 12 dp + memudar). Mengembalikan `undefined`
 * bila "kurangi gerakan" aktif atau indeks melewati batas.
 */
export function useEnter(index = 0) {
  const reduced = useReducedMotion();
  if (reduced || index >= STAGGER_LIMIT) return undefined;
  return FadeInDown.duration(duration.slow).delay(60 + index * 45).easing(easeOut).withInitialValues({ transform: [{ translateY: 12 }] });
}

export { useReducedMotion };
