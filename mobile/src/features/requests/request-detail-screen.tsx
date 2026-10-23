import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Field, Toggle } from '@/components/ui/form';
import { LineItem, SectionTitle, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView, EmptyBlock } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PhotoTile } from '@/components/business/photo-tile';
import { useApi, useSession } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { channelLabel, requestStatus, timingLabel } from '@/core/i18n/status';
import { formatDateTime, formatShortDateTime } from '@/core/format/time';
import { formatNumber, formatRupiah } from '@/core/format/money';
import { QuoteStack } from '@/features/quotes/quote-doc-view';
import { useDemoNow } from '@/core/hooks/use-demo-now';
import { t } from '@/core/i18n';

/** Detail permintaan: kelengkapan data, tarif yang berlaku, foto kondisi, dan tumpukan versi penawaran. */
export function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const qc = useQueryClient();
  const session = useSession();
  const now = useDemoNow();
  const q = useTovvQuery(['request', id], (a) => a.getRequest(id));
  const [sheet, setSheet] = useState<'review' | 'cancel' | null>(null);
  const [w, setW] = useState('');
  const [l, setL] = useState('');
  const [wd, setWd] = useState('');
  const [imm, setImm] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      toast.show(ok, 'ok');
      setSheet(null);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const d = q.data;
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const latest = d?.quotes[0];
  let footer: React.ReactNode = null;
  if (d) {
    if (d.orderId) footer = <Button label="Buka order" icon="tow-truck" size="lg" onPress={() => router.push(`/order/${d.orderId}`)} />;
    else if (d.allowedActions.includes('submit_draft')) footer = <Button label="Kirim permintaan" icon="send-outline" size="lg" loading={busy} onPress={() => void run(() => api.submitDraft(id), 'Permintaan dikirim ke operator.')} />;
    else if (d.allowedActions.includes('mark_ready')) footer = <Button label="Lengkapi data kendaraan" icon="clipboard-edit-outline" size="lg" onPress={() => setSheet('review')} />;
    else if (d.allowedActions.includes('quote')) footer = <Button label={latest ? t('Buat penawaran v{0}', [latest.version + 1]) : 'Susun penawaran'} variant={latest?.status === 'sent' ? 'secondary' : 'primary'} icon="file-document-edit-outline" size="lg" onPress={() => router.push(`/request/${id}/quote`)} />;
    else if (!staff && latest?.allowedActions.includes('accept')) footer = <Button label="Tinjau penawaran" icon="file-check-outline" size="lg" onPress={() => router.push(`/quote/${latest.id}`)} />;
  }

  return (
    <Screen
      onRefresh={() => qc.invalidateQueries()}
      header={<DetailHeader serial={d ? t('Permintaan {0}', [d.alias]) : undefined} title={d?.customerLabel ?? 'Permintaan'} />}
      footer={footer}
    >
      <QueryView q={q}>
        {(r) => (
          <>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                <Txt variant="label" tone="inkSecondary">{t('Permintaan {0}', [r.alias])}</Txt>
                <Txt variant="caption" tone="inkSecondary">{channelLabel[r.channel]}</Txt>
              </View>
              <View style={{ marginTop: space.sm }}><StatusTag look={requestStatus[r.status]} /></View>
              {r.needsReviewReasons.length ? (
                <View style={{ marginTop: space.md, gap: 2 }}>
                  {r.needsReviewReasons.map((x) => <Txt key={x} variant="bodySm" tone="warnInk">{`• ${x}`}</Txt>)}
                </View>
              ) : null}
              <Txt variant="headline" style={{ marginTop: space.md }}>{`${r.vehicle.label} · ${r.vehicle.plate}`}</Txt>
              <Txt variant="bodySm" tone="inkSecondary">
                {`${r.vehicle.weightKg ? `${formatNumber(r.vehicle.weightKg)} kg` : 'berat belum diketahui'} · ${r.vehicle.lengthMm ? `${formatNumber(r.vehicle.lengthMm)}×${formatNumber(r.vehicle.widthMm ?? 0)} mm` : 'dimensi belum diketahui'} · ${r.vehicle.condition}`}
              </Txt>
              <View style={{ marginTop: space.md }}>
                <LineItem label="Jemput" hint={r.pickup.address} value={<Txt variant="bodySm">{r.pickup.label}</Txt>} />
                <LineItem label="Tujuan" hint={r.dropoff.address} value={<Txt variant="bodySm">{r.dropoff.label}</Txt>} />
                <LineItem label="Waktu" value={<Txt variant="bodySm">{`${timingLabel[r.timing.kind]} · ${r.timing.start ? formatShortDateTime(r.timing.start) : 'segera'}${r.timing.end ? `–${formatShortDateTime(r.timing.end)}` : ''}`}</Txt>} />
                <LineItem label="Pihak terkait" hint={t('Diserahkan oleh {0} · diterima oleh {1}', [r.parties.sender, r.parties.receiver])} value={<Txt variant="bodySm">{t('Bayar: {0}', [r.parties.payer])}</Txt>} />
                {r.businessAccount ? <LineItem label="Akun bisnis" hint={t('Syarat {0}{1}', [r.businessAccount.termsVersion, r.businessAccount.poRequired ? ' · PO wajib' : ''])} value={<Txt variant="bodySm">{r.poRef ?? 'PO belum ada'}</Txt>} /> : null}
                <LineItem label="Dicatat" value={<Txt variant="bodySm">{`${r.createdByName} · ${formatDateTime(r.createdAt)}`}</Txt>} />
              </View>
            </Card>

            {staff ? (
              <Card style={{ marginTop: space.md }}>
                <Txt variant="label" tone="inkSecondary">Tarif berlaku</Txt>
                <Txt variant="bodyStrong" tone={r.rate.source === 'account' ? 'okInk' : 'warnInk'}>{r.rate.amount ? formatRupiah(r.rate.amount) : '—'}</Txt>
                <Txt variant="bodySm" tone="inkSecondary">{r.rate.note}</Txt>
              </Card>
            ) : null}

            <SectionTitle title="Foto kondisi" />
            <Card>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
                {r.media.map((m) => <PhotoTile key={m.id} item={m} label={t('Kondisi · {0}', [m.slot])} />)}
                {r.allowedActions.includes('capture') ? (
                  <PhotoTile item={null} label="Tambah foto kondisi" onPress={() => router.push({ pathname: '/camera', params: { requestId: r.id, stage: 'request_condition', slot: `RC${r.media.length + 1}` } })} />
                ) : null}
              </View>
            </Card>

            <SectionTitle title="Penawaran" count={r.quotes.length} />
            {r.quotes.length ? (
              <>
                <QuoteStack quotes={r.quotes} now={now} />
                {!staff && latest?.allowedActions.includes('accept') ? <Button label="Tinjau dan putuskan" variant="secondary" onPress={() => router.push(`/quote/${latest.id}`)} style={{ marginTop: space.sm }} /> : null}
                {latest?.approvalNote ? <Txt variant="bodySm" tone="warnInk" style={{ marginTop: space.sm }}>{latest.approvalNote}</Txt> : null}
              </>
            ) : (
              <Card><EmptyBlock icon="file-outline" title="Belum ada penawaran" body={staff ? 'Lengkapi datanya lalu susun penawaran. Penawaran belum memesan unit.' : 'Operator akan mengecek data lalu mengirim penawaran harga.'} /></Card>
            )}

            {r.allowedActions.includes('cancel') ? <Button label="Batalkan permintaan" variant="danger" icon="cancel" onPress={() => setSheet('cancel')} style={{ marginTop: space.xxl }} /> : null}
          </>
        )}
      </QueryView>

      <BottomSheet
        visible={sheet === 'review'}
        title="Lengkapi data kendaraan"
        onClose={() => setSheet(null)}
        footer={<>{err ? <Txt variant="bodySm" tone="dangerInk">{err}</Txt> : null}<Button label="Simpan & siap diberi harga" loading={busy} onPress={() => void run(() => api.completeReview(id, { weightKg: Number(w) || 0, lengthMm: Number(l) || 0, widthMm: Number(wd) || 0, immediateConfirmed: imm }), 'Data lengkap; permintaan siap ditawar.')} /></>}
      >
        <Txt variant="bodySm" tone="inkSecondary" style={{ marginBottom: space.md }}>Isi dari sumber yang jelas (STNK, konfirmasi pemilik). Jangan menebak.</Txt>
        <Field label="Berat (kg)" value={w} onChangeText={setW} keyboardType="number-pad" />
        <Field label="Panjang (mm)" value={l} onChangeText={setL} keyboardType="number-pad" />
        <Field label="Lebar (mm)" value={wd} onChangeText={setWd} keyboardType="number-pad" />
        {d?.timing.kind === 'immediate' ? <Toggle label="Unit sanggup datang segera" value={imm} onChange={setImm} /> : null}
      </BottomSheet>
      <BottomSheet
        visible={sheet === 'cancel'}
        title="Batalkan permintaan"
        onClose={() => setSheet(null)}
        footer={<>{err ? <Txt variant="bodySm" tone="dangerInk">{err}</Txt> : null}<Button label="Batalkan" variant="danger" loading={busy} onPress={() => void run(() => api.cancelRequest(id, reason), 'Permintaan dibatalkan; tetap tercatat di riwayat.')} /></>}
      >
        <Field label="Alasan" value={reason} onChangeText={setReason} multiline />
      </BottomSheet>
    </Screen>
  );
}
