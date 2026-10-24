import React from 'react';
import { View } from 'react-native';
import { radius, space, cardChrome, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ServiceArt } from '@/components/brand/service-art';
import type { ServicePackageDTO } from '@/data/api/contract';
import { formatRupiah } from '@/core/format/money';
import { t, tr } from '@/core/i18n';

export const SPEED_LABEL = { fastest: 'Paling cepat', fast: 'Cepat sampai', slower: 'Waktu tempuh lebih lama' } as const;
export const COST_LABEL = { saver: 'Lebih hemat', standard: 'Harga standar', premium: 'Premium' } as const;

/** Sorotan satu kata untuk paket yang paling menonjol di salah satu sisi. */
export function highlightOf(p: ServicePackageDTO): { label: string; icon: string; ink: ColorToken; wash: ColorToken } | null {
  if (p.kind === 'car_towing') return { label: 'Paling cepat', icon: 'lightning-bolt', ink: 'accentInk', wash: 'accentSoft' };
  if (p.kind === 'car_carrier') return { label: 'Hemat untuk banyak mobil', icon: 'piggy-bank-outline', ink: 'okInk', wash: 'okWash' };
  return null;
}

/** Kartu ringkas 2 kolom untuk beranda: gambar, nama, harga mulai. */
export function ServiceTile({ p, onPress }: { p: ServicePackageDTO; onPress: () => void }) {
  const s = useStyles();
  const c = useColors();
  const hl = highlightOf(p);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('{0}. {1}. Mulai dari {2}, harga contoh.', [p.name, tr(p.tagline), formatRupiah(p.startFrom)])}
      style={s.tile}
    >
      <View style={s.tileArt} pointerEvents="none">
        <ServiceArt kind={p.kind} width={132} />
      </View>
      {hl ? (
        <View style={[s.badge, { backgroundColor: c[hl.wash] }]}>
          <Txt variant="caption" tone={hl.ink} bold maxFontSizeMultiplier={1.2} numberOfLines={1}>{hl.label}</Txt>
        </View>
      ) : null}
      <Txt variant="bodyStrong" numberOfLines={2}>{p.name}</Txt>
      <Txt variant="caption" tone="inkSecondary" numberOfLines={2} style={s.tileTag}>{p.tagline}</Txt>
      <Txt variant="caption" tone="accentInk" bold>{t('Mulai {0}', [formatRupiah(p.startFrom)])}</Txt>
    </PressableScale>
  );
}

/** Kartu lengkap di layar paket layanan. */
export function ServiceCard({ p, onOrder, orderLabel }: { p: ServicePackageDTO; onOrder: () => void; orderLabel: string }) {
  const s = useStyles();
  const hl = highlightOf(p);
  const traits = [
    { icon: p.speed === 'slower' ? 'timer-sand' : 'clock-fast', label: SPEED_LABEL[p.speed] },
    { icon: p.cost === 'saver' ? 'tag-outline' : 'cash', label: COST_LABEL[p.cost] },
    { icon: p.vehicleClass === 'motorcycle' ? 'motorbike' : 'car-multiple', label: p.capacity },
  ];
  return (
    <View style={s.card}>
      <View style={s.art} pointerEvents="none">
        <ServiceArt kind={p.kind} width={260} />
        {hl ? (
          <View style={[s.badge, s.badgeArt]}>
            <Icon name={hl.icon} size={14} tone={hl.ink} />
            <Txt variant="caption" tone={hl.ink} bold maxFontSizeMultiplier={1.2}>{hl.label}</Txt>
          </View>
        ) : null}
      </View>
      <View style={s.body}>
        <View style={{ gap: 2 }}>
          <Txt variant="headline">{p.name}</Txt>
          <Txt variant="bodySm" tone="inkSecondary">{p.tagline}</Txt>
        </View>
        <View style={s.price}>
          <Txt variant="caption" tone="inkSecondary">Mulai dari</Txt>
          <View style={s.priceRow}>
            <Txt variant="figureLg" tabular>{formatRupiah(p.startFrom)}</Txt>
            <Txt variant="bodySm" tone="inkSecondary">{p.priceUnit}</Txt>
          </View>
          <View style={s.demo}>
            <Txt variant="caption" tone="demoInk" bold maxFontSizeMultiplier={1.2}>Harga contoh (DEMO)</Txt>
          </View>
        </View>
        <View style={s.traits}>
          {traits.map((tr0) => (
            <View key={tr0.label} style={s.trait}>
              <Icon name={tr0.icon} size={16} tone="accentInk" />
              <Txt variant="bodySm" bold style={{ flex: 1 }}>{tr0.label}</Txt>
            </View>
          ))}
        </View>
        <Txt variant="bodySm">{p.description}</Txt>
        <View style={{ gap: 6 }}>
          <Txt variant="label" tone="inkSecondary">Cocok untuk</Txt>
          {p.bestFor.map((b) => (
            <View key={b} style={s.bullet}>
              <Icon name="check-circle" size={16} tone="okInk" />
              <Txt variant="bodySm" style={{ flex: 1 }}>{b}</Txt>
            </View>
          ))}
        </View>
        <Button label={orderLabel} icon="arrow-right" onPress={onOrder} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  tile: { flexBasis: '47%', flexGrow: 1, padding: space.md, gap: 2, borderRadius: radius.xl, backgroundColor: c.surface, overflow: 'hidden', ...cardChrome(c, scheme, 1) },
  tileArt: { height: 64, alignItems: 'flex-start', justifyContent: 'flex-end', marginBottom: space.xs, marginLeft: -6 },
  tileTag: { minHeight: 32 },
  badge: { position: 'absolute', top: space.sm, right: space.sm, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: c.accentSoft },
  badgeArt: { top: space.md, right: space.md, backgroundColor: c.surface },
  card: { borderRadius: radius.xl, backgroundColor: c.surface, overflow: 'hidden', marginBottom: space.lg, ...cardChrome(c, scheme, 1) },
  art: { height: 150, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: space.sm, backgroundColor: c.surfaceAlt },
  body: { padding: space.lg, gap: space.md },
  price: { gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  demo: { alignSelf: 'flex-start', marginTop: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: c.demoWash },
  // Ciri paket ditumpuk ke bawah: tetap terbaca utuh di layar 360 dp dan teks diperbesar.
  traits: { gap: space.xs, padding: space.sm, borderRadius: radius.md, backgroundColor: c.accentSoft },
  trait: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 2 },
  bullet: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
}));
