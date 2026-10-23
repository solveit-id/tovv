import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { space, radius } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Wordmark } from '@/components/brand/wordmark';
import { HeroBackground } from '@/components/layout/hero-background';
import { t } from '@/core/i18n';

/**
 * Splash saat aplikasi dibuka: wordmark muncul dengan pegas, garis "derek" melintas di bawahnya,
 * lalu seluruh lapisan membesar sedikit dan memudar memperlihatkan aplikasi (±1,4 detik).
 * Label DEMO tetap tampil. "Kurangi gerakan" = pudar singkat saja.
 */
export function SplashOverlay() {
  const s = useStyles();
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const logo = useSharedValue(reduced ? 1 : 0);
  const sweep = useSharedValue(0);
  const out = useSharedValue(0);

  useEffect(() => {
    const finish = () => setDone(true);
    if (reduced) {
      out.value = withDelay(500, withTiming(1, { duration: 200 }, (ok) => ok && runOnJS(finish)()));
      return;
    }
    logo.value = withSpring(1, { damping: 13, stiffness: 140 });
    sweep.value = withDelay(250, withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) }));
    out.value = withDelay(1150, withSequence(withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }, (ok) => ok && runOnJS(finish)())));
  }, [reduced, logo, sweep, out]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - out.value, transform: [{ scale: 1 + out.value * 0.06 }] }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.value, transform: [{ scale: 0.7 + logo.value * 0.3 }, { translateY: (1 - logo.value) * 16 }] }));
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: sweep.value }] }));

  if (done) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root, rootStyle]} pointerEvents="none" accessibilityLabel={t('Tovv sedang dibuka')}>
      <HeroBackground id="splash" />
      <Animated.View style={logoStyle}>
        <Wordmark height={64} />
      </Animated.View>
      <View style={s.track}>
        <Animated.View style={[s.sweep, sweepStyle]} />
      </View>
      <Txt variant="bodySm" tone="onHeroSecondary">Urusan derek, beres dalam satu aplikasi</Txt>
      <View style={s.demo}>
        <Txt variant="caption" tone="demoInk" bold>DEMO — SIMULASI FRONTEND</Txt>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { alignItems: 'center', justifyContent: 'center', gap: space.lg, zIndex: 100, elevation: 100, backgroundColor: c.heroFrom },
  track: { width: 120, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  sweep: { width: 120, height: 4, borderRadius: 2, backgroundColor: c.brandSky, transformOrigin: 'left' },
  demo: { position: 'absolute', bottom: space.huge, backgroundColor: c.demoWash, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
}));
