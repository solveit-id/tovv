import React from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { pressSpring } from '@/core/design/motion';

const APressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Kedalaman tekan: `subtle` untuk tombol dan ikon, `card` untuk kartu besar (lebih halus). */
  depth?: 'subtle' | 'card';
  children: React.ReactNode;
}

/**
 * Permukaan yang dapat ditekan dengan umpan balik "turun" di UI thread: sedikit mengecil dan meredup,
 * lalu kembali tanpa memantul. "Kurangi gerakan" = hanya meredup.
 */
export function PressableScale({ depth = 'card', style, children, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const minScale = depth === 'card' ? 0.985 : 0.965;

  const anim = useAnimatedStyle(() => {
    if (reduced) return { opacity: 1 - pressed.value * 0.2 };
    return { opacity: 1 - pressed.value * 0.06, transform: [{ scale: 1 - (1 - minScale) * pressed.value }] };
  });

  const handleIn = (e: GestureResponderEvent) => {
    pressed.value = withTiming(1, { duration: 90 });
    onPressIn?.(e);
  };
  const handleOut = (e: GestureResponderEvent) => {
    pressed.value = withSpring(0, pressSpring);
    onPressOut?.(e);
  };

  return (
    <APressable {...rest} onPressIn={handleIn} onPressOut={handleOut} style={[style, anim]}>
      {children}
    </APressable>
  );
}
