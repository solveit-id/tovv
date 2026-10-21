import { useReducedMotion, Easing } from 'react-native-reanimated';
import { duration } from './tokens';

/** Ease-out eksponensial untuk kemunculan; tidak dipakai untuk loop dekoratif. */
export const easeOut = Easing.out(Easing.exp);
export const easeInOut = Easing.inOut(Easing.cubic);

/** Durasi yang menghormati pengaturan "kurangi gerakan" sistem. */
export function useMotionDuration(key: keyof typeof duration): number {
  const reduced = useReducedMotion();
  return reduced ? 0 : duration[key];
}

export { useReducedMotion };
