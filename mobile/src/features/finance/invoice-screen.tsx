import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { radius, space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Choice, Field, MoneyField } from '@/components/ui/form';
import { LineItem, Money, Rule, SectionTitle, Serial, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { DocumentStack } from '@/components/business/document-stack';
import { Stamp } from '@/components/business/stamp';
import { InternalQr } from '@/components/business/internal-qr';
import { useApi, useSession } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { collectionStatus, invoiceStatus, paymentRequestStatus, proofStatus } from '@/core/i18n/status';
import { formatDateTime, formatLocalDate, formatShortDateTime, formatUntil } from '@/core/format/time';
import { formatRupiah, parseMoneyString } from '@/core/format/money';
import { useDemoNow } from '@/core/hooks/use-demo-now';
import { t } from '@/core/i18n';

type SheetK = 'request' | 'credit' | { refund: string } | null;

/**
 * Invoice jasa (PAY-01/09/10). Saldo dihitung dari ledger (alokasi/kredit/reversal); bukti yang menunggu
 * tidak mengubah sisa. Instruksi hanya rekening DEMO-NONPAYABLE; QR internal bukan QRIS.
 */
export function InvoiceScreen() {
  const color = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const qc = useQueryClient();
  const session = useSession();
  const now = useDemoNow();
  const staff = session?.view === 'owner' || session?.view === 'admin';
  const q = useTovvQuery(['invoice', id], (a) => a.getInvoice(id));
  const [sheet, setSheet] = useState<SheetK>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [hours, setHours] = useState('24');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const open = (s: SheetK, preset: number | null) => {
    setSheet(s);
    setAmount(preset);
    setReason('');
    setErr(null);
  };
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
  const outstanding = d ? parseMoneyString(d.outstanding) : 0;

  return (
    <Screen
      onRefresh={() => qc.invalidateQueries()}
      header={<DetailHeader title={d ? t('Invoice {0}', [d.alias]) : 'Invoice'} subtitle={d ? d.payerLabel : undefined} />}
      footer={
        d && d.allowedActions.includes('submit_proof') ? (
          <Button
            label={staff ? 'Catat bukti/tunai (dibantu petugas)' : 'Saya sudah bayar — kirim bukti'}
            icon="file-upload-outline"
            size="lg"
            accessibilityHint={t('Bukti bayar dicek petugas dulu; tagihan tidak langsung lunas.')}
            onPress={() => router.push(`/invoice/${id}/proof`)}
          />
        ) : null
      }
    >
      <QueryView q={q}>
        {(inv) => (
          <>
            <DocumentStack
              historyLabel="nota kredit"
              history={inv.credits.map((c) => (
                <Card key={c.id}>
                  <Serial>{c.id}</Serial>
                  <LineItem label={c.reason} hint={formatDateTime(c.postedAt)} value={<Money value={`-${c.amount}`} />} />
                </Card>
              ))}
            >
              <View style={styles.head}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Serial>{inv.number}</Serial>
                  <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
                    <StatusTag look={invoiceStatus[inv.status]} size="sm" />
                    <StatusTag look={collectionStatus[inv.collection]} size="sm" />
                  </View>
                </View>
                {inv.collection === 'settled' ? <Stamp label="DITERIMA (DEMO)" tone="ok" detail={inv.fullyCredited ? 'dikreditkan penuh' : 'bukan bukti bank'} /> : null}
              </View>
              <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.sm }}>{t('Diterbitkan {0} · dokumen DEMO, bukan faktur pajak', [inv.operatorName])}</Txt>
              <View style={styles.dates}>
                <View style={{ flex: 1 }}><Txt variant="label" tone="inkSecondary">Terbit</Txt><Txt variant="bodySm">{formatDateTime(inv.issuedAt)}</Txt></View>
                <View style={{ flex: 1 }}><Txt variant="label" tone="inkSecondary">Jatuh tempo</Txt><Txt variant="bodySm" tone={inv.overdueDays ? 'dangerInk' : 'ink'}>{`${formatLocalDate(inv.dueDate)}${inv.overdueDays ? t(' · lewat {0} hari', [inv.overdueDays]) : ''}`}</Txt></View>
              </View>
              <Rule />
              {inv.items.map((it) => <LineItem key={it.label} label={it.label} value={<Money value={it.amount} />} />)}
              <Rule />
              <LineItem label="Subtotal" value={<Money value={inv.gross} />} />
              {inv.credits.length ? <LineItem label="Kredit" value={<Money value={`-${inv.credits.reduce((s, c) => s + Number(c.amount), 0)}`} />} /> : null}
              <LineItem label="Total tagihan" hint="Setelah nota kredit, bila ada" value={<Money value={inv.net} />} />
              <LineItem label="Sudah dibayar (demo)" value={<Money value={inv.allocated} tone="okInk" />} />
              <Rule strong />
              <LineItem label="Sisa tagihan" emphasis value={<Money value={inv.outstanding} size="lg" tone={outstanding ? 'ink' : 'okInk'} />} />
            </DocumentStack>

            <SectionTitle title="Instruksi pembayaran (DEMO)" />
            <Card style={{ backgroundColor: color.demoWash, borderColor: color.demoRule }}>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Icon name="bank-off-outline" tone="demoInk" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong" tone="demoInk">{inv.instruction.account}</Txt>
                  <Txt variant="bodySm" tone="demoInk">{t('{0} · versi {1}', [inv.instruction.payeeLabel, inv.instruction.version])}</Txt>
                  <Txt variant="caption" tone="demoInk">Ini bukan rekening asli. Jangan transfer uang. Tidak ada gateway, QRIS live, atau pengecekan bank otomatis.</Txt>
                </View>
              </View>
            </Card>

            <SectionTitle title="Permintaan pembayaran" count={inv.paymentRequests.length} action={staff && inv.allowedActions.includes('create_payment_request') ? <Button label="Buat" variant="quiet" compact icon="plus" onPress={() => open('request', outstanding)} /> : null} />
            {inv.paymentRequests.length ? (
              <View style={{ gap: space.sm }}>
                {inv.paymentRequests.map((pr) => (
                  <Card key={pr.id}>
                    <View style={styles.head}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Serial>{pr.reference}</Serial>
                        <StatusTag look={paymentRequestStatus[pr.status]} size="sm" />
                      </View>
                      <Money value={pr.requestedAmount} />
                    </View>
                    <Txt variant="caption" tone="inkSecondary" style={{ marginTop: 4 }}>
                      {t('Sisa saat dibuat {0} · {1}. Status permintaan ini tidak membuktikan uangnya ada atau tidak.', [formatRupiah(pr.outstandingSnapshot), pr.status === 'active' ? `berlaku ${formatUntil(pr.expiresAt, now)}` : `berakhir ${formatShortDateTime(pr.expiresAt)}`])}
                    </Txt>
                    {pr.status === 'active' ? <View style={{ marginTop: space.md, alignItems: 'center' }}><InternalQr uri={pr.deepLink} /></View> : null}
                  </Card>
                ))}
              </View>
            ) : (
              <Card><Txt variant="bodySm" tone="inkSecondary">Belum ada permintaan pembayaran.</Txt></Card>
            )}

            <SectionTitle title="Bukti pembayaran" count={inv.proofs.length} />
            <Card padded={false}>
              {inv.proofs.length ? inv.proofs.map((p, i) => (
                <Pressable key={p.id} onPress={() => router.push(`/proof/${p.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.row, i < inv.proofs.length - 1 && styles.divider, pressed && { backgroundColor: color.accentSoft }]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt variant="bodyStrong">{`${p.referenceClaimed} · ${p.method === 'cash_demo' ? 'tunai (demo)' : 'transfer (demo)'}`}</Txt>
                    <StatusTag look={proofStatus[p.status]} size="sm" />
                    <Txt variant="caption" tone="inkSecondary">{t('Diajukan {0} · {1}', [p.submittedByName, formatShortDateTime(p.receivedAt)])}</Txt>
                  </View>
                  <Money value={p.amountClaimed} size="sm" />
                  <Icon name="chevron-right" tone="inkSecondary" />
                </Pressable>
              )) : <View style={{ padding: space.lg }}><Txt variant="bodySm" tone="inkSecondary">Belum ada bukti yang dikirim.</Txt></View>}
            </Card>

            {inv.receipts.length ? (
              <>
                <SectionTitle title="Penerimaan tercatat (demo)" count={inv.receipts.length} />
                <View style={{ gap: space.sm }}>
                  {inv.receipts.map((r) => (
                    <Card key={r.id}>
                      <View style={styles.head}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Serial>{r.id}</Serial>
                          <Txt variant="caption" tone="inkSecondary">{`${formatDateTime(r.postedAt)} · ${r.method === 'cash_demo' ? 'tunai' : 'transfer'} · ${r.custody === 'driver_demo' ? 'dana masih di driver' : 'diterima operator'} · ${r.verifiedByName}`}</Txt>
                        </View>
                        <Money value={r.amount} />
                      </View>
                      {r.unapplied !== '0' ? <LineItem label="Kelebihan bayar" hint="Lebih dari tagihan; menunggu keputusan dikembalikan atau dipakai untuk tagihan lain" value={<Money value={r.unapplied} tone="warnInk" />} /> : null}
                      {r.refunds.map((f, i) => <LineItem key={i} label="Refund tercatat (demo)" hint={f.recordedAt ? formatShortDateTime(f.recordedAt) : f.status} value={<Money value={`-${f.amount}`} />} />)}
                      {staff && r.unapplied !== '0' ? <Button label="Catat refund demo" variant="secondary" compact onPress={() => open({ refund: r.id }, parseMoneyString(r.unapplied))} style={{ alignSelf: 'flex-start', marginTop: space.sm }} /> : null}
                    </Card>
                  ))}
                </View>
              </>
            ) : null}

            {staff && inv.allowedActions.includes('credit_note') ? <Button label="Buat nota kredit / koreksi" variant="secondary" icon="file-replace-outline" onPress={() => open('credit', null)} style={{ marginTop: space.xxl }} /> : null}
          </>
        )}
      </QueryView>

      <BottomSheet
        visible={sheet !== null}
        title={sheet === 'request' ? 'Permintaan pembayaran' : sheet === 'credit' ? 'Nota kredit' : 'Refund demo'}
        onClose={() => setSheet(null)}
        footer={
          <>
            {err ? <Txt variant="bodySm" tone="dangerInk" accessibilityLiveRegion="polite">{err}</Txt> : null}
            <Button
              label={sheet === 'request' ? 'Buat permintaan' : sheet === 'credit' ? 'Posting kredit' : 'Catat refund'}
              loading={busy}
              onPress={() =>
                void run(
                  () =>
                    sheet === 'request'
                      ? api.createPaymentRequest(id, amount ?? 0, Number(hours))
                      : sheet === 'credit'
                        ? api.addCreditNote(id, amount ?? 0, reason)
                        : api.recordRefund((sheet as { refund: string }).refund, amount ?? 0, reason),
                  sheet === 'request'
                    ? d?.paymentRequests.some((pr) => pr.status === 'active') ? 'Permintaan baru aktif; permintaan sebelumnya diganti.' : 'Permintaan pembayaran aktif dibuat.'
                    : sheet === 'credit' ? 'Kredit dicatat; kelebihan alokasi dibalik otomatis.' : 'Refund dicatat sebagai keputusan demo; tidak ada transfer.',
                )
              }
            />
          </>
        }
      >
        {sheet === 'request' ? (
          <>
            <MoneyField label="Nominal diminta" value={amount} onChange={setAmount} helper={t('Maksimal sisa tagihan {0}. Boleh dibayar sebagian.', [formatRupiah(outstanding)])} />
            <Choice label="Berlaku" value={hours} onChange={setHours} options={[{ value: '4', label: '4 jam' }, { value: '24', label: '24 jam (default demo)' }, { value: '72', label: '72 jam' }]} />
          </>
        ) : (
          <>
            <MoneyField label="Nominal" value={amount} onChange={setAmount} />
            <Field label="Alasan" value={reason} onChangeText={setReason} multiline />
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}

const useStyles = makeStyles((color) => ({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  dates: { flexDirection: 'row', gap: space.md, marginVertical: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.line },
  radius: { borderRadius: radius.lg },
}));
