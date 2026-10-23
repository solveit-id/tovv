import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated, { Extrapolation, FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Wordmark } from '@/components/brand/wordmark';
import { HeroBackground } from '@/components/layout/hero-background';

/**
 * Kerangka layar akun (masuk, daftar, lupa kata sandi): latar gradien merek dengan wordmark,
 * lalu kartu putih yang naik dari bawah sambil tegak dari posisi miring (kesan 3D).
 * Saat digulir, judul di atas bergerak lebih lambat dan memudar (parallax).
 */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const rise = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (!reduced) rise.value = withDelay(120, withSpring(1, { damping: 18, stiffness: 140, mass: 0.9 }));
  }, [reduced, rise]);

  const onScroll = useAnimatedScrollHandler((e) => {
    y.set(e.contentOffset.y);
  });
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 160], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: y.value * 0.45 }, { scale: interpolate(y.value, [-120, 0], [1.08, 1], Extrapolation.CLAMP) }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rise.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [{ perspective: 1000 }, { translateY: (1 - rise.value) * 80 }, { rotateX: `${(1 - rise.value) * 14}deg` }],
  }));

  return (
    <View style={s.root}>
      <HeroBackground id="auth" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <Animated.View style={[s.hero, heroStyle]}>
            <Animated.View entering={reduced ? undefined : FadeInDown.duration(420).easing(easeOut)}>
              <Wordmark height={40} />
            </Animated.View>
            <Animated.View entering={reduced ? undefined : FadeInDown.delay(90).duration(420).easing(easeOut)} style={{ gap: space.xs }}>
              <Txt variant="display" tone="onHero">{title}</Txt>
              <Txt variant="body" tone="onHeroSecondary">{subtitle}</Txt>
            </Animated.View>
          </Animated.View>
          <Animated.View style={[s.card, { paddingBottom: Math.max(insets.bottom, space.lg) + space.lg }, cardStyle]}>
            {children}
            {footer ? <View style={s.footer}>{footer}</View> : null}
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.heroFrom },
  hero: { paddingHorizontal: space.xl, paddingTop: space.xxl, paddingBottom: space.xxxl, gap: space.xl },
  card: { flexGrow: 1, backgroundColor: c.bg, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: space.xl, paddingTop: space.xxl, gap: space.xs },
  footer: { marginTop: space.lg, alignItems: 'center', gap: space.sm },
}));
