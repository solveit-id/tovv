import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { color, radius, space, touch } from '@/core/design/tokens';
import { Txt } from './txt';
import { Icon } from './icon';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'onNavy';

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

const FILL: Record<Variant, { bg: string; fg: 'onNavy' | 'carbon' | 'dangerInk' | 'ink'; border: string }> = {
  primary: { bg: color.carbon, fg: 'onNavy', border: color.carbon },
  secondary: { bg: color.sheet, fg: 'carbon', border: color.carbon },
  quiet: { bg: 'transparent', fg: 'carbon', border: 'transparent' },
  danger: { bg: color.sheet, fg: 'dangerInk', border: color.dangerInk },
  onNavy: { bg: color.navyRaised, fg: 'onNavy', border: color.onNavySecondary },
};

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, size = 'md', accessibilityHint, style, compact }: ButtonProps) {
  const f = FILL[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        if (variant === 'primary' && size === 'lg') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      hitSlop={compact ? 6 : 0}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        compact && styles.compact,
        { backgroundColor: variant === 'primary' && pressed ? color.carbonPressed : f.bg, borderColor: inactive ? color.rule : f.border },
        inactive && variant === 'primary' && { backgroundColor: color.inkDisabled, borderColor: color.inkDisabled },
        pressed && variant !== 'primary' && { backgroundColor: variant === 'onNavy' ? color.navy : color.carbonTint },
        pressed && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? color.onNavy : color.carbon} size="small" />
        ) : icon ? (
          <Icon name={icon} size={size === 'lg' ? 22 : 18} tone={inactive && variant !== 'primary' ? 'inkDisabled' : f.fg} />
        ) : null}
        <Txt variant={size === 'lg' ? 'titleSm' : 'bodyStrong'} tone={inactive && variant !== 'primary' ? 'inkDisabled' : f.fg} numberOfLines={2} style={styles.label}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min,
    borderRadius: radius.control,
    borderWidth: 1.5,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    justifyContent: 'center',
  },
  lg: { minHeight: 56, paddingVertical: space.md },
  compact: { minHeight: 40, paddingHorizontal: space.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  label: { textAlign: 'center', flexShrink: 1 },
});
