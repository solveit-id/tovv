import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Extrapolation, ZoomIn, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, elevation } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useReducedMotion } from '@/core/design/motion';
import { Wordmark } from '@/components/brand/wordmark';
import { HeroBackground } from './hero-background';
import { ScrollContext } from './scroll-context';

const MAX_CONTENT = 720;
const BAR_H = 52;

/** Judul bar ringkas diambil dari prop `title` RootHeader (tanpa judul = wordmark). */
function headerTitle(header: React.ReactNode): string | null {
  if (React.isValidElement<{ title?: string }>(header)) return header.props.title ?? null;
  return null;
}

/**
 * Kerangka layar: header di atas, isi bergulir native (tanpa scroll-jacking), opsi tarik-untuk-muat-ulang,
 * dan area aksi tetap di bawah yang terjangkau ibu jari serta naik bersama keyboard.
 * Dengan `headerScrolls`, header gradien ikut bergulir dengan parallax dan bar ringkas bergradien
 * muncul di atas saat header hampir hilang. Posisi gulir dihitung di UI thread (Reanimated).
 */
export function Screen({
  header,
  children,
  footer,
  onRefresh,
  scroll = true,
  contentStyle,
  headerScrolls = false,
  fab,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onRefresh?: () => Promise<unknown>;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  headerScrolls?: boolean;
  /** Aksi utama mengambang (extended FAB) di atas tab bar; label menyusut jadi ikon saat menggulir turun. */
  fab?: { label: string; icon: string; onPress: () => void; accessibilityHint?: string };
}) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const s = useStyles();
  const [refreshing, setRefreshing] = useState(false);
  const y = useSharedValue(0);
  const heroH = useSharedValue(0);
  const scrollState = useMemo(() => ({ y, heroH }), [y, heroH]);
  const reduced = useReducedMotion();
  const fabOpen = useSharedValue(1);
  const fabP = useSharedValue(1);
  const lastY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    const ny = e.contentOffset.y;
    if (Math.abs(ny - lastY.value) > 6) {
      const next = ny > lastY.value && ny > 40 ? 0 : 1;
      if (next !== fabOpen.value) {
        fabOpen.set(next);
        fabP.set(reduced ? next : withTiming(next, { duration: 220 }));
      }
      lastY.set(ny);
    }
    y.set(ny);
  });
  // Label menyusut ke lebar 0 dan jarak ikon-label hilang: tombol menjadi ikon bundar.
  const fabLabel = useAnimatedStyle(() => ({ opacity: fabP.value, maxWidth: fabP.value * 220, marginLeft: fabP.value * space.sm }));
  const fabBox = useAnimatedStyle(() => ({ paddingHorizontal: space.md + fabP.value * (space.lg - space.md) }));
  const hero = headerScrolls && scroll;
  const title = hero ? headerTitle(header) : null;

  const barStyle = useAnimatedStyle(() => {
    const h = heroH.value || 200;
    // Header pendek: bar baru muncul setelah benar-benar digulir, tidak pernah saat posisi awal.
    const start = Math.max(h - BAR_H * 2, 12);
    const p = interpolate(y.value, [start, Math.max(h - BAR_H, start + 32)], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: (1 - p) * -8 }] };
  });

  const body = scroll ? (
    <Animated.ScrollView
      style={s.flex}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: footer ? space.xxl : space.huge + insets.bottom }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            tintColor={hero ? c.onHero : c.accent}
            colors={[c.accent]}
            progressBackgroundColor={c.surface}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await onRefresh();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        ) : undefined
      }
    >
      {hero ? header : null}
      <View style={[s.content, contentStyle]}>{children}</View>
    </Animated.ScrollView>
  ) : (
    <View style={[s.flex, contentStyle]}>{children}</View>
  );

  return (
    <ScrollContext.Provider value={hero ? scrollState : null}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {hero ? null : header}
        {body}
        {hero ? (
          <Animated.View style={[s.bar, barStyle]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <HeroBackground id="bar" />
            {title ? <Txt variant="titleSm" tone="onHero" numberOfLines={1}>{title}</Txt> : <Wordmark height={22} />}
          </Animated.View>
        ) : null}
        {fab ? (
          <Animated.View entering={reduced ? undefined : ZoomIn.springify().damping(16)} style={[s.fabWrap, { bottom: footer ? 96 : space.lg }]}>
            <PressableScale depth="subtle" onPress={fab.onPress} accessibilityRole="button" accessibilityLabel={fab.label} accessibilityHint={fab.accessibilityHint} style={s.fab}>
              <Animated.View style={[s.fabRow, fabBox]}>
                <Icon name={fab.icon} size={24} tone="onAccent" />
                <Animated.View style={[{ overflow: 'hidden' }, fabLabel]}>
                  <Txt variant="bodyStrong" tone="onAccent" numberOfLines={1}>{fab.label}</Txt>
                </Animated.View>
              </Animated.View>
            </PressableScale>
          </Animated.View>
        ) : null}
        {footer ? (
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
            <View style={s.footerInner}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </ScrollContext.Provider>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  // Lebar baca dibatasi di tablet/lanskap; header tetap selebar layar.
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, height: BAR_H, justifyContent: 'center', paddingHorizontal: space.lg, overflow: 'hidden' },
  footer: {
    backgroundColor: c.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.line,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  fabWrap: { position: 'absolute', right: space.lg },
  fabRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  fab: { minWidth: 56, borderRadius: radius.lg + 2, backgroundColor: c.accent, ...elevation(3, c) },
  footerInner: { gap: space.sm, width: '100%', maxWidth: MAX_CONTENT - space.lg * 2, alignSelf: 'center' },
}));
