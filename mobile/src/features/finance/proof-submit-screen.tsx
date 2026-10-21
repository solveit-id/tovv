import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Choice, Field, MoneyField } from '@/components/ui/form';
import { Sheet } from '@/components/ui/nota';
import { QueryView } from '@/components/ui/states';
import { useApi, useSession } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import type { PaymentMethod } from '@/domain/types';
import { addMinutes } from '@/core/format/time';
import { formatRupiah, parseMoneyString } from '@/core/format/money';

/**
 * Pengajuan bukti (PAY-02/12). "Saya sudah membayar" hanya mengirim bukti untuk ditinjau; saldo tidak berubah
 * sampai finance berwenang memeriksa. Lampiran adalah gambar sintetis/galeri; tidak ada kredensial bank.
 */
export function ProofSubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const session = useSession();
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const inv = useTovvQuery(['invoice', id], (a) => a.getInvoice(id));
  const active = inv.data?.paymentRequests.find((p) => p.status === 'active') ?? null;
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('transfer_demo');
  const [ref, setRef] = useState('');
  const [when, setWhen] = useState('15');
  const [assisted, setAssisted] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const eventAt = useMemo(() => addMinutes(api.now(), -Number(when)), [api, when]);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) setAttachment(`Gambar galeri ${r.assets[0].fileName ?? ''}`.trim());
  };

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const amt = amount ?? (active ? parseMoneyString(active.requestedAmount) : parseMoneyString(inv.data!.outstanding));
      const p = await api.submitProof({
        invoiceId: id,
        paymentRequestId: active?.id ?? null,
        amount: amt,
        method,
        reference: ref,
        eventAt,
        assistedReason: staff ? assisted : null,
        attachmentLabel: attachment ?? 'Tanpa lampiran (DEMO)',
      });
      toast.show(p.status === 'flagged_review' ? 'Bukti dikirim dan ditandai untuk ditinjau khusus.' : 'Bukti dikirim. Menunggu pemeriksaan; sisa tagihan belum berubah.', 'ok');
      router.replace(`/proof/${p.id}`);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<DetailHeader serial={inv.data?.number} title={staff ? 'Catat bukti (dibantu)' : 'Kirim bukti pembayaran'} subtitle="Menunggu pemeriksaan · tidak langsung melunasi" />}
      footer={
        <>
          {err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}
          <Button label="Kirim untuk diperiksa" icon="send-outline" size="lg" loading={busy} onPress={() => void submit()} />
        </>
      }
    >
      <QueryView q={inv}>
        {(d) => (
          <>
            <Sheet style={{ marginBottom: space.lg }}>
              <Txt variant="bodySm">{`Sisa tagihan ${formatRupiah(d.outstanding)}${active ? ` · permintaan aktif ${active.reference} ${formatRupiah(active.requestedAmount)}` : ' · tidak ada permintaan aktif (bukti tetap ditinjau)'}`}</Txt>
              <Txt variant="caption" tone="inkSecondary" style={{ marginTop: 4 }}>{`Tujuan DEMO: ${d.instruction.account}. Jangan mengirim uang nyata.`}</Txt>
            </Sheet>
            <MoneyField label="Nominal dibayar" value={amount ?? (active ? parseMoneyString(active.requestedAmount) : parseMoneyString(d.outstanding))} onChange={setAmount} />
            <Choice label="Metode" value={method} onChange={setMethod} options={[{ value: 'transfer_demo', label: 'Transfer (demo)' }, { value: 'cash_demo', label: 'Tunai ke petugas (demo)', hint: 'Penguasaan uang dicatat terpisah dari penerimaan finance' }]} />
            <Field label="Referensi transfer / nomor kuitansi" value={ref} onChangeText={setRef} autoCapitalize="characters" placeholder="mis. TRF-DEMO-1234" />
            <Choice label="Waktu pembayaran" value={when} onChange={setWhen} options={[{ value: '15', label: '15 menit lalu' }, { value: '120', label: '2 jam lalu' }, { value: '1440', label: 'Kemarin' }]} helper="Waktu kejadian dicatat terpisah dari waktu diterima server." />
            {staff ? <Field label="Alasan pencatatan dibantu" value={assisted} onChangeText={setAssisted} multiline placeholder="mis. pelanggan mengirim foto bukti via chat" /> : null}
            <View style={{ gap: space.xs, marginBottom: space.lg }}>
              <Button label={attachment ? 'Ganti lampiran' : 'Lampirkan gambar bukti (galeri)'} icon="paperclip" variant="secondary" onPress={() => void pick()} />
              <Txt variant="caption" tone="inkSecondary">{attachment ?? 'Opsional di demo. Jangan melampirkan data rekening nyata.'}</Txt>
            </View>
          </>
        )}
      </QueryView>
    </Screen>
  );
}
