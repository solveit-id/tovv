import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color, radius, space } from '@/core/design/tokens';
import type { StatusLook, Tone } from '@/core/i18n/status';
import { Txt } from './txt';
import { Icon } from './icon';

const TONE: Record<Tone, { ink: 'okInk' | 'warnInk' | 'dangerInk' | 'carbon' | 'neutralInk'; wash: string; border: string }> = {
  ok: { ink: 'okInk', wash: color.okWash, border: color.okInk },
  warn: { ink: 'warnInk', wash: color.warnWash, border: color.warnInk },
  danger: { ink: 'dangerInk', wash: color.dangerWash, border: color.dangerInk },
  info: { ink: 'carbon', wash: color.carbonTint, border: color.carbon },
  neutral: { ink: 'neutralInk', wash: color.neutralWash, border: color.neutralInk },
};

/**
 * Status dibawa oleh teks + ikon + bentuk garis: utuh = final, putus-putus = menunggu/provisional,
 * coret = batal. Warna hanya penguat (NFR-11).
 */
export function StatusTag({ look, size = 'md', label }: { look: StatusLook; size?: 'sm' | 'md'; label?: string }) {
  const t = TONE[look.tone];
  const text = label ?? look.label;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status: ${text}${look.line === 'dashed' ? ', belum final' : look.line === 'struck' ? ', tidak berlaku' : ''}`}
      style={[
        styles.tag,
        size === 'sm' && styles.sm,
        { backgroundColor: t.wash, borderColor: t.border, borderStyle: look.line === 'dashed' ? 'dashed' : 'solid' },
      ]}
    >
      <Icon name={look.icon} size={size === 'sm' ? 14 : 16} tone={t.ink} />
      <Txt variant={size === 'sm' ? 'caption' : 'bodySm'} tone={t.ink} strike={look.line === 'struck'} style={styles.text} numberOfLines={2}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    borderWidth: 1.25,
    borderRadius: radius.cell,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontWeight: '600', flexShrink: 1 },
});
