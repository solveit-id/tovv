import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { radius, space } from '@/core/design/tokens';
import { ThemeModeScope, makeStyles } from '@/core/design/theme';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { HeroBackground } from '@/components/layout/hero-background';
import { useApiState } from '@/data/api/provider';
import { t } from '@/core/i18n';

const COPY = {
  driver: { icon: 'steering', title: 'Mode driver', body: 'Tugas, navigasi, dan foto bukti untuk di jalan.' },
  owner: { icon: 'briefcase-outline', title: 'Mode owner', body: 'Pesanan, armada, dan keuangan usaha Anda.' },
} as const;

/**
 * Transisi singkat (±0,8 detik) saat owner berpindah ke mode driver atau sebaliknya: layar berganti
 * warna ke mode tujuan, menyebut mode barunya, lalu memudar. Menutupi pergantian halaman supaya
 * perpindahan terasa disengaja. "Kurangi gerakan" = pudar singkat tanpa gerak.
 */
export function ModeSwitchOverlay() {
  const { modeShift, clearModeShift } = useApiState();
  if (!modeShift || (modeShift.to !== 'driver' && modeShift.to !== 'owner')) return null;
  return (
    <ThemeModeScope mode={modeShift.to === 'driver' ? 'field' : 'brand'}>
      <Panel key={modeShift.key} to={modeShift.to} onDone={clearModeShift} />
    </ThemeModeScope>
  );
}

function Panel({ to, onDone }: { to: 'driver' | 'owner'; onDone: () => void }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const o = useSharedValue(0);
  const lift = useSharedValue(reduced ? 0 : 10);
  const copy = COPY[to];

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(t('Pindah ke {0}', [t(copy.title)]));
    const hold = reduced ? 300 : 460;
    o.value = withSequence(
      withTiming(1, { duration: 160, easing: easeOut }),
      withDelay(hold, withTiming(0, { duration: 240, easing: easeOut }, (ok) => {
        if (ok) runOnJS(onDone)();
      })),
    );
    if (!reduced) lift.value = withTiming(0, { duration: 420, easing: easeOut });
  }, [o, lift, reduced, onDone, copy.title]);

  const root = useAnimatedStyle(() => ({ opacity: o.value }));
  const content = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root, root]} accessibilityLiveRegion="assertive" accessibilityLabel={t('Pindah ke {0}', [t(copy.title)])}>
      <HeroBackground id="mode" />
      <Animated.View style={[s.content, content]}>
        <View style={s.badge}>
          <Icon name={copy.icon} size={34} tone="onModeAccent" />
        </View>
        <Txt variant="display" tone="onHero" align="center">{copy.title}</Txt>
        <Txt variant="body" tone="onHeroSecondary" align="center">{copy.body}</Txt>
      </Animated.View>
      <View style={s.demo}>
        <Txt variant="caption" tone="demoInk" bold>DEMO — SIMULASI FRONTEND</Txt>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c, _scheme, mode) => ({
  root: { zIndex: 90, elevation: 90, alignItems: 'center', justifyContent: 'center' },
  demo: { position: 'absolute', bottom: space.huge, backgroundColor: c.demoWash, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  content: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.xxxl },
  badge: {
    width: 76,
    height: 76,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
    backgroundColor: mode === 'field' ? c.modeAccent : c.heroChip,
  },
}));
