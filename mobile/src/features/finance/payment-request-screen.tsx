import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { LineItem, Money, Serial, Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { InternalQr } from '@/components/nota/internal-qr';
import { useTovvQuery } from '@/data/api/hooks';
import { paymentRequestStatus } from '@/core/i18n/status';
import { formatDateTime, formatShortDateTime } from '@/core/format/time';

/** Tujuan deep link `tovv-demo://payment-request/<id>`. Tautan tidak menambah hak: tetap diperiksa terhadap invoice. */
export function PaymentRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useTovvQuery(['payment-request', id], (a) => a.getPaymentRequest(id));
  return (
    <Screen header={<DetailHeader serial={q.data?.reference} title="Permintaan pembayaran" subtitle={q.data?.invoiceNumber} />} footer={q.data ? <Button label="Buka invoice" size="lg" onPress={() => router.replace(`/invoice/${q.data.invoiceId}`)} /> : null}>
      <QueryView q={q}>
        {(pr) => (
          <>
            <Sheet>
              <Serial>{pr.reference}</Serial>
              <View style={{ marginVertical: space.sm }}><StatusTag look={paymentRequestStatus[pr.status]} /></View>
              <LineItem label="Nominal diminta" value={<Money value={pr.requestedAmount} size="lg" />} />
              <LineItem label="Sisa saat dibuat" value={<Money value={pr.outstandingSnapshot} />} />
              <LineItem label="Berlaku sampai" value={<Txt variant="bodySm">{formatDateTime(pr.expiresAt)}</Txt>} />
              <Txt variant="caption" tone="inkSecondary">Status permintaan tidak membuktikan dana ada atau tidak ada. Bukti terlambat tetap diperiksa.</Txt>
            </Sheet>
            {pr.status === 'active' ? <View style={{ alignItems: 'center', marginTop: space.lg }}><InternalQr uri={pr.deepLink} /></View> : null}
            <Sheet style={{ marginTop: space.lg }}>
              {pr.history.map((h, i) => <LineItem key={i} label={paymentRequestStatus[h.status].label} hint={h.note} value={<Txt variant="caption">{formatShortDateTime(h.at)}</Txt>} />)}
            </Sheet>
          </>
        )}
      </QueryView>
    </Screen>
  );
}
