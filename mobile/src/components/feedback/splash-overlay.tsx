import React, { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { space, radius } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Wordmark } from '@/components/brand/wordmark';
import { TowTruckArt } from '@/components/brand/tow-truck';
import { HeroBackground } from '@/components/layout/hero-background';
import { t } from '@/core/i18n';

const TRUCK_W = 200;

/**
 * Splash saat aplikasi dibuka (±1,2 detik): unit towing meluncur masuk dan berhenti di tengah,
 * wordmark muncul di atasnya, lalu seluruh lapisan memudar memperlihatkan aplikasi.
 * Label DEMO tetap tampil. "Kurangi gerakan" = pudar singkat saja.
 */
export function SplashOverlay() {
  const s = useStyles();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const [done, setDone] = useState(false);
  const drive = useSharedValue(reduced ? 1 : 0);
  const mark = useSharedValue(reduced ? 1 : 0);
  const out = useSharedValue(0);

  useEffect(() => {
    const finish = () => setDone(true);
    const fadeOut = (delay: number) => withDelay(delay, withTiming(1, { duration: 260, easing: easeOut }, (ok) => {
      if (ok) runOnJS(finish)();
    }));
    if (reduced) {
      out.value = fadeOut(450);
      return;
    }
    drive.value = withTiming(1, { duration: 700, easing: easeOut });
    mark.value = withDelay(260, withTiming(1, { duration: 420, easing: easeOut }));
    out.value = fadeOut(960);
  }, [reduced, drive, mark, out]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - out.value }));
  const truckStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - drive.value) * -(width / 2 + TRUCK_W) }] }));
  const markStyle = useAnimatedStyle(() => ({ opacity: mark.value, transform: [{ translateY: (1 - mark.value) * 8 }] }));
  const roadStyle = useAnimatedStyle(() => ({ opacity: 0.25 + drive.value * 0.75 }));

  if (done) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root, rootStyle]} pointerEvents="auto" accessibilityLabel={t('Tovv sedang dibuka')}>
      <HeroBackground id="splash" />
      <Animated.View style={[s.center, markStyle]}>
        <Wordmark height={52} />
        <Txt variant="bodySm" tone="onHeroSecondary">Urusan towing, beres dalam satu aplikasi</Txt>
      </Animated.View>
      <View style={s.stage}>
        <Animated.View style={truckStyle}>
          <TowTruckArt width={TRUCK_W} loaded />
        </Animated.View>
        <Animated.View style={[s.road, roadStyle]} />
      </View>
      <View style={s.demo}>
        <Txt variant="caption" tone="demoInk" bold>DEMO — SIMULASI FRONTEND</Txt>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { alignItems: 'center', justifyContent: 'center', gap: space.xxl, zIndex: 100, elevation: 100, backgroundColor: c.heroFrom },
  center: { alignItems: 'center', gap: space.sm },
  stage: { alignItems: 'center' },
  road: { width: 240, height: 3, borderRadius: 2, marginTop: -6, backgroundColor: c.heroChip },
  demo: { position: 'absolute', bottom: space.huge, backgroundColor: c.demoWash, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
}));
