import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { color, radius, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Choice, Field, MoneyField } from '@/components/ui/form';
import { LineItem, Money, Rule, SectionTitle, Serial, Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { DocumentStack } from '@/components/nota/document-stack';
import { Stamp } from '@/components/nota/stamp';
import { InternalQr } from '@/components/nota/internal-qr';
import { useApi, useSession } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { collectionStatus, invoiceStatus, paymentRequestStatus, proofStatus } from '@/core/i18n/status';
import { formatDateTime, formatLocalDate, formatShortDateTime, formatUntil } from '@/core/format/time';
import { formatRupiah, parseMoneyString } from '@/core/format/money';
import { useDemoNow } from '@/core/hooks/use-demo-now';

type SheetK = 'request' | 'credit' | { refund: string } | null;

/**
 * Invoice jasa (PAY-01/09/10). Saldo dihitung dari ledger (alokasi/kredit/reversal); bukti yang menunggu
 * tidak mengubah sisa. Instruksi hanya rekening DEMO-NONPAYABLE; QR internal bukan QRIS.
 */
export function InvoiceScreen() {
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
      header={<DetailHeader serial={d?.number} title={d ? `Invoice ${d.alias}` : 'Invoice'} subtitle={d ? d.payerLabel : undefined} />}
      footer={
        d && d.allowedActions.includes('submit_proof') ? (
          <Button
            label={staff ? 'Catat bukti/tunai (dibantu)' : 'Saya sudah bayar — kirim bukti'}
            icon="file-upload-outline"
            size="lg"
            accessibilityHint="Bukti menunggu pemeriksaan petugas; tidak langsung melunasi."
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
                <Sheet key={c.id}>
                  <Serial>{c.id}</Serial>
                  <LineItem label={c.reason} hint={formatDateTime(c.postedAt)} value={<Money value={`-${c.amount}`} />} />
                </Sheet>
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
              <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.sm }}>{`Penerbit ${inv.operatorName} · dokumen DEMO, bukan faktur pajak`}</Txt>
              <View style={styles.dates}>
                <View style={{ flex: 1 }}><Txt variant="label" tone="inkSecondary">Terbit</Txt><Txt variant="bodySm">{formatDateTime(inv.issuedAt)}</Txt></View>
                <View style={{ flex: 1 }}><Txt variant="label" tone="inkSecondary">Jatuh tempo</Txt><Txt variant="bodySm" tone={inv.overdueDays ? 'dangerInk' : 'ink'}>{`${formatLocalDate(inv.dueDate)}${inv.overdueDays ? ` · lewat ${inv.overdueDays} hari` : ''}`}</Txt></View>
              </View>
              <Rule />
              {inv.items.map((it) => <LineItem key={it.label} label={it.label} value={<Money value={it.amount} />} />)}
              <Rule />
              <LineItem label="Bruto" value={<Money value={inv.gross} />} />
              {inv.credits.length ? <LineItem label="Kredit" value={<Money value={`-${inv.credits.reduce((s, c) => s + Number(c.amount), 0)}`} />} /> : null}
              <LineItem label="Net" value={<Money value={inv.net} />} />
              <LineItem label="Diterima & dialokasikan (demo)" value={<Money value={inv.allocated} tone="okInk" />} />
              <Rule strong />
              <LineItem label="Sisa tagihan" emphasis value={<Money value={inv.outstanding} size="lg" tone={outstanding ? 'ink' : 'okInk'} />} />
            </DocumentStack>

            <SectionTitle title="Instruksi pembayaran (DEMO)" />
            <Sheet style={{ backgroundColor: color.demoWash, borderColor: color.demoRule }}>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Icon name="bank-off-outline" tone="demoInk" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong" tone="demoInk">{inv.instruction.account}</Txt>
                  <Txt variant="bodySm" tone="demoInk">{`${inv.instruction.payeeLabel} · versi ${inv.instruction.version}`}</Txt>
                  <Txt variant="caption" tone="demoInk">Bukan rekening nyata. Jangan mentransfer uang. Tidak ada gateway, QRIS live, atau pemeriksaan bank otomatis.</Txt>
                </View>
              </View>
            </Sheet>

            <SectionTitle title="Permintaan pembayaran" count={inv.paymentRequests.length} action={staff && inv.allowedActions.includes('create_payment_request') ? <Button label="Buat" variant="quiet" compact icon="plus" onPress={() => open('request', outstanding)} /> : null} />
            {inv.paymentRequests.length ? (
              <View style={{ gap: space.sm }}>
                {inv.paymentRequests.map((pr) => (
                  <Sheet key={pr.id}>
                    <View style={styles.head}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Serial>{pr.reference}</Serial>
                        <StatusTag look={paymentRequestStatus[pr.status]} size="sm" />
                      </View>
                      <Money value={pr.requestedAmount} />
                    </View>
                    <Txt variant="caption" tone="inkSecondary" style={{ marginTop: 4 }}>
                      {`Sisa saat dibuat ${formatRupiah(pr.outstandingSnapshot)} · ${pr.status === 'active' ? `berlaku ${formatUntil(pr.expiresAt, now)}` : `berakhir ${formatShortDateTime(pr.expiresAt)}`}. Status permintaan tidak membuktikan ada/tidaknya dana.`}
                    </Txt>
                    {pr.status === 'active' ? <View style={{ marginTop: space.md, alignItems: 'center' }}><InternalQr uri={pr.deepLink} /></View> : null}
                  </Sheet>
                ))}
              </View>
            ) : (
              <Sheet><Txt variant="bodySm" tone="inkSecondary">Belum ada permintaan pembayaran.</Txt></Sheet>
            )}

            <SectionTitle title="Bukti pembayaran" count={inv.proofs.length} />
            <Sheet padded={false}>
              {inv.proofs.length ? inv.proofs.map((p, i) => (
                <Pressable key={p.id} onPress={() => router.push(`/proof/${p.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.row, i < inv.proofs.length - 1 && styles.divider, pressed && { backgroundColor: color.carbonTint }]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt variant="bodyStrong">{`${p.referenceClaimed} · ${p.method === 'cash_demo' ? 'tunai (demo)' : 'transfer (demo)'}`}</Txt>
                    <StatusTag look={proofStatus[p.status]} size="sm" />
                    <Txt variant="caption" tone="inkSecondary">{`Diajukan ${p.submittedByName} · ${formatShortDateTime(p.receivedAt)}`}</Txt>
                  </View>
                  <Money value={p.amountClaimed} size="sm" />
                  <Icon name="chevron-right" tone="inkSecondary" />
                </Pressable>
              )) : <View style={{ padding: space.lg }}><Txt variant="bodySm" tone="inkSecondary">Belum ada bukti diajukan.</Txt></View>}
            </Sheet>

            {inv.receipts.length ? (
              <>
                <SectionTitle title="Penerimaan tercatat (receipt demo)" count={inv.receipts.length} />
                <View style={{ gap: space.sm }}>
                  {inv.receipts.map((r) => (
                    <Sheet key={r.id}>
                      <View style={styles.head}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Serial>{r.id}</Serial>
                          <Txt variant="caption" tone="inkSecondary">{`${formatDateTime(r.postedAt)} · ${r.method === 'cash_demo' ? 'tunai' : 'transfer'} · custody ${r.custody === 'driver_demo' ? 'di driver' : 'diterima operator'} · ${r.verifiedByName}`}</Txt>
                        </View>
                        <Money value={r.amount} />
                      </View>
                      {r.unapplied !== '0' ? <LineItem label="Belum dialokasikan (unapplied)" hint="Lebih bayar menunggu keputusan; bukan dompet" value={<Money value={r.unapplied} tone="warnInk" />} /> : null}
                      {r.refunds.map((f, i) => <LineItem key={i} label="Refund tercatat (demo)" hint={f.recordedAt ? formatShortDateTime(f.recordedAt) : f.status} value={<Money value={`-${f.amount}`} />} />)}
                      {staff && r.unapplied !== '0' ? <Button label="Catat refund demo" variant="secondary" compact onPress={() => open({ refund: r.id }, parseMoneyString(r.unapplied))} style={{ alignSelf: 'flex-start', marginTop: space.sm }} /> : null}
                    </Sheet>
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
                    : sheet === 'credit' ? 'Kredit diposting; kelebihan alokasi direversal otomatis.' : 'Refund dicatat sebagai keputusan demo; tidak ada transfer.',
                )
              }
            />
          </>
        }
      >
        {sheet === 'request' ? (
          <>
            <MoneyField label="Nominal diminta" value={amount} onChange={setAmount} helper={`Maksimum sisa ${formatRupiah(outstanding)}. Boleh sebagian.`} />
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

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  dates: { flexDirection: 'row', gap: space.md, marginVertical: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  radius: { borderRadius: radius.sheet },
});
