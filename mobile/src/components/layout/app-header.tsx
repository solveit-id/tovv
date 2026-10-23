import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { radius, space, touch, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useTheme } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Wordmark } from '@/components/brand/wordmark';
import { HeroBackground } from './hero-background';
import { useScrollState } from './scroll-context';
import { t } from '@/core/i18n';

export function HeaderIconButton({ icon, label, onPress, badge, tone = 'onHero' }: { icon: string; label: string; onPress: () => void; badge?: number; tone?: ColorToken }) {
  const s = useStyles();
  const onHero = tone === 'onHero';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? t('{0}, {1} belum dibaca', [label, badge]) : label}
      hitSlop={4}
      style={({ pressed }) => [s.iconBtn, onHero ? s.iconOnHero : s.iconPlain, pressed && (onHero ? s.iconOnHeroPressed : s.iconPlainPressed)]}
    >
      <Icon name={icon} size={22} tone={tone} />
      {badge ? (
        <View style={s.badge}>
          <Txt variant="caption" tone="onAccent" style={{ fontSize: 10, lineHeight: 12, fontWeight: '800' }} maxFontSizeMultiplier={1.2}>
            {badge > 9 ? '9+' : String(badge)}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Header akar tab: gradien biru merek dengan judul besar (atau wordmark), konteks dan tindakan.
 * Saat digulir, latarnya bergerak sedikit lebih lambat (parallax) dan isinya memudar; saat ditarik ke bawah
 * latarnya meregang. `overlap` memberi ruang untuk kartu ringkasan yang menimpa tepi bawah header.
 */
export function RootHeader({ title, subtitle, right, children, overlap, chip }: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  overlap?: boolean;
  /** Pil keadaan di bawah subjudul, mis. "Mode driver". Bukan judul kecil di atas judul. */
  chip?: { icon: string; label: string };
}) {
  const s = useStyles();
  const { mode } = useTheme();
  const scroll = useScrollState();
  const reduced = useReducedMotion();
  const chipInk = mode === 'field' ? 'onModeAccent' : 'onHero';

  const bgStyle = useAnimatedStyle(() => {
    if (!scroll?.hero || reduced) return {};
    const y = scroll.y.value;
    const h = Math.max(1, scroll.heroH.value);
    return {
      // Gulir naik: latar sedikit lebih lambat dari isi. Tarik turun: latar meregang menutup celah di atasnya.
      transform: [{ translateY: y > 0 ? y * 0.4 : 0 }, { scale: y < 0 ? 1 + -y / h : 1 }],
    };
  });
  const contentStyle = useAnimatedStyle(() => {
    if (!scroll?.hero || reduced) return {};
    const y = scroll.y.value;
    return {
      opacity: interpolate(y, [0, 120], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(y, [0, 120], [0, 12], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View
      style={[s.root, overlap && s.overlap]}
      onLayout={(e) => {
        scroll?.heroH.set(e.nativeEvent.layout.height);
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <HeroBackground />
      </Animated.View>
      <Animated.View style={[s.inner, contentStyle]}>
        <View style={s.rootRow}>
          <View style={{ flex: 1, gap: 4 }}>
            {title ? (
              <Txt variant="display" tone="onHero" accessibilityRole="header" numberOfLines={2}>{title}</Txt>
            ) : (
              <View accessibilityRole="header">
                <Wordmark height={30} />
              </View>
            )}
            {subtitle ? <Txt variant="bodySm" tone="onHeroSecondary" numberOfLines={2}>{subtitle}</Txt> : null}
            {chip ? (
              <View style={s.chip} accessibilityRole="text">
                <Icon name={chip.icon} size={14} tone={chipInk} />
                <Txt variant="caption" tone={chipInk} bold maxFontSizeMultiplier={1.3}>{chip.label}</Txt>
              </View>
            ) : null}
          </View>
          <View style={s.actions}>{right}</View>
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

/** Header layar detail: tombol kembali membulat, judul dan konteks. Gesture back OS tetap aktif. */
export function DetailHeader({ title, subtitle, right, serial }: { title: string; subtitle?: string; right?: React.ReactNode; serial?: string }) {
  const router = useRouter();
  const s = useStyles();
  return (
    <View style={s.detail}>
      <HeaderIconButton icon="arrow-left" label="Kembali" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} tone="ink" />
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="titleSm" accessibilityRole="header" numberOfLines={2}>{title}</Txt>
        {serial || subtitle ? <Txt variant="caption" tone="inkSecondary" numberOfLines={2}>{[serial, subtitle].filter(Boolean).join(' · ')}</Txt> : null}
      </View>
      <View style={s.actions}>{right}</View>
    </View>
  );
}

const useStyles = makeStyles((c, _scheme, mode) => ({
  root: { overflow: 'hidden', borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  overlap: { paddingBottom: 56 },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, marginTop: space.xs, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: mode === 'field' ? c.modeAccent : c.heroChip },
  inner: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl, gap: space.lg },
  rootRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', margin: (touch.min - 44) / 2 },
  iconOnHero: { backgroundColor: c.heroChip },
  iconOnHeroPressed: { backgroundColor: 'rgba(255,255,255,0.28)' },
  iconPlain: { backgroundColor: c.surfaceAlt },
  iconPlainPressed: { backgroundColor: c.surfacePressed },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: c.badge, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.heroFrom },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingRight: space.md,
    paddingLeft: space.sm,
    paddingVertical: space.xs,
    backgroundColor: c.bg,
    minHeight: 64,
  },
}));
