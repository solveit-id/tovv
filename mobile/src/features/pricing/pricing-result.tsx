import React from 'react';
import { View } from 'react-native';
import { radius, space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { LineItem, Money, Rule } from '@/components/ui/surface';
import type { PricingResult } from '@/domain/pricing';
import { formatBps, formatRupiah } from '@/core/format/money';

const LOOK = {
  incomplete: { icon: 'help-circle-outline', tone: 'warnInk' as const, wash: 'warnWash' as const, title: 'Biaya belum lengkap', body: 'Kontribusi dan surplus tidak dihitung. Biaya yang kosong bukan nol; jangan sebut pasti untung.' },
  loss: { icon: 'trending-down', tone: 'dangerInk' as const, wash: 'dangerWash' as const, title: 'Rugi pada estimasi ini', body: 'Surplus negatif setelah alokasi dan cadangan.' },
  below_target: { icon: 'arrow-down-bold-circle-outline', tone: 'warnInk' as const, wash: 'warnWash' as const, title: 'Di bawah harga target', body: 'Butuh alasan. Delegasi admin hanya sampai batasnya; selebihnya owner.' },
  meets_target: { icon: 'check-circle-outline', tone: 'okInk' as const, wash: 'okWash' as const, title: 'Memenuhi harga target', body: 'Surplus estimasi bukan laba bersih dan tidak dijamin.' },
};

/** Hasil kalkulasi harga (QTE-02/03) dengan label kepastian yang jujur. */
export function PricingResultView({ r, price }: { r: PricingResult; price: number }) {
  const color = useColors();
  const styles = useStyles();
  const look = LOOK[r.certainty];
  return (
    <View>
      <View style={[styles.verdict, { backgroundColor: color[look.wash] }]} accessibilityRole="text" accessibilityLiveRegion="polite">
        <Icon name={look.icon} size={22} tone={look.tone} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong" tone={look.tone}>{look.title}</Txt>
          <Txt variant="bodySm">{look.body}</Txt>
        </View>
      </View>
      <LineItem label="Harga ke pelanggan (P)" value={<Money value={price} />} />
      <LineItem label="Biaya layanan Tovv & penanganan (F)" value={<Money value={r.fee} />} />
      <LineItem label="Kontribusi = P − D − F" value={<Money value={r.contribution} missingLabel="butuh D" />} />
      <LineItem label="Surplus estimasi" hint={r.marginBps !== null ? `margin ${formatBps(r.marginBps)} · markup ${formatBps(r.markupBps)}` : undefined} value={<Money value={r.surplus} missingLabel="butuh D" />} />
      <Rule />
      <LineItem label="Harga target" emphasis hint={r.gapToTarget !== null ? (r.gapToTarget < 0 ? `kurang ${formatRupiah(-r.gapToTarget)} dari target` : `di atas target ${formatRupiah(r.gapToTarget)}`) : undefined} value={<Money value={r.targetPrice} missingLabel="butuh D" />} />
    </View>
  );
}

const useStyles = makeStyles((color) => ({
  verdict: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.lg, marginBottom: space.md },
}));
