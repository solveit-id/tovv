import React from 'react';
import { View } from 'react-native';
import { radius, space, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import type { StatusLook, Tone } from '@/core/i18n/status';
import { Txt } from './txt';
import { Icon } from './icon';

const TONE: Record<Tone, { ink: ColorToken; wash: ColorToken }> = {
  ok: { ink: 'okInk', wash: 'okWash' },
  warn: { ink: 'warnInk', wash: 'warnWash' },
  danger: { ink: 'dangerInk', wash: 'dangerWash' },
  info: { ink: 'accentInk', wash: 'accentSoft' },
  neutral: { ink: 'neutralInk', wash: 'neutralWash' },
};

/**
 * Chip status: teks + ikon + bentuk garis (utuh = final, putus-putus = menunggu/sementara,
 * coret = batal). Warna hanya penguat (NFR-11).
 */
export function StatusTag({ look, size = 'md', label }: { look: StatusLook; size?: 'sm' | 'md'; label?: string }) {
  const c = useColors();
  const s = useStyles();
  const t = TONE[look.tone];
  const text = label ?? look.label;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status: ${text}${look.line === 'dashed' ? ', belum final' : look.line === 'struck' ? ', tidak berlaku' : ''}`}
      style={[
        s.tag,
        size === 'sm' && s.sm,
        { backgroundColor: c[t.wash], borderColor: look.line === 'solid' ? c[t.wash] : c[t.ink], borderStyle: look.line === 'dashed' ? 'dashed' : 'solid' },
      ]}
    >
      <Icon name={look.icon} size={size === 'sm' ? 13 : 15} tone={t.ink} />
      <Txt variant={size === 'sm' ? 'caption' : 'bodySm'} tone={t.ink} strike={look.line === 'struck'} style={s.text} numberOfLines={2}>
        {text}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    borderWidth: 1.25,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontWeight: '600', flexShrink: 1 },
}));
