import React from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { pressSpring } from '@/core/design/motion';

const APressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Kedalaman tekan: skala minimum dan kemiringan 3D maksimum (derajat). */
  depth?: 'subtle' | 'card';
  children: React.ReactNode;
}

/**
 * Permukaan yang dapat ditekan dengan umpan balik "turun" di UI thread: skala mengecil dan,
 * untuk kartu, miring 3D halus ke arah jari (perspektif 900). "Kurangi gerakan" = hanya redup.
 */
export function PressableScale({ depth = 'card', style, children, onPressIn, onPressOut, disabled, ...rest }: PressableScaleProps) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const tilt = useSharedValue(0);
  const width = useSharedValue(1);
  const minScale = depth === 'card' ? 0.975 : 0.96;
  const maxTilt = depth === 'card' ? 4 : 0;

  const anim = useAnimatedStyle(() => {
    if (reduced) return { opacity: 1 - pressed.value * 0.25 };
    const s = 1 - (1 - minScale) * pressed.value;
    return {
      transform: [{ perspective: 900 }, { scale: s }, { rotateY: `${tilt.value * maxTilt * pressed.value}deg` }],
    };
  });

  const handleIn = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    tilt.value = Math.max(-1, Math.min(1, (x / width.value - 0.5) * 2));
    pressed.value = withSpring(1, pressSpring);
    onPressIn?.(e);
  };
  const handleOut = (e: GestureResponderEvent) => {
    pressed.value = withSpring(0, pressSpring);
    onPressOut?.(e);
  };

  return (
    <APressable
      {...rest}
      disabled={disabled}
      onLayout={(e) => {
        width.value = Math.max(1, e.nativeEvent.layout.width);
        rest.onLayout?.(e);
      }}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[style, anim]}
    >
      {children}
    </APressable>
  );
}
