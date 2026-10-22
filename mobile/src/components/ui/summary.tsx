import React, { useEffect } from 'react';
import { TextInput, View, type TextStyle } from 'react-native';
import Animated, { FadeInUp, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { radius, space, cardChrome, duration, type, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { formatRupiah, parseMoneyString } from '@/core/format/money';
import type { MoneyString } from '@/domain/types';
import { PressableScale } from './pressable-scale';
import { Txt, type TxtProps } from './txt';
import { Icon, IconTile } from './icon';

const ATextInput = Animated.createAnimatedComponent(TextInput);

/** Format rupiah di UI thread (titik ribuan), sama dengan formatRupiah untuk bilangan bulat. */
function rupiahWorklet(n: number): string {
  'worklet';
  const neg = n < 0;
  const digits = Math.round(Math.abs(n)).toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  return `${neg ? '−' : ''}Rp ${out}`;
}

/**
 * Nominal yang menghitung naik sekali saat pertama tampil (700 ms, ease-out), lalu diam.
 * Dihitung di UI thread lewat Reanimated: tidak ada render ulang React per frame.
 * Nilai null tetap "—" (bukan nol). "Kurangi gerakan" = langsung nilai akhir.
 */
export function CountUpMoney({ value, variant = 'figureXl', tone = 'ink', missingLabel = 'belum lengkap' }: { value: MoneyString | number | null; variant?: TxtProps['variant']; tone?: ColorToken; missingLabel?: string }) {
  const c = useColors();
  const reduced = useReducedMotion();
  const target = value === null ? null : typeof value === 'number' ? value : parseMoneyString(value);
  const v = useSharedValue(reduced ? (target ?? 0) : 0);
  useEffect(() => {
    if (target === null) return;
    v.value = reduced ? target : withTiming(target, { duration: duration.count, easing: easeOut });
  }, [target, reduced, v]);
  const animatedProps = useAnimatedProps(() => ({ text: rupiahWorklet(v.value), defaultValue: rupiahWorklet(v.value) }) as never);
  if (target === null) {
    return (
      <View accessible accessibilityLabel={`Nilai ${missingLabel}`}>
        <Txt variant={variant} tone="inkMuted">—</Txt>
        <Txt variant="caption" tone="warnInk">{missingLabel}</Txt>
      </View>
    );
  }
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={formatRupiah(target)}>
      <ATextInput
        editable={false}
        underlineColorAndroid="transparent"
        importantForAccessibility="no-hide-descendants"
        defaultValue={formatRupiah(reduced ? target : 0)}
        animatedProps={animatedProps}
        style={[type[variant] as TextStyle, { color: c[tone], padding: 0, margin: 0 }]}
      />
    </View>
  );
}

/** Kartu ringkasan yang menimpa tepi bawah header gradien (gaya kartu saldo super-app). */
export function HeroCard({ children, onPress, accessibilityLabel }: { children: React.ReactNode; onPress?: () => void; accessibilityLabel?: string }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const inner = onPress ? (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={s.hero}>
      {children}
    </PressableScale>
  ) : (
    <View style={s.hero}>{children}</View>
  );
  return <Animated.View entering={reduced ? undefined : FadeInUp.duration(duration.slow).easing(easeOut)} style={s.heroWrap}>{inner}</Animated.View>;
}

/** Baris sub-angka di dalam HeroCard: label kecil + nilai, dipisah garis tipis. */
export function HeroStats({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  const s = useStyles();
  return (
    <View style={s.stats}>
      {items.map((it, i) => (
        <View key={it.label} style={[s.stat, i > 0 && s.statDivider]}>
          <Txt variant="caption" tone="inkSecondary" numberOfLines={2}>{it.label}</Txt>
          {it.value}
        </View>
      ))}
    </View>
  );
}

export interface Shortcut {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
  tone?: ColorToken;
  wash?: ColorToken;
  badge?: number;
}

/** Grid pintasan 4 kolom: tile ikon membulat + label di bawahnya. */
export function ShortcutGrid({ items }: { items: Shortcut[] }) {
  const s = useStyles();
  return (
    <View style={s.grid}>
      {items.map((it) => (
        <PressableScale key={it.key} depth="subtle" onPress={it.onPress} accessibilityRole="button" accessibilityLabel={it.badge ? `${it.label}, ${it.badge}` : it.label} style={s.shortcut}>
          <View>
            <IconTile name={it.icon} size={52} tone={it.tone ?? 'accentInk'} wash={it.wash ?? 'accentSoft'} />
            {it.badge ? (
              <View style={s.badge}>
                <Txt variant="caption" tone="onAccent" style={{ fontSize: 10, lineHeight: 12, fontWeight: '800' }} maxFontSizeMultiplier={1.2}>{it.badge > 9 ? '9+' : String(it.badge)}</Txt>
              </View>
            ) : null}
          </View>
          <Txt variant="caption" align="center" numberOfLines={2} style={{ fontWeight: '600' }}>{it.label}</Txt>
        </PressableScale>
      ))}
    </View>
  );
}

/** Kartu ringkas satu baris dengan ikon, judul, keterangan dan chevron (mis. menu, pintasan detail). */
export function ListRow({ icon, title, body, onPress, right, tone = 'accentInk', wash = 'accentSoft', last }: { icon: string; title: string; body?: string; onPress?: () => void; right?: React.ReactNode; tone?: ColorToken; wash?: ColorToken; last?: boolean }) {
  const s = useStyles();
  const content = (
    <>
      <IconTile name={icon} size={40} tone={tone} wash={wash} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={2}>{title}</Txt>
        {body ? <Txt variant="caption" tone="inkSecondary" numberOfLines={3}>{body}</Txt> : null}
      </View>
      {right}
      {onPress ? <Icon name="chevron-right" size={20} tone="inkMuted" /> : null}
    </>
  );
  if (!onPress) return <View style={[s.listRow, !last && s.listDivider]}>{content}</View>;
  return (
    <PressableScale depth="subtle" onPress={onPress} accessibilityRole="button" accessibilityLabel={body ? `${title}. ${body}` : title} style={[s.listRow, !last && s.listDivider]}>
      {content}
    </PressableScale>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  heroWrap: { marginTop: -72, marginBottom: space.xs },
  hero: { backgroundColor: c.surface, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...cardChrome(c, scheme, 2) },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.md },
  stat: { flex: 1, gap: 2, paddingRight: space.sm },
  statDivider: { borderLeftWidth: 1, borderLeftColor: c.line, paddingLeft: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.lg, rowGap: space.md },
  shortcut: { width: '25%', alignItems: 'center', gap: space.xs + 2, paddingHorizontal: 2 },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: c.badge, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.bg },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, minHeight: 64 },
  listDivider: { borderBottomWidth: 1, borderBottomColor: c.line },
}));
