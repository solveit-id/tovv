import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Choice, Field, Toggle } from '@/components/ui/form';
import { SectionTitle, Card } from '@/components/ui/surface';
import { useApi, useSession } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { ApiError } from '@/data/api/contract';
import type { Channel, Place, TimingKind } from '@/domain/types';
import { addMinutes, timePresets } from '@/core/format/time';

/** Kunci idempotensi per layar formulir: kirim ulang (mis. setelah jaringan putus) tidak membuat request ganda. */
function newIdempotencyKey() {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const toNum = (s: string) => {
  const d = s.replace(/[^\d]/g, '');
  return d ? Number(d) : null;
};

/**
 * Permintaan baru (ORD-01–ORD-04). Admin mencatat dari telepon/chat (assisted, tanpa aplikasi pelanggan);
 * pelanggan membuat sendiri. Berat/dimensi kosong tidak ditebak: permintaan menjadi "perlu ditinjau".
 */
export function NewRequestScreen() {
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const session = useSession();
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const customers = useTovvQuery(['customers'], (a) => a.listCustomers(), { enabled: staff });
  const me = useTovvQuery(['session'], (a) => a.getSession());
  const places = useQuery({ queryKey: ['places'], queryFn: () => api.listPlaces() });
  const presets = useMemo(() => timePresets(api.now()), [api]);
  const [idem] = useState(newIdempotencyKey);

  const [channel, setChannel] = useState<Channel>(staff ? 'phone' : 'mobile');
  const [customerId, setCustomerId] = useState<string>('');
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [plate, setPlate] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [condition, setCondition] = useState('');
  const [pickupIdx, setPickupIdx] = useState('1');
  const [dropoffIdx, setDropoffIdx] = useState('3');
  const [timing, setTiming] = useState<TimingKind>('scheduled');
  const [startIdx, setStartIdx] = useState('1');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [payer, setPayer] = useState('');
  const [po, setPo] = useState('');
  const [consent, setConsent] = useState('');
  const [immediateOk, setImmediateOk] = useState(false);
  const [busy, setBusy] = useState<'send' | 'draft' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const cust = customers.data?.find((c) => c.userId === customerId);
  const ordererName = staff ? (cust?.name ?? '') : (me.data?.userName ?? '');
  const bizName = staff ? cust?.businessAccountName : me.data?.businessAccountName;
  const placeList = places.data ?? [];
  const placeOpts = placeList.map((p, i) => ({ value: String(i), label: p.label, hint: p.address }));

  const submit = async (asDraft: boolean) => {
    setErr(null);
    setFieldErr({});
    if (staff && !customerId) {
      setErr('Pilih pelanggan yang menghubungi.');
      return;
    }
    if (!vehicleLabel.trim() || !plate.trim()) {
      setErr('Isi jenis kendaraan dan nomor polisi.');
      return;
    }
    const pickup = placeList[Number(pickupIdx)] as Place;
    const dropoff = placeList[Number(dropoffIdx)] as Place;
    const start = presets[Number(startIdx)]!.start;
    setBusy(asDraft ? 'draft' : 'send');
    try {
      const r = await api.createRequest({
        channel,
        customerUserId: staff ? customerId : null,
        businessAccountId: staff ? (cust?.businessAccountId ?? null) : null,
        parties: { orderer: ordererName, sender: sender || ordererName, receiver: receiver || ordererName, payer: payer || bizName || ordererName },
        vehicle: { label: vehicleLabel, plate: plate.toUpperCase(), weightKg: toNum(weight), lengthMm: toNum(length), widthMm: toNum(width), condition: condition || 'Belum dijelaskan' },
        pickup,
        dropoff,
        timing: {
          kind: timing,
          start: timing === 'immediate' ? api.now() : start,
          end: timing === 'flexible' ? addMinutes(start, 240) : null,
          immediateConfirmed: timing === 'immediate' ? immediateOk : undefined,
        },
        poRef: po.trim() || null,
        consentNote: staff ? consent : null,
        asDraft,
        idempotencyKey: idem,
      });
      toast.show(r.status === 'needs_review' ? `${r.alias} tercatat; perlu ditinjau: ${r.needsReviewReasons.join(', ')}.` : asDraft ? `Draf ${r.alias} tersimpan.` : `${r.alias} tercatat dan siap ditawar.`, 'ok');
      router.replace(`/request/${r.id}`);
    } catch (e) {
      setErr(errorMessage(e));
      if (e instanceof ApiError) setFieldErr(e.fields);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen
      header={<DetailHeader title={staff ? 'Catat permintaan' : 'Minta derek'} subtitle={staff ? 'Pelanggan tidak perlu memasang aplikasi' : 'Operator meninjau sebelum memberi harga'} />}
      footer={
        <>
          {err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Simpan draf" variant="secondary" style={{ flex: 1 }} loading={busy === 'draft'} onPress={() => void submit(true)} />
            <Button label="Kirim" icon="send-outline" style={{ flex: 2 }} size="lg" loading={busy === 'send'} onPress={() => void submit(false)} />
          </View>
        </>
      }
    >
      {staff ? (
        <>
          <Choice label="Kanal" value={channel} onChange={setChannel} options={[{ value: 'phone', label: 'Telepon' }, { value: 'chat', label: 'Chat' }, { value: 'manual', label: 'Datang langsung / manual' }]} />
          <Choice
            label="Pelanggan"
            value={customerId}
            onChange={setCustomerId}
            options={(customers.data ?? []).map((c) => ({ value: c.userId, label: c.name, hint: c.businessAccountName ? `${c.businessAccountName} · ${c.roles.join(', ')}${c.poRequired ? ' · PO wajib' : ''}` : 'Pelanggan pribadi' }))}
          />
        </>
      ) : null}

      <SectionTitle title="Kendaraan" />
      <Field label="Jenis kendaraan" value={vehicleLabel} onChangeText={setVehicleLabel} placeholder="mis. SUV, sedan, pikap" />
      <Field label="Nomor polisi" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1 }}><Field label="Berat (kg)" value={weight} onChangeText={setWeight} keyboardType="number-pad" helper="Kosongkan bila tidak tahu" /></View>
        <View style={{ flex: 1 }}><Field label="Panjang (mm)" value={length} onChangeText={setLength} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field label="Lebar (mm)" value={width} onChangeText={setWidth} keyboardType="number-pad" /></View>
      </View>
      <Field label="Kondisi" value={condition} onChangeText={setCondition} multiline placeholder="mis. mogok, roda depan terkunci" />

      <SectionTitle title="Lokasi" />
      <Txt variant="caption" tone="inkSecondary" style={{ marginBottom: space.sm }}>Daftar titik sintetis untuk demo; peta dan pencarian alamat belum diaktifkan.</Txt>
      <Choice label="Jemput" value={pickupIdx} onChange={setPickupIdx} options={placeOpts} />
      <Choice label="Tujuan" value={dropoffIdx} onChange={setDropoffIdx} options={placeOpts} />
      {fieldErr.pickup ? <Txt variant="caption" tone="dangerInk">{fieldErr.pickup}</Txt> : null}

      <SectionTitle title="Waktu" />
      <Choice
        label="Jenis layanan"
        value={timing}
        onChange={setTiming}
        options={[
          { value: 'scheduled', label: 'Terjadwal' },
          { value: 'flexible', label: 'Fleksibel', hint: 'Rentang 4 jam sejak waktu mulai' },
          { value: 'immediate', label: 'Segera', hint: 'Perlu konfirmasi kemampuan unit oleh admin' },
        ]}
      />
      {timing !== 'immediate' ? <Choice label="Mulai" value={startIdx} onChange={setStartIdx} options={presets.map((p, i) => ({ value: String(i), label: p.label }))} /> : null}
      {timing === 'immediate' && staff ? <Toggle label="Unit dan petugas dikonfirmasi sanggup segera" value={immediateOk} onChange={setImmediateOk} /> : null}

      <SectionTitle title="Pihak" />
      <Card style={{ marginBottom: space.lg }}>
        <Txt variant="bodySm" tone="inkSecondary">{`Pemesan: ${ordererName || '—'}${bizName ? ` · ${bizName}` : ''}. Penerima bukan otomatis pembayar; isi bila berbeda.`}</Txt>
      </Card>
      <Field label="Yang menyerahkan kendaraan saat dijemput" value={sender} onChangeText={setSender} placeholder={ordererName} />
      <Field label="Penerima di tujuan" value={receiver} onChangeText={setReceiver} placeholder={ordererName} />
      <Field label="Pembayar" value={payer} onChangeText={setPayer} placeholder={bizName || ordererName} />
      {bizName ? <Field label="Nomor PO / referensi internal" value={po} onChangeText={setPo} helper={cust?.poRequired ? 'Wajib untuk akun ini sebelum konfirmasi.' : 'Opsional untuk akun ini.'} /> : null}
      {staff ? <Field label="Catatan persetujuan pemesan" value={consent} onChangeText={setConsent} multiline error={fieldErr.consent ? 'Wajib untuk permintaan yang dibantu admin.' : null} helper="Mis. pelanggan menelepon 12.05, setuju data dicatat." /> : null}
    </Screen>
  );
}
