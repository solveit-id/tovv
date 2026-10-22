import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '@/core/design/theme';

/**
 * Latar header: gradien biru merek (Solveit #1136D6 → biru langit) dengan satu cahaya langit
 * di kanan atas. Digambar SVG agar tidak butuh modul native tambahan. Ukuran diukur eksplisit
 * karena tinggi persen SVG tidak mengikuti padding induk di Android.
 */
export function HeroBackground({ id = 'hero' }: { id?: string }) {
  const c = useColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: c.heroFrom }]}
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.heroFrom} />
              <Stop offset="1" stopColor={c.heroTo} />
            </LinearGradient>
            <RadialGradient id={`${id}-r`} cx="0.92" cy="0.05" r="0.7">
              <Stop offset="0" stopColor={c.heroGlow} stopOpacity="0.55" />
              <Stop offset="1" stopColor={c.heroGlow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${id}-g)`} />
          <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${id}-r)`} />
          <Circle cx={size.w * 0.88} cy={size.h * 1.08} r={size.w * 0.34} fill="#FFFFFF" opacity={0.05} />
        </Svg>
      ) : null}
    </View>
  );
}
