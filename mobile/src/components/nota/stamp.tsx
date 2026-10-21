import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';
import { color, duration } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';

const press = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 1.28 }, { rotate: '-6deg' }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '-6deg' }] },
}).duration(duration.stamp);

const TONE = { ok: color.okInk, danger: color.dangerInk, neutral: color.neutralInk, carbon: color.carbon } as const;

/**
 * Cap status (DIPERIKSA, DITOLAK, DIGANTI, DISETUJUI). Hanya dirender saat status benar-benar tercapai
 * di sumber data; animasi tekan sekali saat muncul, dilewati bila "kurangi gerakan" aktif.
 */
export function Stamp({ label, tone = 'ok', detail }: { label: string; tone?: keyof typeof TONE; detail?: string }) {
  const ink = TONE[tone];
  return (
    <Animated.View entering={press} style={styles.wrap} accessible accessibilityLabel={`Cap ${label}${detail ? `, ${detail}` : ''}`}>
      <View style={[styles.outer, { borderColor: ink }]}>
        <View style={[styles.inner, { borderColor: ink }]}>
          <Txt variant="label" style={{ color: ink, letterSpacing: 2, fontSize: 13 }} maxFontSizeMultiplier={1.3}>
            {label}
          </Txt>
          {detail ? (
            <Txt variant="caption" style={{ color: ink }} maxFontSizeMultiplier={1.3}>
              {detail}
            </Txt>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', transform: [{ rotate: '-6deg' }] },
  outer: { borderWidth: 2, borderRadius: 4, padding: 2 },
  inner: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
});
