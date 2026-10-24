import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Choice, Field, MoneyField } from '@/components/ui/form';
import { LineItem, Money, SectionTitle, Serial, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Stamp } from '@/components/business/stamp';
import { useApi, useSession } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import type { Custody } from '@/domain/types';
import { proofStatus } from '@/core/i18n/status';
import { formatDateTime } from '@/core/format/time';
import { formatRupiah, parseMoneyString } from '@/core/format/money';
import { t } from '@/core/i18n';

/**
 * Pemeriksaan bukti (PAY-11). Verifikasi menyebut jumlah diterima demo, metode, custody, waktu kejadian;
 * membuat satu receipt + alokasi. Pengaju tidak dapat memeriksa buktinya sendiri.
 */
export function ProofScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const session = useSession();
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const q = useTovvQuery(['proof', id], (a) => a.getProof(id));
  const [mode, setMode] = useState<'verify' | 'reject' | 'reverse' | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [custody, setCustody] = useState<Custody>('operator_demo');
  const [reason, setReason] = useState('');
  const [dup, setDup] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const p = q.data;

  const run = async () => {
    if (!p) return;
    // Lembar isian (BottomSheet) ini sudah menjadi langkah konfirmasi: dialog di atas Modal tidak tampil di iOS.
    setBusy(true);
    setErr(null);
    try {
      if (mode === 'verify') {
        await api.verifyProof({ proofId: id, amountVerified: amount ?? parseMoneyString(p.amountClaimed), receivedEventAt: p.eventAt, custody, reason, duplicateResolution: dup || null });
        toast.show(t('Diterima (demo). Pembayaran dicatat dan sisa tagihan dihitung ulang.'), 'ok');
      } else if (mode === 'reject') {
        await api.rejectProof(id, reason);
        toast.show(t('Bukti ditolak dengan alasan tertulis; saldo tidak berubah.'), 'ok');
      } else if (mode === 'reverse') {
        await api.reverseVerification(id, reason);
        toast.show(t('Verifikasi dibatalkan: penerimaan dan alokasinya dibalik, riwayat tetap tersimpan.'), 'ok');
      }
      setMode(null);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const canVerify = p?.allowedActions.includes('verify');
  return (
    <Screen
      header={<DetailHeader title="Bukti pembayaran" subtitle={p ? `${p.invoiceNumber} · ${proofStatus[p.status].label}` : undefined} />}
      footer={
        canVerify ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Tolak" variant="danger" style={{ flex: 1 }} onPress={() => { setMode('reject'); setReason(''); setErr(null); }} />
            <Button label="Cek & terima" icon="stamper" size="lg" style={{ flex: 2 }} onPress={() => { setMode('verify'); setAmount(null); setReason(''); setErr(null); }} />
          </View>
        ) : null
      }
    >
      <QueryView q={q} skeleton="detail">
        {(d) => (
          <>
            <Card>
              <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Serial>{d.id}</Serial>
                  <StatusTag look={proofStatus[d.status]} />
                </View>
                {d.status === 'verified' ? <Stamp label="DIPERIKSA" tone="ok" detail="diterima demo" /> : d.status === 'rejected' ? <Stamp label="DITOLAK" tone="danger" /> : d.status === 'verification_reversed' ? <Stamp label="DIBATALKAN" tone="neutral" /> : null}
              </View>
              {d.flagReason ? <Txt variant="bodySm" tone="warnInk" style={{ marginTop: space.md, fontWeight: '600' }}>{d.flagReason}</Txt> : null}
              <View style={{ marginTop: space.md }}>
                <LineItem label="Nominal di bukti" value={<Money value={d.amountClaimed} />} />
                <LineItem label="Metode" value={<Txt variant="bodySm">{d.method === 'cash_demo' ? 'Tunai (demo)' : 'Transfer (demo)'}</Txt>} />
                <LineItem label="Referensi" value={<Txt variant="mono">{d.referenceClaimed}</Txt>} />
                <LineItem label="Waktu bayar (menurut pembayar)" value={<Txt variant="bodySm">{formatDateTime(d.eventAt)}</Txt>} />
                <LineItem label="Diterima sistem" value={<Txt variant="bodySm">{formatDateTime(d.receivedAt)}</Txt>} />
                <LineItem label="Diajukan oleh" hint={d.assistedReason ?? undefined} value={<Txt variant="bodySm">{d.submittedByName}</Txt>} />
                <LineItem label="Lampiran" value={<Txt variant="bodySm">{d.attachmentLabel}</Txt>} />
                <LineItem label="Sisa tagihan saat ini" value={<Money value={d.outstandingNow} />} />
              </View>
              {d.similarReferences.length ? <Txt variant="caption" tone="warnInk">{t('Ada referensi yang mirip: {0}. Mirip belum tentu penipuan; putuskan dengan alasan yang jelas.', [d.similarReferences.join(', ')])}</Txt> : null}
            </Card>
            {d.review ? (
              <>
                <SectionTitle title="Hasil pemeriksaan" />
                <Card>
                  <LineItem label="Pemeriksa" value={<Txt variant="bodySm">{d.review.byName}</Txt>} />
                  <LineItem label="Waktu" value={<Txt variant="bodySm">{formatDateTime(d.review.at)}</Txt>} />
                  {d.review.amountVerified ? <LineItem label="Jumlah diterima (demo)" value={<Money value={d.review.amountVerified} tone="okInk" />} /> : null}
                  {d.review.custody ? <LineItem label="Uang dipegang oleh" value={<Txt variant="bodySm">{d.review.custody === 'driver_demo' ? 'Dipegang sopir' : 'Diterima operator'}</Txt>} /> : null}
                  <Txt variant="bodySm" tone="inkSecondary">{d.review.reason}</Txt>
                </Card>
              </>
            ) : null}
            {d.blockedReason ? <Txt variant="bodySm" tone="warnInk" style={{ marginTop: space.md, fontWeight: '600' }}>{d.blockedReason}</Txt> : null}
            {!staff && (d.status === 'pending_review' || d.status === 'flagged_review') ? (
              <Txt variant="bodySm" tone="inkSecondary" style={{ marginTop: space.md }}>Bukti Anda sedang menunggu dicek operator. Tagihan belum dianggap lunas sebelum dicek.</Txt>
            ) : null}
            {staff && d.status === 'verified' ? <Button label="Batalkan verifikasi (koreksi)" variant="danger" icon="undo-variant" onPress={() => { setMode('reverse'); setReason(''); setErr(null); }} style={{ marginTop: space.xxl }} /> : null}
            <Button label="Buka invoice" variant="quiet" onPress={() => router.push(`/invoice/${d.invoiceId}`)} style={{ marginTop: space.md, alignSelf: 'flex-start' }} />
          </>
        )}
      </QueryView>
      <BottomSheet
        visible={mode !== null}
        title={mode === 'verify' ? 'Cek & terima (demo)' : mode === 'reject' ? 'Tolak bukti' : 'Batalkan verifikasi'}
        onClose={() => setMode(null)}
        footer={<>{err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}<Button label={mode === 'verify' ? 'Catat penerimaan demo' : mode === 'reject' ? 'Tolak' : 'Buat pembalikan'} variant={mode === 'verify' ? 'primary' : 'danger'} loading={busy} onPress={() => void run()} /></>}
      >
        {mode === 'verify' && p ? (
          <>
            <MoneyField label="Jumlah yang benar-benar diterima (demo)" value={amount ?? parseMoneyString(p.amountClaimed)} onChange={setAmount} helper={t('Sisa tagihan {0}; kelebihannya dicatat sebagai kelebihan bayar.', [formatRupiah(p.outstandingNow)])} />
            <Choice label="Uang dipegang oleh" value={custody} onChange={setCustody} options={[{ value: 'operator_demo', label: 'Diterima operator' }, { value: 'driver_demo', label: 'Masih dipegang sopir (tunai)' }]} />
            <Field label="Alasan keputusan" value={reason} onChangeText={setReason} multiline placeholder={t('mis. cocok dengan catatan penerimaan demo')} />
            {p.similarReferences.length ? <Field label="Keputusan atas referensi mirip" value={dup} onChangeText={setDup} multiline /> : null}
          </>
        ) : (
          <Field label="Alasan" value={reason} onChangeText={setReason} multiline />
        )}
      </BottomSheet>
    </Screen>
  );
}
