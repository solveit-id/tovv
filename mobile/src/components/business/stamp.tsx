import React from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { radius, space, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';

const TONE: Record<'ok' | 'danger' | 'neutral' | 'carbon', { ink: ColorToken; wash: ColorToken; icon: string }> = {
  ok: { ink: 'okInk', wash: 'okWash', icon: 'check-decagram' },
  danger: { ink: 'dangerInk', wash: 'dangerWash', icon: 'close-octagon' },
  neutral: { ink: 'neutralInk', wash: 'neutralWash', icon: 'swap-horizontal-circle' },
  carbon: { ink: 'accentInk', wash: 'accentSoft', icon: 'shield-check' },
};

/**
 * Lencana hasil (DISETUJUI, DITOLAK, DIGANTI, DIPERIKSA). Hanya dirender saat status benar-benar tercapai
 * di sumber data; muncul dengan pegas sekali, dilewati bila "kurangi gerakan" aktif.
 */
export function Stamp({ label, tone = 'ok', detail }: { label: string; tone?: keyof typeof TONE; detail?: string }) {
  const s = useStyles();
  const c = useColors();
  const reduced = useReducedMotion();
  const t = TONE[tone];
  return (
    <Animated.View entering={reduced ? undefined : ZoomIn.springify().damping(14)} style={[s.wrap, { backgroundColor: c[t.wash] }]} accessible accessibilityLabel={`Status ${label}${detail ? `, ${detail}` : ''}`}>
      <Icon name={t.icon} size={22} tone={t.ink} />
      <View style={{ flexShrink: 1 }}>
        <Txt variant="label" tone={t.ink} style={{ letterSpacing: 1, fontWeight: '800' }} maxFontSizeMultiplier={1.3}>
          {label}
        </Txt>
        {detail ? (
          <Txt variant="caption" tone={t.ink} maxFontSizeMultiplier={1.3}>
            {detail}
          </Txt>
        ) : null}
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: space.sm, borderRadius: radius.pill, paddingVertical: space.xs + 2, paddingLeft: space.sm, paddingRight: space.md },
}));
