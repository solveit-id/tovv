import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader, RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Choice } from '@/components/ui/form';
import { Cell, CellGrid, LineItem, Money, Rule, SectionTitle, Sheet } from '@/components/ui/nota';
import { QueryView } from '@/components/ui/states';
import { useApi } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { executionStatus, requestStatus } from '@/core/i18n/status';
import { formatDateTime, formatLocalDate } from '@/core/format/time';
import { formatPercent, formatRupiah } from '@/core/format/money';

const AGING: Record<string, string> = { current: 'Belum jatuh tempo', '1-30': 'Lewat 1–30 hari', '31-60': 'Lewat 31–60 hari', '61+': 'Lewat >60 hari', unknown: 'Jatuh tempo tidak diketahui' };

/**
 * Laporan pemilik/finance (ANA-01–04, FIN-06, RPT-02). Semua angka dari baris transaksi demo yang sama dengan
 * dashboard; kas ≠ invoice ≠ kontribusi; biaya hilang tidak dihitung nol; tidak ada klaim ROI.
 */
export function ReportsScreen({ asTab = false }: { asTab?: boolean }) {
  const router = useRouter();
  const api = useApi();
  const toast = useToast();
  const qc = useQueryClient();
  const [account, setAccount] = useState<string>('all');
  const accounts = useTovvQuery(['business-accounts'], (a) => a.listBusinessAccounts());
  const q = useTovvQuery(['analytics', account], (a) => a.getAnalytics(account === 'all' ? null : account));
  const [exporting, setExporting] = useState<string | null>(null);

  const doExport = async (template: 'REP-05' | 'REP-06' | 'REP-07') => {
    setExporting(template);
    try {
      const r = await api.exportCsv(template, account === 'all' ? (template === 'REP-07' ? (accounts.data?.[0]?.id ?? null) : null) : account);
      const f = new File(Paths.cache, r.fileName);
      if (f.exists) f.delete();
      f.create();
      f.write(r.content);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(f.uri, { mimeType: 'text/csv', dialogTitle: r.fileName, UTI: 'public.comma-separated-values-text' });
        toast.show(`${r.template}: ${r.rows} baris, berlabel DEMO dengan metadata cutoff.`, 'ok');
      } else {
        toast.show(`CSV dibuat (${r.rows} baris) di cache aplikasi; berbagi file tidak tersedia di perangkat ini.`, 'info');
      }
    } catch (e) {
      toast.show(errorMessage(e), 'danger');
    } finally {
      setExporting(null);
    }
  };

  const header = asTab ? <RootHeader title="Keuangan" subtitle="Penerimaan, piutang, kontribusi — DEMO" /> : <DetailHeader title="Laporan" subtitle="Dihitung dari transaksi demo" />;

  return (
    <Screen headerScrolls={asTab} onRefresh={() => qc.invalidateQueries()} header={header}>
      <Choice
        label="Filter akun bisnis"
        value={account}
        onChange={setAccount}
        options={[{ value: 'all', label: 'Semua pelanggan' }, ...(accounts.data ?? []).map((b) => ({ value: b.id, label: b.name, hint: `${b.alias} · ${b.poRequired ? 'PO wajib' : 'PO opsional'}` }))]}
      />
      <QueryView q={q} loadingLabel="Menghitung dari ledger…">
        {(a) => (
          <>
            <Txt variant="caption" tone="inkSecondary">{`${a.periodLabel} · as of ${formatDateTime(a.asOf)} · formula ${a.formulaVersion} · zona Asia/Jakarta`}</Txt>
            <SectionTitle title="Uang (demo)" />
            <CellGrid>
              {a.money.map((m) => (
                <Cell key={m.key} label={m.label}>
                  <Money value={m.amount} align="left" />
                  <Txt variant="caption" tone="inkSecondary">{m.hint}</Txt>
                </Cell>
              ))}
            </CellGrid>

            <SectionTitle title="Kontribusi per pekerjaan selesai" />
            <Sheet padded={false}>
              <View style={[styles.tr, styles.th]}>
                <Txt variant="label" tone="inkSecondary" style={styles.c1}>Order</Txt>
                <Txt variant="label" tone="inkSecondary" style={styles.cN}>Komersial</Txt>
                <Txt variant="label" tone="inkSecondary" style={styles.cN}>D aktual</Txt>
                <Txt variant="label" tone="inkSecondary" style={styles.cN}>Kontribusi</Txt>
              </View>
              {a.contributions.map((c) => (
                <Pressable key={c.orderId} onPress={() => router.push(`/order/${c.orderId}`)} accessibilityRole="button" accessibilityLabel={`${c.alias}: kontribusi ${c.contribution ? formatRupiah(c.contribution) : `belum final, ${c.reason}`}`} style={({ pressed }) => [styles.tr, pressed && { backgroundColor: color.carbonTint }]}>
                  <Txt variant="serial" tone="serial" style={styles.c1}>{c.alias}</Txt>
                  <Txt variant="bodySm" tabular align="right" style={styles.cN}>{formatRupiah(c.commercialNet).replace('Rp ', '')}</Txt>
                  <Txt variant="bodySm" tabular align="right" tone={c.actualDirect ? 'ink' : 'warnInk'} style={styles.cN}>{c.actualDirect ? formatRupiah(c.actualDirect).replace('Rp ', '') : '—'}</Txt>
                  <Txt variant="bodySm" tabular align="right" tone={c.contribution ? 'ink' : 'warnInk'} style={[styles.cN, { fontWeight: '700' }]}>{c.contribution ? formatRupiah(c.contribution).replace('Rp ', '') : 'provisional'}</Txt>
                </Pressable>
              ))}
              <Rule strong />
              <View style={styles.tr}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>{`Final ${a.contribution.coverage} pekerjaan`}</Txt>
                <Money value={a.contribution.final} />
              </View>
            </Sheet>
            <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.xs }}>Angka dalam rupiah. Kontribusi = komersial − D aktual − biaya SaaS per layanan. Bukan laba bersih; provisional tidak dijumlah sebagai nol.</Txt>

            <SectionTitle title="Estimasi vs aktual (biaya langsung)" />
            <Sheet>
              <LineItem label="Estimasi (pasangan lengkap)" value={<Money value={a.variance.estimate} />} />
              <LineItem label="Aktual disetujui" value={<Money value={a.variance.actual} />} />
              <LineItem label="Selisih" hint={`Cakupan ${a.variance.coverage} pekerjaan selesai`} emphasis value={<Money value={a.variance.delta} tone="warnInk" />} />
            </Sheet>

            <SectionTitle title="Piutang" />
            <Sheet padded={false}>
              {a.receivables.length ? a.receivables.map((r) => (
                <Pressable key={r.invoiceId} onPress={() => router.push(`/invoice/${r.invoiceId}`)} accessibilityRole="button" style={({ pressed }) => [styles.tr, pressed && { backgroundColor: color.carbonTint }]}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="serial" tone="serial">{r.number}</Txt>
                    <Txt variant="caption" tone="inkSecondary">{`${r.alias} · ${r.payer} · jatuh tempo ${formatLocalDate(r.dueDate)}${r.overdueDays ? ` · lewat ${r.overdueDays} hari` : ''}`}</Txt>
                  </View>
                  <Money value={r.outstanding} />
                  <Icon name="chevron-right" tone="inkSecondary" />
                </Pressable>
              )) : <View style={{ padding: space.lg }}><Txt variant="bodySm" tone="inkSecondary">Tidak ada piutang.</Txt></View>}
            </Sheet>
            <View style={{ marginTop: space.sm }}>
              {a.receivableAging.map((g) => <LineItem key={g.bucket} label={AGING[g.bucket] ?? g.bucket} value={<Money value={g.amount} />} />)}
            </View>

            <SectionTitle title="Permintaan & order" />
            <Sheet>
              <LineItem label="Konversi penawaran" hint={`${a.conversion.numerator} disetujui dari ${a.conversion.denominator} permintaan yang pernah ditawar`} value={<Txt variant="figure">{formatPercent(a.conversion.value)}</Txt>} />
              <Rule />
              {a.requestsByStatus.map((s) => <LineItem key={s.status} label={`Permintaan · ${requestStatus[s.status].label}`} value={<Txt variant="figure">{String(s.count)}</Txt>} />)}
              <Rule />
              {a.ordersByStatus.map((s) => <LineItem key={s.status} label={`Order · ${executionStatus[s.status].label}`} value={<Txt variant="figure">{String(s.count)}</Txt>} />)}
              <Rule />
              <LineItem label="Bermasalah (kendala dibuka)" hint="Dapat tumpang tindih dengan selesai; bukan partisi" value={<Txt variant="figure">{String(a.counts.problematic)}</Txt>} />
            </Sheet>

            <SectionTitle title="Kelengkapan data (M-12)" />
            <Sheet>
              {a.completeness.map((c) => <LineItem key={c.label} label={c.label} value={<Txt variant="figure">{`${c.numerator}/${c.denominator}`}</Txt>} />)}
            </Sheet>

            {a.byAccount.length ? (
              <>
                <SectionTitle title="Per akun bisnis" />
                <Sheet padded={false}>
                  {a.byAccount.map((b) => (
                    <View key={b.accountId ?? 'all'} style={[styles.tr, { flexWrap: 'wrap' }]}>
                      <View style={{ flex: 1, minWidth: 160 }}>
                        <Txt variant="bodyStrong">{b.label}</Txt>
                        <Txt variant="caption" tone="inkSecondary">{`${b.orders} order · piutang ${formatRupiah(b.receivable)}${b.provisional ? ` · ${b.provisional} provisional` : ''}`}</Txt>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Txt variant="caption" tone="inkSecondary">Kontribusi final</Txt>
                        <Money value={b.contribution} size="sm" missingLabel="belum ada final" />
                      </View>
                    </View>
                  ))}
                </Sheet>
              </>
            ) : null}

            <SectionTitle title="Ekspor DEMO" />
            <View style={{ gap: space.sm }}>
              <Button label="REP-05 CSV biaya & kontribusi" icon="file-delimited-outline" variant="secondary" loading={exporting === 'REP-05'} onPress={() => void doExport('REP-05')} />
              <Button label="REP-06 CSV piutang" icon="file-delimited-outline" variant="secondary" loading={exporting === 'REP-06'} onPress={() => void doExport('REP-06')} />
              <Button label="REP-07 CSV layanan B2B" icon="file-delimited-outline" variant="secondary" loading={exporting === 'REP-07'} onPress={() => void doExport('REP-07')} />
              <Txt variant="caption" tone="inkSecondary">CSV memuat label DEMO, cutoff, zona, filter dan versi formula; awalan = + - @ di-escape. PDF REP-01–04 dibuat server pada tahap backend (T-30); dokumen invoice/receipt dapat dilihat di layar invoice.</Txt>
            </View>
          </>
        )}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tr: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  th: { backgroundColor: color.sheetSunk },
  c1: { width: 52 },
  cN: { flex: 1, textAlign: 'right' },
});
