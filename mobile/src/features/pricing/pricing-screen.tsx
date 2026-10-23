import React, { useState } from 'react';
import { View } from 'react-native';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Field, MoneyField } from '@/components/ui/form';
import { SectionTitle, Card } from '@/components/ui/surface';
import { evaluatePrice, F01, F02 } from '@/domain/pricing';
import { PricingResultView } from './pricing-result';

/**
 * Simulasi negosiasi (QTE-01–03) terisolasi dari transaksi F-09. Menjelaskan batas harga, bukan menjamin laba.
 * Uang integer rupiah; persen basis point.
 */
export function PricingScreen() {
  const [price, setPrice] = useState<number | null>(F01.price);
  const [direct, setDirect] = useState<number | null>(F01.direct);
  const [alloc, setAlloc] = useState<number | null>(F01.allocation);
  const [reserve, setReserve] = useState<number | null>(F01.reserve);
  const [fee, setFee] = useState<number | null>(F01.feePerService);
  const [admin, setAdmin] = useState<number | null>(F01.adminHandling);
  const [target, setTarget] = useState<number | null>(F01.targetSurplus);
  const [pct, setPct] = useState('0');
  const bps = Math.round(Number(pct.replace(',', '.') || '0') * 100);
  const validPct = Number.isFinite(bps) && bps >= 0 && bps < 10_000;
  const r = validPct
    ? evaluatePrice({ price: price ?? 0, direct, allocation: alloc ?? 0, reserve: reserve ?? 0, feePerService: fee ?? 0, adminHandling: admin ?? 0, targetSurplus: target ?? 0, percentFeeBps: bps })
    : null;

  const load = (which: 'F01' | 'F02') => {
    const f = which === 'F01' ? F01 : { ...F02, price: 3_242_425 };
    setPrice(f.price);
    setDirect(f.direct);
    setAlloc(f.allocation);
    setReserve(f.reserve);
    setFee(f.feePerService);
    setAdmin(f.adminHandling);
    setTarget(f.targetSurplus);
    setPct(which === 'F01' ? '0' : '1');
  };

  return (
    <Screen header={<DetailHeader title="Hitung harga" subtitle="Simulasi negosiasi · tidak membuat penawaran" />}>
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
        <Button label="Contoh 1: nominal" variant="secondary" compact style={{ flex: 1 }} onPress={() => load('F01')} />
        <Button label="Contoh 2: persentase" variant="secondary" compact style={{ flex: 1 }} onPress={() => load('F02')} />
      </View>
      <MoneyField label="Harga ke pelanggan (P)" value={price} onChange={setPrice} />
      <MoneyField label="Biaya langsung (D)" value={direct} onChange={setDirect} helper="Jalan ke lokasi, muat, pindah posisi, BBM, tol, kru, atau harga mitra. Kosongkan kalau belum tahu." />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}><MoneyField label="Alokasi tetap (A)" value={alloc} onChange={setAlloc} /></View>
        <View style={{ flex: 1 }}><MoneyField label="Cadangan (R)" value={reserve} onChange={setReserve} /></View>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}><MoneyField label="Biaya layanan Tovv per pekerjaan" value={fee} onChange={setFee} /></View>
        <View style={{ flex: 1 }}><MoneyField label="Penanganan internal" value={admin} onChange={setAdmin} helper="Contoh saja, bukan biaya gateway" /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}><MoneyField label="Target surplus (T)" value={target} onChange={setTarget} /></View>
        <View style={{ flex: 1 }}><Field label="Biaya komersial % dari P" value={pct} onChangeText={setPct} keyboardType="decimal-pad" suffix="%" error={validPct ? null : 'Harus 0 sampai di bawah 100%'} /></View>
      </View>
      <SectionTitle title="Hasil" />
      <Card>{r ? <PricingResultView r={r} price={price ?? 0} /> : <Txt variant="bodySm" tone="dangerInk">Persentasenya tidak valid.</Txt>}</Card>
      <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.md }}>
        Kontribusi = P − D − F; surplus = kontribusi − A − R. Harga target dengan persen = ceil((D+A+R+f+T)/(1−r)), lalu dihitung ulang. Override harga tidak meloloskan unit yang tidak layak.
      </Txt>
    </Screen>
  );
}
