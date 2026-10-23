import { useCallback, type RefObject } from 'react';
import { useWindowDimensions, type View } from 'react-native';
import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useReducedMotion } from '@/core/design/motion';
import { useScrollState } from './scroll-context';

/**
 * Efek scroll-trigger: elemen di bawah layar naik 24 dp dan menjadi jelas saat digulir masuk ke
 * layar, lalu diam. Elemen yang sudah terlihat saat layar dibuka tidak dianimasikan (tidak pernah
 * tersembunyi). Dihitung di UI thread dari posisi gulir; tanpa efek saat "kurangi gerakan".
 */
export function useScrollReveal(ref: RefObject<View | null>) {
  const scroll = useScrollState();
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const top = useSharedValue(-1);

  const onLayout = useCallback(() => {
    const content = scroll?.contentRef.current;
    const node = ref.current;
    if (!scroll || !content || !node) return;
    node.measureLayout(content, (_x, y) => {
      top.set((scroll.hero ? scroll.heroH.value : 0) + y);
    });
  }, [scroll, top, ref]);

  const style = useAnimatedStyle(() => {
    if (!scroll || reduced || top.value < 0) return {};
    // Hanya elemen yang awalnya di bawah layar yang ikut efek ini.
    if (top.value < height - 40) return {};
    const enter = scroll.y.value + height - top.value;
    const p = interpolate(enter, [0, 140], [0, 1], Extrapolation.CLAMP);
    return { opacity: 0.35 + p * 0.65, transform: [{ translateY: (1 - p) * 24 }, { scale: 0.97 + p * 0.03 }] };
  });

  return { onLayout, style };
}
