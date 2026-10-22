import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { radius, space, cardChrome, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useTheme } from '@/core/design/theme';
import { useEnter } from '@/core/design/motion';
import { formatRupiah } from '@/core/format/money';
import type { MoneyString } from '@/domain/types';
import { PressableScale } from './pressable-scale';
import { Txt } from './txt';
import { Icon } from './icon';

/**
 * Kartu: permukaan membulat 16 dengan bayangan lembut (terang) atau garis tipis (gelap).
 * Satu tingkat — tidak ada kartu di dalam kartu. `onPress` membuatnya dapat ditekan dengan tekan 3D;
 * `enterIndex` memberi animasi masuk bertahap.
 */
export function Card({ children, style, padded = true, onPress, accessibilityLabel, accessibilityHint, enterIndex, tone }: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  enterIndex?: number;
  /** Wash status untuk kartu peringatan/info. */
  tone?: 'warn' | 'danger' | 'ok' | 'info';
}) {
  const s = useStyles();
  const entering = useEnter(enterIndex ?? 99);
  const toneStyle = tone ? s[tone] : null;
  const body = onPress ? (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} style={[s.card, padded && s.padded, toneStyle, style]}>
      {children}
    </PressableScale>
  ) : (
    <View style={[s.card, padded && s.padded, toneStyle, style]}>{children}</View>
  );
  return enterIndex !== undefined && entering ? <Animated.View entering={entering}>{body}</Animated.View> : body;
}

/** Nomor dokumen (INV-…, Q-…): teks monospace sekunder; data, bukan dekorasi. */
export function Serial({ children, accessibilityLabel }: { children: string; accessibilityLabel?: string }) {
  return (
    <Txt variant="mono" tone="inkSecondary" accessibilityLabel={accessibilityLabel ?? `Nomor ${children}`}>
      {children}
    </Txt>
  );
}

/**
 * Nominal rupiah dengan angka tabular. `null` ditulis "—" dan diberi keterangan,
 * karena nilai yang belum diketahui bukan nol.
 */
export function Money({
  value,
  size = 'md',
  tone = 'ink',
  align = 'right',
  missingLabel = 'belum lengkap',
  strike,
}: {
  value: MoneyString | number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: ColorToken;
  align?: 'left' | 'right';
  missingLabel?: string;
  strike?: boolean;
}) {
  const variant = size === 'xl' ? 'figureXl' : size === 'lg' ? 'figureLg' : size === 'sm' ? 'bodyStrong' : 'figure';
  if (value === null) {
    return (
      <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }} accessible accessibilityLabel={`Nilai ${missingLabel}`}>
        <Txt variant={variant} tone="inkMuted">—</Txt>
        <Txt variant="caption" tone="warnInk">{missingLabel}</Txt>
      </View>
    );
  }
  return (
    <Txt variant={variant} tone={tone} align={align} tabular strike={strike}>
      {formatRupiah(value)}
    </Txt>
  );
}

/** Baris rincian: label kiri, nilai kanan; dipakai untuk item invoice, ledger, rincian biaya. */
export function LineItem({ label, value, hint, emphasis, children }: { label: string; value?: React.ReactNode; hint?: string; emphasis?: boolean; children?: React.ReactNode }) {
  const s = useStyles();
  return (
    <View style={s.line}>
      <View style={s.lineLabel}>
        <Txt variant={emphasis ? 'bodyStrong' : 'body'} tone={emphasis ? 'ink' : 'inkSecondary'}>{label}</Txt>
        {hint ? <Txt variant="caption" tone="inkSecondary">{hint}</Txt> : null}
      </View>
      <View style={s.lineValue}>{value ?? children}</View>
    </View>
  );
}

/** Kotak angka ringkas: label di atas nilai, di atas latar tonal. Dapat ditekan untuk membuka sumbernya. */
export function Cell({ label, children, onPress, accessibilityLabel, wide }: { label: string; children: React.ReactNode; onPress?: () => void; accessibilityLabel?: string; wide?: boolean }) {
  const s = useStyles();
  const content = (
    <>
      <View style={s.cellHead}>
        <Txt variant="label" tone="inkSecondary" numberOfLines={2} style={{ flex: 1 }}>{label}</Txt>
        {onPress ? <Icon name="chevron-right" size={18} tone="inkMuted" /> : null}
      </View>
      <View style={{ marginTop: space.xs, gap: 2 }}>{children}</View>
    </>
  );
  if (!onPress) return <View style={[s.cell, wide && s.cellWide]}>{content}</View>;
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} style={[s.cell, wide && s.cellWide]}>
      {content}
    </PressableScale>
  );
}

/** Grid kotak 2 kolom; menjadi 1 kolom bila diminta (mis. teks diperbesar). */
export function CellGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 }) {
  const s = useStyles();
  return <View style={[s.grid, columns === 1 && { flexDirection: 'column' }]}>{children}</View>;
}

export function Rule({ strong }: { strong?: boolean }) {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth * (strong ? 3 : 2), backgroundColor: strong ? c.lineStrong : c.line, marginVertical: strong ? space.xs : 0 }} />;
}

export function SectionTitle({ title, count, action, hint }: { title: string; count?: number; action?: React.ReactNode; hint?: string }) {
  const s = useStyles();
  return (
    <View style={s.sectionTitle}>
      <View style={{ flex: 1 }} accessibilityRole="header">
        <View style={s.titleRow}>
          <Txt variant="headline" style={{ flexShrink: 1 }}>{title}</Txt>
          {count !== undefined ? (
            <View style={s.count}>
              <Txt variant="caption" tone="accentInk" bold maxFontSizeMultiplier={1.3}>{String(count)}</Txt>
            </View>
          ) : null}
        </View>
        {hint ? <Txt variant="bodySm" tone="inkSecondary">{hint}</Txt> : null}
      </View>
      {action}
    </View>
  );
}

const useStyles = makeStyles((c, scheme) => {
  const chrome = cardChrome(c, scheme);
  return {
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      ...chrome,
    },
    padded: { padding: space.lg },
    warn: { backgroundColor: c.warnWash, borderColor: c.warnWash, boxShadow: 'none' },
    danger: { backgroundColor: c.dangerWash, borderColor: c.dangerWash, boxShadow: 'none' },
    ok: { backgroundColor: c.okWash, borderColor: c.okWash, boxShadow: 'none' },
    info: { backgroundColor: c.accentSoft, borderColor: c.accentSoft, boxShadow: 'none' },
    line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm },
    lineLabel: { flex: 1 },
    lineValue: { alignItems: 'flex-end', maxWidth: '55%' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    cell: {
      flexGrow: 1,
      flexBasis: '45%',
      minHeight: 84,
      padding: space.md,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      ...chrome,
    },
    cellWide: { flexBasis: '100%' },
    cellHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: space.xxl + space.xs,
      marginBottom: space.md,
      gap: space.sm,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    count: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  };
});
