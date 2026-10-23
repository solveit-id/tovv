import { tr } from '@/core/i18n';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, space, touch, elevation, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { PressableScale } from './pressable-scale';
import { Txt } from './txt';
import { Icon } from './icon';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'onHero' | 'mode';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Aksi utama lapangan: lebih tinggi dan selebar wadah. */
  size?: 'md' | 'lg';
  accessibilityHint?: string;
  style?: ViewStyle;
  compact?: boolean;
}

const INK: Record<Variant, ColorToken> = {
  primary: 'onAccent',
  secondary: 'accentInk',
  quiet: 'accentInk',
  danger: 'dangerInk',
  onHero: 'onHero',
  mode: 'onModeAccent',
};

/**
 * Tombol: primary terisi biru merek (dengan bayangan lembut), secondary tonal, quiet teks saja,
 * danger tonal merah, onHero untuk di atas header gradien, mode = warna mode aktif (kuning di mode driver).
 * Tekan = turun skala di UI thread.
 */
export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, size = 'md', accessibilityHint, style, compact }: ButtonProps) {
  const c = useColors();
  const s = useStyles();
  const inactive = disabled || loading;
  const fg: ColorToken = inactive && variant !== 'primary' && variant !== 'mode' ? 'inkMuted' : inactive && variant === 'mode' ? 'onAccent' : INK[variant];
  return (
    <PressableScale
      depth="subtle"
      accessibilityRole="button"
      accessibilityLabel={tr(label)}
      accessibilityHint={accessibilityHint ? tr(accessibilityHint) : undefined}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        if ((variant === 'primary' || variant === 'mode') && size === 'lg') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      hitSlop={compact ? 6 : 0}
      style={[
        s.base,
        size === 'lg' && s.lg,
        compact && s.compact,
        s[variant],
        inactive && (variant === 'primary' || variant === 'mode' ? s.primaryOff : s.off),
        style,
      ]}
    >
      <View style={s.row}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? c.onAccent : variant === 'mode' ? c.onModeAccent : c.accentInk} size="small" />
        ) : icon ? (
          <Icon name={icon} size={size === 'lg' ? 22 : 18} tone={fg} />
        ) : null}
        <Txt variant={size === 'lg' ? 'titleSm' : 'bodyStrong'} tone={fg} numberOfLines={2} style={s.label}>
          {label}
        </Txt>
      </View>
    </PressableScale>
  );
}

const useStyles = makeStyles((c) => ({
  base: {
    minHeight: touch.min,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    justifyContent: 'center',
  },
  lg: { minHeight: 56, paddingVertical: space.md, borderRadius: radius.lg },
  compact: { minHeight: 40, paddingHorizontal: space.md, borderRadius: radius.pill },
  primary: { backgroundColor: c.accent, ...elevation(1, c) },
  mode: { backgroundColor: c.modeAccent, ...elevation(1, c) },
  secondary: { backgroundColor: c.accentSoft },
  quiet: { backgroundColor: 'transparent' },
  danger: { backgroundColor: c.dangerWash },
  onHero: { backgroundColor: c.heroChip, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: 'rgba(255,255,255,0.28)' },
  primaryOff: { backgroundColor: c.inkMuted, boxShadow: 'none' },
  off: { backgroundColor: c.surfaceAlt },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  label: { textAlign: 'center', flexShrink: 1 },
}));
