import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/core/design/theme';

/**
 * Latar header. Mode owner/pelanggan: gradien biru merek (Solveit #1136D6 → biru langit) dengan satu
 * cahaya langit di kanan atas. Mode driver: biru-arang dengan cahaya kuning dan dua garis marka jalan
 * putus-putus yang samar, supaya mode kerja di jalan langsung terasa berbeda.
 * Digambar SVG agar tidak butuh modul native tambahan; ukuran diukur eksplisit karena tinggi persen
 * SVG tidak mengikuti padding induk di Android.
 */
export const HeroBackground = React.memo(function HeroBackground({ id = 'hero' }: { id?: string }) {
  const { c, mode } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: c.heroFrom }]}
      pointerEvents="none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== w || height !== h) setSize({ w: width, h: height });
      }}
    >
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.heroFrom} />
              <Stop offset="1" stopColor={c.heroTo} />
            </LinearGradient>
            <RadialGradient id={`${id}-r`} cx="0.92" cy="0.05" r="0.7">
              <Stop offset="0" stopColor={c.heroGlow} stopOpacity={mode === 'field' ? 0.32 : 0.55} />
              <Stop offset="1" stopColor={c.heroGlow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={w} height={h} fill={`url(#${id}-g)`} />
          <Rect x="0" y="0" width={w} height={h} fill={`url(#${id}-r)`} />
          {mode === 'field' ? (
            <>
              <Path d={`M ${-w * 0.05} ${h * 0.98} C ${w * 0.35} ${h * 0.7}, ${w * 0.6} ${h * 0.55}, ${w * 1.05} ${h * 0.18}`} stroke={c.heroGlow} strokeOpacity={0.22} strokeWidth={3} strokeDasharray="18 14" fill="none" />
              <Path d={`M ${w * 0.25} ${h * 1.05} C ${w * 0.55} ${h * 0.82}, ${w * 0.75} ${h * 0.66}, ${w * 1.05} ${h * 0.5}`} stroke={c.onHero} strokeOpacity={0.06} strokeWidth={2} strokeDasharray="12 12" fill="none" />
            </>
          ) : (
            <Circle cx={w * 0.88} cy={h * 1.08} r={w * 0.34} fill={c.onHero} opacity={0.05} />
          )}
        </Svg>
      ) : null}
    </View>
  );
});
