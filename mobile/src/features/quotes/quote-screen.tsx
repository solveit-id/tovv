import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Field, Toggle } from '@/components/ui/form';
import { Card } from '@/components/ui/surface';
import { QueryView } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useApi } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { QuoteStack } from './quote-doc-view';
import { useDemoNow } from '@/core/hooks/use-demo-now';

/**
 * Persetujuan penawaran oleh pelanggan (QTE-04/05, BIZ-02/05). Mengacu satu versi; versi lama/kedaluwarsa
 * ditolak. B2B: requester tidak menyetujui; approver mengisi PO bila wajib. Persetujuan mengunci unit saat itu.
 */
export function QuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const now = useDemoNow();
  const q = useTovvQuery(['quote', id], (a) => a.getQuote(id));
  const req = useTovvQuery(['request', q.data?.requestId], (a) => a.getRequest(q.data!.requestId), { enabled: !!q.data });
  const [po, setPo] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [endReq, setEndReq] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.acceptQuote(id, { poRef: po || null });
      toast.show('Disetujui. Unit dan jadwal terkunci; operator menugaskan petugas.', 'ok');
      router.replace(`/order/${r.orderId}`);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const doc = q.data;
  const canDecide = doc?.allowedActions.includes('accept');
  const needPo = req.data?.businessAccount?.poRequired && !req.data.poRef;

  return (
    <Screen
      header={<DetailHeader title={doc ? `Penawaran v${doc.version}` : 'Penawaran'} subtitle={doc?.operatorName} />}
      footer={
        canDecide ? (
          <>
            {err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Tolak" variant="danger" style={{ flex: 1 }} onPress={() => setRejectOpen(true)} />
              <Button label="Setujui versi ini" icon="check-decagram-outline" size="lg" style={{ flex: 2 }} loading={busy} onPress={() => void accept()} />
            </View>
          </>
        ) : null
      }
    >
      <QueryView q={q}>
        {(d) => (
          <>
            <QuoteStack quotes={req.data?.quotes.length ? [d, ...req.data.quotes.filter((x) => x.id !== d.id)] : [d]} now={now} />
            {d.approvalNote ? <Card style={{ marginTop: space.md }}><Txt variant="bodySm" tone="warnInk">{d.approvalNote}</Txt></Card> : null}
            {canDecide && req.data?.businessAccount ? (
              <View style={{ marginTop: space.lg }}>
                <Field label="Nomor PO / referensi internal" value={po} onChangeText={setPo} helper={needPo ? `Wajib untuk ${req.data.businessAccount.name}.` : req.data.poRef ? `Tercatat: ${req.data.poRef}` : 'Opsional.'} />
              </View>
            ) : null}
            <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.md }}>
              Menyetujui mengacu versi ini saja. Biaya tambahan kemudian disajikan terpisah dan tidak ditagih sebelum Anda setujui.
            </Txt>
          </>
        )}
      </QueryView>
      <BottomSheet
        visible={rejectOpen}
        title="Tolak penawaran"
        onClose={() => setRejectOpen(false)}
        footer={
          <Button
            label="Kirim penolakan"
            variant="danger"
            loading={busy}
            onPress={() =>
              void (async () => {
                setBusy(true);
                try {
                  await api.rejectQuote(id, reason, endReq);
                  toast.show(endReq ? 'Penawaran ditolak; permintaan ditutup.' : 'Penawaran ditolak; operator dapat mengirim versi baru.', 'ok');
                  setRejectOpen(false);
                } catch (e) {
                  setErr(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              })()
            }
          />
        }
      >
        <Field label="Alasan" value={reason} onChangeText={setReason} multiline helper="Membantu operator menyesuaikan versi berikutnya." />
        <Toggle label="Tidak melanjutkan permintaan" value={endReq} onChange={setEndReq} />
        {err ? <Txt variant="bodySm" tone="dangerInk">{err}</Txt> : null}
      </BottomSheet>
    </Screen>
  );
}
