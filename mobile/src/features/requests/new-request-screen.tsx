import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { easeOut, useReducedMotion } from '@/core/design/motion';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ChipSelect, Choice, Field, Toggle } from '@/components/ui/form';
import { Card } from '@/components/ui/surface';
import { RouteRail } from '@/components/business/route-rail';
import { useApi, useSession } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { useDialog } from '@/components/feedback/dialog';
import { ApiError } from '@/data/api/contract';
import type { Channel, Place, ServiceKind, TimingKind } from '@/domain/types';
import { addMinutes, formatShortDateTime, timePresets } from '@/core/format/time';
import { t } from '@/core/i18n';
import { PlacePicker, type PlaceField } from './place-picker';
import { ServicePicker } from '@/features/services/service-picker';
import { formatRupiah } from '@/core/format/money';
import { RouteCard } from './route-card';

/** Kunci idempotensi per layar formulir: kirim ulang (mis. setelah jaringan putus) tidak membuat request ganda. */
function newIdempotencyKey() {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const toNum = (s: string) => {
  const d = s.replace(/[^\d]/g, '');
  return d ? Number(d) : null;
};

type Step = 'customer' | 'route' | 'vehicle' | 'time' | 'review';

const STEP_LABEL: Record<Step, string> = { customer: 'Pelanggan', route: 'Lokasi', vehicle: 'Layanan', time: 'Waktu', review: 'Periksa' };

const SERVICE_KINDS: ServiceKind[] = ['car_towing', 'car_carrier', 'motor_storing', 'self_drive'];
const asService = (v: string | undefined): ServiceKind => (SERVICE_KINDS.includes(v as ServiceKind) ? (v as ServiceKind) : 'car_towing');

const VEHICLE_TYPES = [
  { value: 'Sedan', label: 'Sedan', icon: 'car-side' },
  { value: 'SUV / MPV', label: 'SUV / MPV', icon: 'car-estate' },
  { value: 'Hatchback', label: 'Hatchback', icon: 'car-hatchback' },
  { value: 'Pikap', label: 'Pikap', icon: 'car-pickup' },
  { value: 'Minibus / van', label: 'Minibus / van', icon: 'van-passenger' },
  { value: 'other', label: 'Lainnya', icon: 'dots-horizontal' },
];

const MOTOR_TYPES = [
  { value: 'Moge (motor besar)', label: 'Moge (motor besar)', icon: 'motorbike' },
  { value: 'Motor sport', label: 'Motor sport', icon: 'motorbike' },
  { value: 'Skuter / matik', label: 'Skuter / matik', icon: 'moped' },
  { value: 'other', label: 'Lainnya', icon: 'dots-horizontal' },
];

const MOTOR_CONDITIONS = ['Mogok, tidak bisa jalan', 'Habis jatuh atau kecelakaan', 'Ban rusak atau bocor', 'Sehat, hanya perlu dipindah'].map((x) => ({ value: x, label: x }));

const CONDITIONS = [
  'Mogok, tidak bisa jalan',
  'Habis kecelakaan',
  'Ban rusak atau bocor',
  'Roda terkunci',
  'Aki habis',
  'Sehat, hanya perlu dipindah',
].map((x) => ({ value: x, label: x }));

/** Garis langkah di bawah header: ruas yang sudah dilewati terisi, ruas aktif mengisi dengan halus. */
function StepProgress({ steps, index }: { steps: Step[]; index: number }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const p = useSharedValue(index);
  useEffect(() => {
    p.value = reduced ? index : withTiming(index, { duration: 320, easing: easeOut });
  }, [index, reduced, p]);
  return (
    <View style={s.progress} accessible accessibilityRole="progressbar" accessibilityLabel={t('Langkah {0} dari {1}: {2}', [index + 1, steps.length, t(STEP_LABEL[steps[index]!])])}>
      <View style={s.segments}>
        {steps.map((st, i) => (
          <Segment key={st} i={i} p={p} />
        ))}
      </View>
    </View>
  );
}

function Segment({ i, p }: { i: number; p: ReturnType<typeof useSharedValue<number>> }) {
  const s = useStyles();
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0, Math.min(1, p.value - i + 1)) }] }));
  return (
    <View style={s.segment}>
      <Animated.View style={[s.segmentFill, fill]} />
    </View>
  );
}

function SummaryBlock({ icon, title, onEdit, children }: { icon: string; title: string; onEdit: () => void; children: React.ReactNode }) {
  const s = useStyles();
  return (
    <Card style={{ marginBottom: space.md }}>
      <View style={s.sumHead}>
        <Icon name={icon} size={18} tone="accentInk" />
        <Txt variant="label" tone="inkSecondary" style={{ flex: 1 }}>{title}</Txt>
        <Button label="Ubah" variant="quiet" compact onPress={onEdit} />
      </View>
      <View style={{ gap: 4 }}>{children}</View>
    </Card>
  );
}

/**
 * Pesan towing (pelanggan) / catat permintaan (owner) sebagai formulir bertahap: lokasi → kendaraan →
 * waktu → periksa (owner mulai dari pelanggan & kanal). ORD-01–ORD-04. Berat/dimensi kosong tidak
 * ditebak: permintaan menjadi "perlu dicek". Lokasi dipilih seperti aplikasi ojek online.
 */
export function NewRequestScreen() {
  const s = useStyles();
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const session = useSession();
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{ pick?: string; service?: string }>();
  const packages = useTovvQuery(['service-packages'], (a) => a.listServicePackages());
  const [service, setService] = useState<ServiceKind>(() => asService(params.service));
  const pkg = packages.data?.find((p) => p.kind === service);
  const motor = service === 'motor_storing';
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const customers = useTovvQuery(['customers'], (a) => a.listCustomers(), { enabled: staff });
  const me = useTovvQuery(['session'], (a) => a.getSession());
  const book = useTovvQuery(['place-book'], (a) => a.getPlaceBook());
  const presets = useMemo(() => timePresets(api.now()), [api]);
  const [idem] = useState(newIdempotencyKey);

  const steps: Step[] = staff ? ['customer', 'route', 'vehicle', 'time', 'review'] : ['route', 'vehicle', 'time', 'review'];
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const step = steps[index]!;

  const [channel, setChannel] = useState<Channel>(staff ? 'phone' : 'mobile');
  const [customerId, setCustomerId] = useState<string>('');
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dropoff, setDropoff] = useState<Place | null>(null);
  const [picker, setPicker] = useState<PlaceField | null>(null);
  // Dibuka dari "Jemput di mana?" di beranda: pemilih lokasi muncul setelah transisi halaman selesai.
  useEffect(() => {
    if (params.pick !== 'pickup' && params.pick !== 'dropoff') return;
    const field = params.pick;
    const timer = setTimeout(() => setPicker(field), 320);
    return () => clearTimeout(timer);
  }, [params.pick]);
  const [vehicleType, setVehicleType] = useState<string[]>([]);
  const [carCount, setCarCount] = useState('1');
  const [drivable, setDrivable] = useState(false);
  const [otherType, setOtherType] = useState('');
  const [plate, setPlate] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionNote, setConditionNote] = useState('');
  const [showSize, setShowSize] = useState(false);
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [timing, setTiming] = useState<TimingKind>('scheduled');
  const [startIdx, setStartIdx] = useState('0');
  const [immediateOk, setImmediateOk] = useState(false);
  const [showParties, setShowParties] = useState(false);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [payer, setPayer] = useState('');
  const [po, setPo] = useState('');
  const [consent, setConsent] = useState('');
  const [busy, setBusy] = useState<'send' | 'draft' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const cust = customers.data?.find((c) => c.userId === customerId);
  const ordererName = staff ? (cust?.name ?? '') : (me.data?.userName ?? '');
  const bizName = staff ? cust?.businessAccountName : me.data?.businessAccountName;
  const vehicleLabel = vehicleType[0] === 'other' ? otherType.trim() : (vehicleType[0] ?? '');
  const condition = [
    service === 'car_carrier' && Number(carCount) > 1 ? t('Jumlah mobil: {0}', [Number(carCount)]) : '',
    service === 'self_drive' ? (drivable ? t('Pelanggan memastikan mobil layak dikemudikan') : '') : '',
    ...(service === 'self_drive' ? [] : conditions),
    conditionNote.trim(),
  ]
    .filter(Boolean)
    .join('. ');
  const start = presets[Number(startIdx)]?.start ?? presets[0]!.start;

  const go = (to: number) => {
    setErr(null);
    setDir(to > index ? 1 : -1);
    setIndex(to);
  };

  // Keluar dari formulir yang sudah diisi (tombol kembali, gesture, Back) selalu ditanyakan dulu.
  const dialog = useDialog();
  const [discarded, setDiscarded] = useState(false);
  const dirty = !!(pickup || dropoff || customerId || vehicleType.length || plate.trim() || conditions.length || conditionNote.trim() || drivable || carCount !== '1' || service !== asService(params.service));
  const allowLeave = usePreventRemove(dirty && !discarded, ({ repeat }) => {
    void dialog
      .confirm({ title: 'Buang isian permintaan?', message: 'Lokasi dan data kendaraan yang sudah diisi akan hilang.', icon: 'file-remove-outline', tone: 'warn', confirmLabel: 'Buang dan keluar', cancelLabel: 'Lanjut mengisi' })
      .then((ok) => {
        if (!ok) return;
        setDiscarded(true);
        repeat();
      });
  });

  // Tombol Back Android: mundur satu langkah dulu, baru keluar dari formulir.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      go(index - 1);
      return true;
    });
    return () => sub.remove();
  });

  const checkStep = (st: Step): string | null => {
    if (st === 'customer' && !customerId) return t('Pilih pelanggan yang menghubungi Anda.');
    if (st === 'route') {
      if (!pickup || !dropoff) return t('Pilih lokasi jemput dan tujuan dulu.');
      const samePoint = pickup.lat !== null && dropoff.lat !== null ? pickup.lat === dropoff.lat && pickup.lng === dropoff.lng : pickup.address === dropoff.address;
      if (samePoint) return t('Lokasi jemput dan tujuan masih sama.');
    }
    if (st === 'vehicle') {
      if (!vehicleLabel) return t('Pilih jenis kendaraannya.');
      if (service === 'self_drive' && !drivable) return t('Self Drive hanya untuk mobil yang layak dikemudikan. Centang pernyataannya, atau pilih Car Towing.');
      if (!plate.trim()) return t('Isi nomor polisinya.');
    }
    return null;
  };

  const next = () => {
    const problem = checkStep(step);
    if (problem) {
      setErr(problem);
      return;
    }
    go(index + 1);
  };

  const submit = async (asDraft: boolean) => {
    setErr(null);
    setFieldErr({});
    const problem = steps.map(checkStep).find(Boolean);
    if (problem) {
      setErr(problem);
      return;
    }
    setBusy(asDraft ? 'draft' : 'send');
    try {
      const r = await api.createRequest({
        service,
        channel,
        customerUserId: staff ? customerId : null,
        businessAccountId: staff ? (cust?.businessAccountId ?? null) : null,
        parties: { orderer: ordererName, sender: sender || ordererName, receiver: receiver || ordererName, payer: payer || bizName || ordererName },
        vehicle: { label: vehicleLabel, plate: plate.trim().toUpperCase(), weightKg: toNum(weight), lengthMm: toNum(length), widthMm: toNum(width), condition: condition || 'Belum dijelaskan' },
        pickup: pickup!,
        dropoff: dropoff!,
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
      // Pelanggan mendapat dialog "apa yang terjadi berikutnya"; toast dipakai untuk owner dan draf.
      if (staff || asDraft) toast.show(
        r.status === 'needs_review'
          ? t('{0} tercatat. Masih perlu dilengkapi: {1}.', [r.alias, r.needsReviewReasons.join(', ').toLowerCase()])
          : asDraft
            ? t('Draf {0} disimpan.', [r.alias])
            : staff
              ? t('{0} tercatat dan siap diberi harga.', [r.alias])
              : t('Permintaan {0} terkirim. Kami kabari begitu harganya siap.', [r.alias]),
        'ok',
      );
      setDiscarded(true);
      allowLeave();
      if (!staff && !asDraft) {
        await dialog.inform({
          title: t('Permintaan {0} terkirim', [r.alias]),
          message: 'Ini yang terjadi berikutnya:',
          points: ['Operator mengecek lokasi dan kendaraan Anda', 'Anda menerima harga untuk disetujui', 'Belum ada yang perlu dibayar sekarang'],
          icon: 'check-circle-outline',
          tone: 'ok',
          confirmLabel: 'Lihat permintaan',
        });
      }
      router.replace(`/request/${r.id}`);
    } catch (e) {
      setErr(errorMessage(e));
      if (e instanceof ApiError) setFieldErr(e.fields);
    } finally {
      setBusy(null);
    }
  };

  const entering = reduced ? undefined : (dir > 0 ? FadeInRight : FadeInLeft).duration(260).easing(easeOut).withInitialValues({ opacity: 0, transform: [{ translateX: dir * 16 }] });
  const last = index === steps.length - 1;
  const timeText = timing === 'immediate' ? t('Sekarang juga') : timing === 'flexible' ? t('Kapan saja mulai {0} (rentang 4 jam)', [formatShortDateTime(start)]) : formatShortDateTime(start);

  return (
    <Screen
      scrollKey={step}
      header={
        <View>
          <DetailHeader title={staff ? 'Catat permintaan' : 'Pesan towing'} subtitle={t('Langkah {0} dari {1} · {2}', [index + 1, steps.length, t(STEP_LABEL[step])])} />
          <StepProgress steps={steps} index={index} />
        </View>
      }
      footer={
        <>
          {err ? (
            <View style={s.err} accessibilityLiveRegion="polite">
              <Icon name="alert-circle" size={16} tone="dangerInk" />
              <Txt variant="bodySm" tone="dangerInk" style={{ flex: 1 }}>{err}</Txt>
            </View>
          ) : null}
          {last ? <Button label="Simpan sebagai draf" variant="quiet" compact loading={busy === 'draft'} onPress={() => void submit(true)} /> : null}
          <View style={s.footRow}>
            {index > 0 ? <Button label="Kembali" variant="secondary" icon="arrow-left" style={{ flex: 1 }} onPress={() => go(index - 1)} /> : null}
            {last ? (
              <Button label={staff ? 'Simpan permintaan' : 'Kirim permintaan'} icon="send-outline" size="lg" style={{ flex: 2 }} loading={busy === 'send'} onPress={() => void submit(false)} />
            ) : (
              <Button label="Lanjut" icon="arrow-right" size="lg" style={{ flex: 2 }} onPress={next} />
            )}
          </View>
        </>
      }
    >
      <Animated.View key={step} entering={entering}>
        {step === 'customer' ? (
          <>
            <Txt variant="title" style={s.q}>Siapa yang menghubungi Anda?</Txt>
            <Choice
              label="Lewat"
              value={channel}
              onChange={setChannel}
              options={[
                { value: 'phone', label: 'Telepon', icon: 'phone-outline' },
                { value: 'chat', label: 'Chat', icon: 'chat-outline' },
                { value: 'manual', label: 'Datang langsung', icon: 'account-outline' },
              ]}
            />
            <Choice
              label="Pelanggan"
              value={customerId}
              onChange={setCustomerId}
              options={(customers.data ?? []).map((c) => ({
                value: c.userId,
                label: c.name,
                icon: c.businessAccountName ? 'domain' : 'account-circle-outline',
                hint: c.businessAccountName ? `${c.businessAccountName}${c.poRequired ? t(' · wajib nomor PO') : ''}` : t('Pelanggan pribadi'),
              }))}
            />
          </>
        ) : null}

        {step === 'route' ? (
          <>
            <Txt variant="title" style={s.q}>Dari mana ke mana?</Txt>
            <Txt variant="bodySm" tone="inkSecondary" style={s.lead}>Cari alamatnya, pakai lokasi Anda sekarang, atau geser pin di peta.</Txt>
            <RouteCard
              pickup={pickup}
              dropoff={dropoff}
              error={!!fieldErr.pickup}
              onEdit={setPicker}
              onSwap={() => {
                setPickup(dropoff);
                setDropoff(pickup);
              }}
            />
            <View style={s.tip}>
              <Icon name="lightbulb-on-outline" size={18} tone="accentInk" />
              <Txt variant="bodySm" style={{ flex: 1 }}>Tambahkan patokan, misalnya “depan minimarket”, supaya sopir cepat menemukan mobil Anda.</Txt>
            </View>
          </>
        ) : null}

        {step === 'vehicle' ? (
          <>
            <Txt variant="title" style={s.q}>Pakai layanan apa?</Txt>
            {packages.data ? (
              <ServicePicker
                packages={packages.data}
                value={service}
                onChange={(k) => {
                  if ((k === 'motor_storing') !== motor) setVehicleType([]);
                  setService(k);
                }}
              />
            ) : null}
            {pkg ? (
              <View style={s.svcNote}>
                <Icon name="information-outline" size={16} tone="accentInk" />
                <Txt variant="caption" style={{ flex: 1 }}>{pkg.description}</Txt>
              </View>
            ) : null}
            <ChipSelect label={motor ? 'Jenis motor' : 'Jenis mobil'} options={motor ? MOTOR_TYPES : VEHICLE_TYPES} value={vehicleType} onChange={setVehicleType} />
            {vehicleType[0] === 'other' ? <Field label="Tulis jenisnya" value={otherType} onChangeText={setOtherType} placeholder="mis. truk kecil, mobil listrik" /> : null}
            <Field label="Nomor polisi" value={plate} onChangeText={setPlate} autoCapitalize="characters" placeholder="mis. L 1234 AB" icon="card-text-outline" />
            {service === 'car_carrier' ? <Field label="Berapa mobil yang dikirim?" value={carCount} onChangeText={(v) => setCarCount(v.replace(/[^\d]/g, '').slice(0, 2))} keyboardType="number-pad" helper="Isi 1 bila hanya satu mobil." /> : null}
            {service === 'self_drive' ? (
              <Card padded={false} style={{ marginBottom: space.lg }}>
                <Toggle label="Mobil layak dikemudikan" hint="Rem, lampu, dan ban aman. Kalau mogok, pilih Car Towing." value={drivable} onChange={setDrivable} />
              </Card>
            ) : (
              <ChipSelect label="Kondisinya sekarang" options={motor ? MOTOR_CONDITIONS : CONDITIONS} value={conditions} onChange={setConditions} multi />
            )}
            <Field label="Catatan kondisi (boleh dikosongkan)" value={conditionNote} onChangeText={setConditionNote} multiline placeholder="mis. setir berat, mobil ada di basement lantai 2" />
            <Card padded={false} style={{ marginBottom: space.lg }}>
              <Toggle label="Saya tahu berat dan ukurannya" hint="Boleh dilewati. Operator akan menanyakannya sebelum memberi harga." value={showSize} onChange={setShowSize} />
              {showSize ? (
                <View style={s.size}>
                  <Field label="Berat (kg)" value={weight} onChangeText={setWeight} keyboardType="number-pad" placeholder="1800" />
                  <View style={s.sizeRow}>
                    <View style={{ flex: 1 }}><Field label="Panjang (mm)" value={length} onChangeText={setLength} keyboardType="number-pad" placeholder="4500" /></View>
                    <View style={{ flex: 1 }}><Field label="Lebar (mm)" value={width} onChangeText={setWidth} keyboardType="number-pad" placeholder="1800" /></View>
                  </View>
                </View>
              ) : null}
            </Card>
          </>
        ) : null}

        {step === 'time' ? (
          <>
            <Txt variant="title" style={s.q}>Kapan towing dibutuhkan?</Txt>
            <Choice
              label="Waktu"
              hideLabel
              value={timing}
              onChange={setTiming}
              options={[
                { value: 'immediate', label: 'Sekarang juga', icon: 'lightning-bolt-outline', hint: 'Operator memastikan dulu ada unit yang bisa segera berangkat.' },
                { value: 'scheduled', label: 'Pada jam tertentu', icon: 'calendar-clock-outline', hint: 'Pilih hari dan jamnya di bawah.' },
                { value: 'flexible', label: 'Kapan saja dalam 4 jam', icon: 'clock-time-four-outline', hint: 'Harga bisa lebih ringan karena jadwalnya longgar.' },
              ]}
            />
            {timing !== 'immediate' ? (
              <ChipSelect label={timing === 'flexible' ? 'Mulai dari' : 'Jam jemput'} options={presets.map((p, i) => ({ value: String(i), label: p.label, icon: 'clock-outline' }))} value={[startIdx]} onChange={(v) => setStartIdx(v[0] ?? '0')} />
            ) : null}
            {timing === 'immediate' && staff ? <Toggle label="Unit dan sopir sudah dipastikan bisa segera" value={immediateOk} onChange={setImmediateOk} /> : null}
          </>
        ) : null}

        {step === 'review' ? (
          <>
            <Txt variant="title" style={s.q}>Periksa sebelum dikirim</Txt>
            {staff && cust ? (
              <SummaryBlock icon="account-outline" title="Pelanggan" onEdit={() => go(0)}>
                <Txt variant="bodyStrong">{cust.name}</Txt>
                <Txt variant="caption" tone="inkSecondary">{cust.businessAccountName ?? t('Pelanggan pribadi')}</Txt>
              </SummaryBlock>
            ) : null}
            {pickup && dropoff ? (
              <SummaryBlock icon="map-marker-path" title="Lokasi" onEdit={() => go(steps.indexOf('route'))}>
                <RouteRail pickup={pickup} dropoff={dropoff} detailed />
                {pickup.note || dropoff.note ? <Txt variant="caption" tone="accentInk">{[pickup.note && t('Jemput: {0}', [pickup.note]), dropoff.note && t('Tujuan: {0}', [dropoff.note])].filter(Boolean).join(' · ')}</Txt> : null}
              </SummaryBlock>
            ) : null}
            <SummaryBlock icon="tow-truck" title="Layanan" onEdit={() => go(steps.indexOf('vehicle'))}>
              <Txt variant="bodyStrong">{pkg?.name ?? service}</Txt>
              {pkg ? <Txt variant="caption" tone="inkSecondary">{t('Mulai dari {0} {1} (harga contoh DEMO). Harga pasti dikirim operator.', [formatRupiah(pkg.startFrom), pkg.priceUnit])}</Txt> : null}
            </SummaryBlock>
            <SummaryBlock icon={motor ? 'motorbike' : 'car-side'} title="Kendaraan" onEdit={() => go(steps.indexOf('vehicle'))}>
              <Txt variant="bodyStrong">{`${vehicleLabel} · ${plate.trim().toUpperCase()}`}</Txt>
              <Txt variant="caption" tone="inkSecondary">{condition || t('Kondisi belum dijelaskan')}</Txt>
              {!weight || !length || !width ? <Txt variant="caption" tone="warnInk">Berat atau ukuran belum diisi, jadi operator akan menanyakannya dulu.</Txt> : null}
            </SummaryBlock>
            <SummaryBlock icon="clock-outline" title="Waktu" onEdit={() => go(steps.indexOf('time'))}>
              <Txt variant="bodyStrong">{timeText}</Txt>
            </SummaryBlock>

            <Card padded={false} style={{ marginBottom: space.md }}>
              <Toggle label="Yang menyerahkan, menerima, atau membayar orang lain" hint={t('Kalau dikosongkan, semuanya atas nama {0}.', [ordererName || t('pemesan')])} value={showParties} onChange={setShowParties} />
              {showParties ? (
                <View style={s.parties}>
                  <Field label="Yang menyerahkan mobil saat dijemput" value={sender} onChangeText={setSender} placeholder={ordererName} />
                  <Field label="Penerima di tujuan" value={receiver} onChangeText={setReceiver} placeholder={ordererName} />
                  <Field label="Yang membayar" value={payer} onChangeText={setPayer} placeholder={bizName || ordererName} />
                </View>
              ) : null}
            </Card>
            {bizName ? <Field label="Nomor PO / referensi internal" value={po} onChangeText={setPo} helper={cust?.poRequired ? 'Wajib untuk akun ini sebelum pesanan dikonfirmasi.' : 'Boleh dikosongkan untuk akun ini.'} /> : null}
            {staff ? (
              <Field label="Catatan persetujuan pelanggan" value={consent} onChangeText={setConsent} multiline error={fieldErr.consent ? 'Wajib diisi untuk permintaan yang Anda catat.' : null} helper="Misal: pelanggan menelepon pukul 12.05 dan setuju datanya dicatat." />
            ) : (
              <View style={s.tip}>
                <Icon name="shield-check-outline" size={18} tone="accentInk" />
                <Txt variant="bodySm" style={{ flex: 1 }}>Belum ada yang perlu dibayar. Operator mengecek dulu, lalu mengirim harga untuk Anda setujui.</Txt>
              </View>
            )}
          </>
        ) : null}
      </Animated.View>

      {picker ? (
        <PlacePicker
          field={picker}
          initial={picker === 'pickup' ? pickup : dropoff}
          book={book.data}
          onClose={() => setPicker(null)}
          onPick={(p) => {
            setFieldErr({});
            setErr(null);
            if (picker === 'pickup') {
              setPickup(p);
              // Seperti aplikasi ojek online: setelah jemput dipilih, langsung tanya tujuan di Modal yang sama.
              setPicker(dropoff ? null : 'dropoff');
            } else {
              setDropoff(p);
              setPicker(null);
            }
          }}
        />
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  progress: { paddingHorizontal: space.lg, paddingBottom: space.sm, gap: 6 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.line, overflow: 'hidden' },
  segmentFill: { flex: 1, backgroundColor: c.accent, transformOrigin: 'left' },
  q: { marginBottom: space.xs },
  lead: { marginBottom: space.lg },
  tip: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', marginTop: space.lg, padding: space.md, borderRadius: radius.lg, backgroundColor: c.accentSoft },
  size: { paddingHorizontal: space.lg, paddingTop: space.sm },
  sizeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  parties: { paddingHorizontal: space.lg, paddingTop: space.sm },
  sumHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs },
  err: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  svcNote: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, marginTop: -space.sm, marginBottom: space.lg, borderRadius: radius.md, backgroundColor: c.accentSoft },
  footRow: { flexDirection: 'row', gap: space.sm },
}));
