import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '@/core/hooks/use-safe-back';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Choice, Field, MoneyField, Toggle } from '@/components/ui/form';
import { Money, SectionTitle, Card } from '@/components/ui/surface';
import { QueryView } from '@/components/ui/states';
import { useApi } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import type { UnitCandidate } from '@/data/api/contract';
import { evaluatePrice } from '@/domain/pricing';
import { parseMoneyString, formatRupiah, formatNumber } from '@/core/format/money';
import { addMinutes, formatDateTime, timePresets } from '@/core/format/time';
import { PricingResultView } from '@/features/pricing/pricing-result';
import { t } from '@/core/i18n';

function UnitOption({ c, on, onPress }: { c: UnitCandidate; on: boolean; onPress: () => void }) {
  const styles = useStyles();
  const selectable = c.eligible && !c.conflict;
  return (
    <Pressable
      onPress={onPress}
      disabled={!selectable}
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled: !selectable }}
      accessibilityLabel={t('Unit {0}. {1}', [c.code, c.reason])}
      style={({ pressed }) => [styles.unit, on && styles.unitOn, !selectable && styles.unitOff, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.unitHead}>
        <Icon name={!c.eligible ? 'close-octagon-outline' : c.conflict ? 'calendar-alert' : on ? 'radiobox-marked' : 'radiobox-blank'} tone={!c.eligible ? 'dangerInk' : c.conflict ? 'warnInk' : on ? 'accentInk' : 'inkSecondary'} />
        <Txt variant="bodyStrong" style={{ flex: 1 }} strike={!c.eligible}>{`${c.code} · ${c.label}${c.ownership === 'partner' ? t(' (mitra {0})', [c.partnerName]) : ''}`}</Txt>
        {c.rank ? (
          <View style={[styles.rank, c.rank === 1 && styles.rankTop]}>
            <Txt variant="caption" tone={c.rank === 1 ? 'okInk' : 'inkSecondary'} bold>{c.rank === 1 ? 'Rekomendasi' : t('Pilihan {0}', [c.rank])}</Txt>
          </View>
        ) : null}
      </View>
      <Txt variant="bodySm" tone={!c.eligible ? 'dangerInk' : c.conflict ? 'warnInk' : 'ink'}>{c.reason}</Txt>
      <Txt variant="caption" tone="inkSecondary">
        {t('Kapasitas {0} kg · dek {1} · {2} · posisi {3}{4}', [formatNumber(c.capacityKg), c.deck.replace(/\d{4,}/g, (n) => formatNumber(Number(n))), c.distanceKm !== null ? `${String(c.distanceKm).replace('.', ',')} km garis lurus` : 'jarak tidak diketahui', c.positionAge, c.positionFreshness === 'stale' ? ' (lama)' : ''])}
      </Txt>
      {c.estimatedDirect && !c.reason.includes(formatRupiah(c.estimatedDirect)) ? <Txt variant="caption" tone="inkSecondary">{t('Estimasi biaya langsung {0}', [formatRupiah(c.estimatedDirect)])}</Txt> : null}
    </Pressable>
  );
}

/**
 * Susun penawaran: jadwal → unit layak (filter keras lebih dulu, alasan terlihat) → harga dan biaya → kirim versi baru.
 * Penawaran tidak menahan slot; reservasi baru terjadi saat disetujui.
 */
export function QuoteBuilderScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBack = useSafeBack(`/request/${id}`);
  const api = useApi();
  const toast = useToast();
  const presets = useMemo(() => timePresets(api.now()), [api]);
  const [slot, setSlot] = useState('1');
  const start = presets[Number(slot)]!.start;
  const end = addMinutes(start, 150);
  const req = useTovvQuery(['request', id], (a) => a.getRequest(id));
  const session = useTovvQuery(['session'], (a) => a.getSession());
  const cands = useTovvQuery(['units', id, start], (a) => a.getUnitCandidates(id, start, end));
  const [unitId, setUnitId] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [direct, setDirect] = useState<number | null>(null);
  const [directTouched, setDirectTouched] = useState(false);
  const [alloc, setAlloc] = useState<number | null>(150_000);
  const [reserve, setReserve] = useState<number | null>(50_000);
  const [target, setTarget] = useState<number | null>(200_000);
  const [priority, setPriority] = useState(false);
  const [priorityFee, setPriorityFee] = useState<number | null>(250_000);
  const [reason, setReason] = useState('');
  const [valid, setValid] = useState('24');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selected = cands.data?.find((c) => c.unitId === unitId) ?? null;
  const dEff = directTouched ? direct : selected?.estimatedDirect ? parseMoneyString(selected.estimatedDirect) : null;
  const rate = req.data?.rate.amount ? parseMoneyString(req.data.rate.amount) : null;
  const pEff = price ?? rate ?? 0;
  const tenantFee = session.data?.tenantId === 'tenant-b' ? 10_000 : 0;
  const result = evaluatePrice({ price: pEff + (priority ? priorityFee ?? 0 : 0), direct: dEff, allocation: alloc ?? 0, reserve: reserve ?? 0, feePerService: tenantFee, adminHandling: 0, targetSurplus: target ?? 0 });
  const below = result.gapToTarget !== null && result.gapToTarget < 0;

  const send = async () => {
    if (!unitId) {
      setErr(t('Pilih unit yang layak.'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const q = await api.sendQuote({
        requestId: id,
        unitId,
        scheduleStart: start,
        scheduleEnd: end,
        price: pEff,
        direct: dEff,
        allocation: alloc ?? 0,
        reserve: reserve ?? 0,
        targetSurplus: target ?? 0,
        priority: priority ? { fee: priorityFee ?? 0, commitment: t('Mobilisasi unit untuk jadwal {0}', [formatDateTime(start)]), failureTerms: 'Tarif prioritas tidak ditagih bila unit tiba lewat dari jendela yang disepakati (demo).' } : null,
        belowTargetReason: below ? reason : null,
        validHours: Number(valid) || 24,
      });
      toast.show(q.version > 1 ? t('Penawaran v{0} terkirim. Versi sebelumnya otomatis tidak berlaku.', [q.version]) : 'Penawaran v1 terkirim ke pelanggan.', 'ok');
      goBack();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<DetailHeader serial={req.data ? t('Permintaan {0}', [req.data.alias]) : undefined} title="Susun penawaran" subtitle={req.data ? `${req.data.vehicleLabel} · ${req.data.pickupLabel} → ${req.data.dropoffLabel}` : undefined} />}
      footer={
        <>
          {err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}
          <Button label={t('Kirim penawaran {0}', [formatRupiah(pEff + (priority ? priorityFee ?? 0 : 0))])} icon="file-send-outline" size="lg" loading={busy} onPress={() => void send()} />
        </>
      }
    >
      {session.data?.delegation ? (
        <Card style={{ marginBottom: space.md }}>
          <Txt variant="bodySm">{t('Delegasi dari {0}: diskon sampai {1} di bawah target, berlaku sampai {2}.', [session.data.delegation.delegatorName, formatRupiah(session.data.delegation.limit), formatDateTime(session.data.delegation.expiresAt)])}</Txt>
        </Card>
      ) : null}
      <SectionTitle title="Jadwal" />
      <Choice label="Jadwal" hideLabel helper="Rentang ±2,5 jam plus jeda 30 menit." value={slot} onChange={(v) => { setSlot(v); setUnitId(null); }} options={presets.map((p, i) => ({ value: String(i), label: p.label }))} />

      <SectionTitle title="Unit" />
      <QueryView q={cands} skeleton="action" loadingLabel="Mengecek unit yang cocok…">
        {(list) => (
          <View style={{ gap: space.sm }}>
            {list.map((c) => <UnitOption key={c.unitId} c={c} on={unitId === c.unitId} onPress={() => { setUnitId(c.unitId); setErr(null); }} />)}
            <Txt variant="caption" tone="inkSecondary">Unit yang tidak cocok tidak bisa dipilih — harga atau keputusan owner tidak mengubah kapasitas.</Txt>
          </View>
        )}
      </QueryView>

      <SectionTitle title="Harga & biaya" />
      {req.data ? <Txt variant="caption" tone="inkSecondary" style={{ marginBottom: space.sm }}>{`${req.data.rate.note}${req.data.rate.amount ? ` · ${formatRupiah(req.data.rate.amount)}` : ''}`}</Txt> : null}
      <MoneyField label="Harga jasa" value={price ?? rate} onChange={(v) => { setPrice(v); setErr(null); }} />
      <MoneyField label="Biaya langsung (D)" value={dEff} onChange={(v) => { setDirectTouched(true); setDirect(v); }} helper={selected ? t('Dari perkiraan unit {0}; ubah kalau perlu. Kosong = belum tahu.', [selected.code]) : 'Pilih unit untuk melihat perkiraan.'} />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}><MoneyField label="Alokasi (A)" value={alloc} onChange={setAlloc} /></View>
        <View style={{ flex: 1 }}><MoneyField label="Cadangan (R)" value={reserve} onChange={setReserve} /></View>
        <View style={{ flex: 1 }}><MoneyField label="Target (T)" value={target} onChange={setTarget} /></View>
      </View>
      <Toggle label="Tarif prioritas" hint="Untuk mendahulukan jadwal, bukan janji mengebut di jalan." value={priority} onChange={setPriority} />
      {priority ? <MoneyField label="Biaya prioritas" value={priorityFee} onChange={setPriorityFee} /> : null}
      {below ? <Field label="Alasan harga di bawah target" value={reason} onChangeText={setReason} multiline /> : null}
      <Choice label="Masa berlaku" value={valid} onChange={setValid} options={[{ value: '4', label: '4 jam' }, { value: '24', label: '24 jam' }, { value: '48', label: '48 jam' }]} />
      <Card>
        <PricingResultView r={result} price={pEff + (priority ? priorityFee ?? 0 : 0)} />
      </Card>
      {selected ? (
        <View style={styles.sel}>
          <Txt variant="caption" tone="inkSecondary">Unit terpilih</Txt>
          <Txt variant="bodyStrong">{t('{0} · perkiraan D', [selected.code])}</Txt>
          <Money value={selected.estimatedDirect} align="left" />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((color) => ({
  unit: { borderWidth: 1.5, borderColor: color.line, borderRadius: radius.md, padding: space.md, gap: 4, backgroundColor: color.surface },
  unitOn: { borderColor: color.accent, backgroundColor: color.accentSoft },
  unitOff: { backgroundColor: color.surfaceAlt },
  unitHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  sel: { marginTop: space.md, gap: 2 },
  rank: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: color.surfaceAlt },
  rankTop: { backgroundColor: color.okWash },
}));
