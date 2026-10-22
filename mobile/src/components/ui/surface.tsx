import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { color, radius, space } from '@/core/design/tokens';
import { formatRupiah } from '@/core/format/money';
import type { MoneyString } from '@/domain/types';
import { Txt } from './txt';
import { Icon } from './icon';

/** Lembar nota: permukaan putih bergaris rambut. Satu tingkat — tidak ada lembar di dalam lembar. */
export function Sheet({ children, style, padded = true }: { children: React.ReactNode; style?: ViewStyle; padded?: boolean }) {
  return <View style={[styles.sheet, padded && styles.padded, style]}>{children}</View>;
}

/** Nomor dokumen bergaya nomor seri merah pada nota rangkap. Data, maka monospace. */
export function Serial({ children, accessibilityLabel }: { children: string; accessibilityLabel?: string }) {
  return (
    <Txt variant="serial" tone="serial" accessibilityLabel={accessibilityLabel ?? `Nomor ${children}`}>
      {children}
    </Txt>
  );
}

/**
 * Nominal rupiah sejajar kanan dengan angka tabular. `null` ditulis "—" dan diberi keterangan,
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
  size?: 'sm' | 'md' | 'lg';
  tone?: 'ink' | 'inkSecondary' | 'okInk' | 'dangerInk' | 'warnInk' | 'onNavy';
  align?: 'left' | 'right';
  missingLabel?: string;
  strike?: boolean;
}) {
  const text = formatRupiah(value);
  if (value === null) {
    return (
      <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }} accessible accessibilityLabel={`Nilai ${missingLabel}`}>
        <Txt variant={size === 'lg' ? 'figureLg' : 'figure'} tone="inkSecondary">—</Txt>
        <Txt variant="caption" tone="warnInk">{missingLabel}</Txt>
      </View>
    );
  }
  return (
    <Txt variant={size === 'lg' ? 'figureLg' : size === 'sm' ? 'bodySm' : 'figure'} tone={tone} align={align} tabular strike={strike}>
      {text}
    </Txt>
  );
}

/** Baris dokumen: label kiri, nilai kanan; dipakai untuk item invoice, ledger, rincian biaya. */
export function LineItem({ label, value, hint, emphasis, children }: { label: string; value?: React.ReactNode; hint?: string; emphasis?: boolean; children?: React.ReactNode }) {
  return (
    <View style={styles.line}>
      <View style={styles.lineLabel}>
        <Txt variant={emphasis ? 'bodyStrong' : 'body'}>{label}</Txt>
        {hint ? <Txt variant="caption" tone="inkSecondary">{hint}</Txt> : null}
      </View>
      <View style={styles.lineValue}>{value ?? children}</View>
    </View>
  );
}

/** Sel nota: label kecil-kapital di atas nilai, dibatasi garis sel. */
export function Cell({ label, children, onPress, accessibilityLabel, wide }: { label: string; children: React.ReactNode; onPress?: () => void; accessibilityLabel?: string; wide?: boolean }) {
  const content = (
    <>
      <Txt variant="label" tone="inkSecondary" numberOfLines={2}>{label}</Txt>
      <View style={{ marginTop: space.xs }}>{children}</View>
    </>
  );
  if (!onPress) return <View style={[styles.cell, wide && styles.cellWide]}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.cell, wide && styles.cellWide, pressed && { backgroundColor: color.carbonTint }]}
    >
      {content}
      <View style={styles.cellChevron}>
        <Icon name="chevron-right" size={16} tone="inkSecondary" />
      </View>
    </Pressable>
  );
}

/** Grid sel 2 kolom yang menyusun ulang menjadi 1 kolom bila teks diperbesar (lihat useCompact). */
export function CellGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 }) {
  return <View style={[styles.grid, columns === 1 && { flexDirection: 'column' }]}>{children}</View>;
}

export function Rule({ strong }: { strong?: boolean }) {
  return <View style={{ height: StyleSheet.hairlineWidth * (strong ? 2 : 1) + (strong ? 0.5 : 0), backgroundColor: strong ? color.ruleStrong : color.rule }} />;
}

export function SectionTitle({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle} accessibilityRole="header">
      <Txt variant="titleSm" style={{ flexShrink: 1 }}>
        {title}
        {count !== undefined ? <Txt variant="titleSm" tone="inkSecondary">{`  ${count}`}</Txt> : null}
      </Txt>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: color.sheet,
    borderRadius: radius.sheet,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.rule,
  },
  padded: { padding: space.lg },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.sm },
  lineLabel: { flex: 1 },
  lineValue: { alignItems: 'flex-end', maxWidth: '55%' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.rule,
    backgroundColor: color.sheet,
    borderRadius: radius.cell,
    overflow: 'hidden',
  },
  cell: {
    flexGrow: 1,
    flexBasis: '50%',
    minHeight: 72,
    padding: space.md,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.rule,
  },
  cellWide: { flexBasis: '100%' },
  cellChevron: { position: 'absolute', right: space.sm, top: space.md },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xxl,
    marginBottom: space.sm,
    gap: space.sm,
  },
});
