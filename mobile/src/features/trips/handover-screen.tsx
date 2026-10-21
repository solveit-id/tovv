import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Choice, Field } from '@/components/ui/form';
import { SectionTitle, Sheet } from '@/components/ui/nota';
import { QueryView } from '@/components/ui/states';
import { PhotoTile } from '@/components/nota/photo-tile';
import { useApi } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';

/** Serah-terima (OPS-04): foto kondisi akhir, nama penerima, pernyataan diterima/berkeberatan. */
export function HandoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const q = useTovvQuery(['order', id], (a) => a.getOrder(id));
  const [receiver, setReceiver] = useState('');
  const [acceptance, setAcceptance] = useState<'accepted' | 'objection'>('accepted');
  const [objection, setObjection] = useState('');
  const [exception, setException] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.handover(id, { receiverName: receiver, acceptance, objectionNote: acceptance === 'objection' ? objection : null, photoExceptionReason: exception || null });
      toast.show(acceptance === 'objection' ? 'Serah-terima tercatat dengan keberatan; bukti masuk review.' : 'Serah-terima tercatat. Tagihan diterbitkan terpisah oleh finance.', 'ok');
      router.back();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<DetailHeader serial={q.data ? `O-${q.data.summary.alias}` : undefined} title="Serah-terima" subtitle={q.data?.summary.dropoff.label} />}
      footer={
        <>
          {err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}
          <Button label="Catat serah-terima" icon="handshake-outline" size="lg" loading={busy} onPress={() => void submit()} />
        </>
      }
    >
      <QueryView q={q}>
        {(d) => {
          const slot = d.evidenceSlots.find((s) => s.stage === 'delivery_handover');
          const m = slot?.mediaId ? d.media.find((x) => x.id === slot.mediaId) ?? null : d.media.find((x) => x.stage === 'delivery_handover') ?? null;
          return (
            <>
              <Txt variant="bodySm" tone="inkSecondary">
                Isi saat kendaraan sudah berhenti. Serah-terima tidak melunasi tagihan; penerima bukan otomatis pembayar.
              </Txt>
              <SectionTitle title="Foto kondisi akhir" />
              <Sheet>
                <PhotoTile
                  item={m}
                  label="Serah-terima · kondisi akhir"
                  size={132}
                  onPress={() => router.push({ pathname: '/camera', params: { requestId: d.requestId, orderId: d.summary.id, stage: 'delivery_handover', slot: 'DO1' } })}
                />
                {!m ? (
                  <View style={{ marginTop: space.md }}>
                    <Field label="Alasan tanpa foto (bila terpaksa)" value={exception} onChangeText={setException} helper="Pengecualian tercatat dan bukti dianggap belum lengkap." />
                  </View>
                ) : null}
              </Sheet>
              <SectionTitle title="Penerima" />
              <Field label="Nama penerima" value={receiver} onChangeText={setReceiver} placeholder={d.parties.receiver} autoCapitalize="words" />
              <Choice
                label="Pernyataan penerima"
                value={acceptance}
                onChange={setAcceptance}
                options={[
                  { value: 'accepted', label: 'Diterima tanpa keberatan' },
                  { value: 'objection', label: 'Diterima dengan keberatan', hint: 'Mis. menyatakan ada kerusakan baru' },
                ]}
              />
              {acceptance === 'objection' ? <Field label="Isi keberatan" value={objection} onChangeText={setObjection} multiline /> : null}
              <Txt variant="caption" tone="inkSecondary">Petugas mencatat pernyataan penerima; ini bukan tanda tangan digital tersertifikasi.</Txt>
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}
