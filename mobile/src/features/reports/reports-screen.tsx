import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader, RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ChipRow } from '@/components/ui/form';
import { CountUpMoney } from '@/components/ui/summary';
import { LineItem, Money, Rule, SectionTitle, Card } from '@/components/ui/surface';
import { QueryView } from '@/components/ui/states';
import { useApi } from '@/data/api/provider';
import { errorMessage, useTovvQuery } from '@/data/api/hooks';
import { useToast } from '@/components/feedback/toast';
import { executionStatus, requestStatus } from '@/core/i18n/status';
import { formatDateTime, formatLocalDate } from '@/core/format/time';
import { formatPercent, formatRupiah } from '@/core/format/money';
import { t } from '@/core/i18n';

const AGING: Record<string, string> = { current: 'Belum jatuh tempo', '1-30': 'Lewat 1–30 hari', '31-60': 'Lewat 31–60 hari', '61+': 'Lewat >60 hari', unknown: 'Jatuh tempo tidak diketahui' };

/**
 * Laporan pemilik/finance (ANA-01–04, FIN-06, RPT-02). Semua angka dari baris transaksi demo yang sama dengan
 * dashboard; kas ≠ invoice ≠ kontribusi; biaya hilang tidak dihitung nol; tidak ada klaim ROI.
 */
export function ReportsScreen({ asTab = false }: { asTab?: boolean }) {
  const color = useColors();
  const styles = useStyles();
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
        toast.show(t('{0}: {1} baris, berlabel DEMO dengan metadata cutoff.', [r.template, r.rows]), 'ok');
      } else {
        toast.show(t('CSV dibuat ({0} baris) di cache aplikasi; fitur berbagi file tidak tersedia di perangkat ini.', [r.rows]), 'info');
      }
    } catch (e) {
      toast.show(errorMessage(e), 'danger');
    } finally {
      setExporting(null);
    }
  };

  const header = asTab ? <RootHeader title="Keuangan" subtitle="Uang masuk, tagihan, kontribusi — DEMO" /> : <DetailHeader title="Laporan" subtitle="Dihitung dari transaksi demo" />;

  return (
    <Screen headerScrolls={asTab} onRefresh={() => qc.invalidateQueries()} header={header}>
      <ChipRow
        label="Tampilkan untuk pelanggan"
        value={account}
        onChange={setAccount}
        options={[{ value: 'all', label: 'Semua pelanggan' }, ...(accounts.data ?? []).map((b) => ({ value: b.id, label: b.name }))]}
      />
      <QueryView q={q} loadingLabel="Menghitung dari transaksi…">
        {(a) => (
          <>
            <Card style={{ gap: space.md }}>
              <View style={{ gap: 2 }}>
                <Txt variant="label" tone="inkSecondary">Belum dibayar pelanggan</Txt>
                <CountUpMoney value={a.money.find((m) => m.key === 'receivable')?.amount ?? null} />
                <Txt variant="caption" tone="inkSecondary">{t('{0} · diperbarui {1} · simulasi', [a.periodLabel, formatDateTime(a.asOf)])}</Txt>
              </View>
              <Rule />
              {a.money.filter((m) => m.key !== 'receivable').map((m) => (
                <LineItem key={m.key} label={m.label} hint={m.hint} value={<Money value={m.amount} tone={m.key === 'receipts' ? 'okInk' : 'ink'} />} />
              ))}
            </Card>

            <SectionTitle title="Kontribusi per pekerjaan selesai" hint="Pendapatan pekerjaan dikurangi biaya langsung aktual. Bukan laba bersih." />
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <View style={[styles.tr, styles.th]}>
                <Txt variant="label" tone="inkSecondary" style={styles.c1}>Kode</Txt>
                <Txt variant="label" tone="inkSecondary" style={styles.cN}>Pendapatan</Txt>
                <Txt variant="label" tone="inkSecondary" style={styles.cN}>Biaya</Txt>
                <Txt variant="label" tone="inkSecondary" style={styles.cN}>Kontribusi</Txt>
              </View>
              {a.contributions.map((c) => (
                <Pressable key={c.orderId} onPress={() => router.push(`/order/${c.orderId}`)} accessibilityRole="button" accessibilityLabel={t('{0}: kontribusi {1}', [c.alias, c.contribution ? formatRupiah(c.contribution) : `belum final, ${c.reason}`])} style={({ pressed }) => [styles.tr, pressed && { backgroundColor: color.accentSoft }]}>
                  <Txt variant="mono" tone="inkSecondary" style={styles.c1}>{c.alias}</Txt>
                  <Txt variant="bodySm" tabular align="right" style={styles.cN}>{formatRupiah(c.commercialNet).replace('Rp ', '')}</Txt>
                  <Txt variant="bodySm" tabular align="right" tone={c.actualDirect ? 'ink' : 'warnInk'} style={styles.cN}>{c.actualDirect ? formatRupiah(c.actualDirect).replace('Rp ', '') : '—'}</Txt>
                  <Txt variant="bodySm" tabular align="right" tone={c.contribution ? 'ink' : 'warnInk'} style={[styles.cN, { fontWeight: '700' }]}>{c.contribution ? formatRupiah(c.contribution).replace('Rp ', '') : 'sementara'}</Txt>
                </Pressable>
              ))}
              <Rule strong />
              <View style={styles.tr}>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>{t('Final {0} pekerjaan', [a.contribution.coverage])}</Txt>
                <Money value={a.contribution.final} />
              </View>
            </Card>
            <Txt variant="caption" tone="inkSecondary" style={{ marginTop: space.xs }}>Angka dalam rupiah. Kontribusi = pendapatan pekerjaan − biaya langsung aktual − biaya layanan Tovv. Bukan laba bersih; yang masih sementara tidak dihitung sebagai nol.</Txt>

            <SectionTitle title="Perkiraan vs aktual (biaya langsung)" />
            <Card>
              <LineItem label="Perkiraan (data lengkap)" value={<Money value={a.variance.estimate} />} />
              <LineItem label="Aktual disetujui" value={<Money value={a.variance.actual} />} />
              <LineItem label="Selisih" hint={t('Cakupan {0} pekerjaan selesai', [a.variance.coverage])} emphasis value={<Money value={a.variance.delta} tone="warnInk" />} />
            </Card>

            <SectionTitle title="Belum dibayar" />
            <Card padded={false}>
              {a.receivables.length ? a.receivables.map((r) => (
                <Pressable key={r.invoiceId} onPress={() => router.push(`/invoice/${r.invoiceId}`)} accessibilityRole="button" style={({ pressed }) => [styles.tr, pressed && { backgroundColor: color.accentSoft }]}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="mono" tone="inkSecondary">{r.number}</Txt>
                    <Txt variant="caption" tone="inkSecondary">{t('{0} · {1} · jatuh tempo {2}{3}', [r.alias, r.payer, formatLocalDate(r.dueDate), r.overdueDays ? ` · lewat ${r.overdueDays} hari` : ''])}</Txt>
                  </View>
                  <Money value={r.outstanding} />
                  <Icon name="chevron-right" tone="inkSecondary" />
                </Pressable>
              )) : <View style={{ padding: space.lg }}><Txt variant="bodySm" tone="inkSecondary">Tidak ada tagihan yang belum dibayar.</Txt></View>}
            </Card>
            <View style={{ marginTop: space.sm }}>
              {a.receivableAging.map((g) => <LineItem key={g.bucket} label={AGING[g.bucket] ?? g.bucket} value={<Money value={g.amount} />} />)}
            </View>

            <SectionTitle title="Permintaan & order" />
            <Card>
              <LineItem label="Konversi penawaran" hint={t('{0} disetujui dari {1} permintaan yang pernah ditawar', [a.conversion.numerator, a.conversion.denominator])} value={<Txt variant="figure">{formatPercent(a.conversion.value)}</Txt>} />
              <Rule />
              {a.requestsByStatus.map((s) => <LineItem key={s.status} label={t('Permintaan · {0}', [requestStatus[s.status].label])} value={<Txt variant="figure">{String(s.count)}</Txt>} />)}
              <Rule />
              {a.ordersByStatus.map((s) => <LineItem key={s.status} label={t('Order · {0}', [executionStatus[s.status].label])} value={<Txt variant="figure">{String(s.count)}</Txt>} />)}
              <Rule />
              <LineItem label="Bermasalah (ada kendala terbuka)" hint="Bisa juga termasuk yang selesai; bukan pembagian terpisah" value={<Txt variant="figure">{String(a.counts.problematic)}</Txt>} />
            </Card>

            <SectionTitle title="Kelengkapan data (M-12)" />
            <Card>
              {a.completeness.map((c) => <LineItem key={c.label} label={c.label} value={<Txt variant="figure">{`${c.numerator}/${c.denominator}`}</Txt>} />)}
            </Card>

            {a.byAccount.length ? (
              <>
                <SectionTitle title="Per akun bisnis" />
                <Card padded={false}>
                  {a.byAccount.map((b) => (
                    <View key={b.accountId ?? 'all'} style={[styles.tr, { flexWrap: 'wrap' }]}>
                      <View style={{ flex: 1, minWidth: 160 }}>
                        <Txt variant="bodyStrong">{b.label}</Txt>
                        <Txt variant="caption" tone="inkSecondary">{t('{0} order · belum dibayar {1}{2}', [b.orders, formatRupiah(b.receivable), b.provisional ? ` · ${b.provisional} sementara` : ''])}</Txt>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Txt variant="caption" tone="inkSecondary">Kontribusi final</Txt>
                        <Money value={b.contribution} size="sm" missingLabel="belum ada final" />
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            <SectionTitle title="Ekspor DEMO" />
            <View style={{ gap: space.sm }}>
              <Button label="Unduh CSV biaya & kontribusi" icon="file-delimited-outline" variant="secondary" loading={exporting === 'REP-05'} onPress={() => void doExport('REP-05')} />
              <Button label="Unduh CSV tagihan belum dibayar" icon="file-delimited-outline" variant="secondary" loading={exporting === 'REP-06'} onPress={() => void doExport('REP-06')} />
              <Button label="Unduh CSV layanan pelanggan bisnis" icon="file-delimited-outline" variant="secondary" loading={exporting === 'REP-07'} onPress={() => void doExport('REP-07')} />
              <Txt variant="caption" tone="inkSecondary">File CSV berisi label DEMO, periode, filter, dan zona waktu. Laporan PDF dibuat server di tahap backend; invoice dan tanda terima bisa dilihat di layar invoice.</Txt>
            </View>
          </>
        )}
      </QueryView>
    </Screen>
  );
}

const useStyles = makeStyles((color) => ({
  tr: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.line },
  th: { backgroundColor: color.surfaceAlt },
  c1: { width: 52 },
  cN: { flex: 1, textAlign: 'right' },
}));
