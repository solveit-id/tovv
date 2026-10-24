import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { DetailHeader, RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { LineItem, Money, SectionTitle, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import { useSession } from '@/data/api/provider';
import { expenseStatus } from '@/core/i18n/status';
import { formatShortDateTime } from '@/core/format/time';
import { t } from '@/core/i18n';
import { useDialog } from '@/components/feedback/dialog';
import { formatRupiah } from '@/core/format/money';

/**
 * Biaya aktual & uang jalan (FIN-01). Uang muka bukan biaya: advance 500.000, biaya 420.000, kembali 80.000
 * menghasilkan biaya 420.000 saja. Driver melihat biaya sendiri; finance menyetujui.
 */
export function ExpensesScreen({ asTab = false }: { asTab?: boolean }) {
  const styles = useStyles();
  const router = useRouter();
  const qc = useQueryClient();
  const session = useSession();
  const approver = session?.view === 'owner' || session?.view === 'admin';
  const ex = useTovvQuery(['expenses'], (a) => a.listExpenses());
  const adv = useTovvQuery(['advances'], (a) => a.listAdvances());
  const sess = useTovvQuery(['session'], (a) => a.getSession());
  const canApprove = sess.data?.scopes.includes('expense.approve');
  const dialog = useDialog();
  const decide = useTovvMutation((a, v: { id: string; ok: boolean }) => a.decideExpense(v.id, v.ok), { success: (r) => t('Keputusan disimpan ({0} biaya).', [r.length]) });
  return (
    <Screen headerScrolls={asTab} onRefresh={() => qc.invalidateQueries()} header={asTab ? <RootHeader title="Biaya & uang jalan" subtitle="Catat waktu berhenti; foto nota bisa menyusul." /> : <DetailHeader title="Biaya & uang jalan" />}>
      <SectionTitle title="Uang jalan" />
      <QueryView q={adv}>
        {(list) =>
          list.length ? (
            <View style={{ gap: space.sm }}>
              {list.map((a) => (
                <Card key={a.id}>
                  <Txt variant="bodyStrong">{`${a.alias} · ${a.driverName}`}</Txt>
                  <LineItem label="Uang muka" value={<Money value={a.amount} />} />
                  <LineItem label="Dipakai untuk biaya yang disetujui" value={<Money value={a.spent} />} />
                  <LineItem label="Dikembalikan" value={<Money value={a.returned} />} />
                  <LineItem label="Sisa yang harus dipertanggungjawabkan" emphasis value={<Money value={a.outstanding} tone={a.outstanding === '0' ? 'okInk' : 'warnInk'} />} />
                  <Txt variant="caption" tone="inkSecondary">{a.settled ? 'Selesai: uang muka tidak dihitung sebagai biaya.' : 'Belum diselesaikan.'}</Txt>
                </Card>
              ))}
            </View>
          ) : <EmptyBlock icon="cash" title="Tidak ada uang jalan" />
        }
      </QueryView>
      <SectionTitle title="Biaya aktual" count={ex.data?.length} />
      <Card padded={false}>
        <QueryView q={ex}>
          {(list) =>
            list.length ? list.map((e, i) => (
              <View key={e.id} style={[styles.row, i < list.length - 1 && styles.divider]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="bodyStrong">{`${e.alias} · ${e.category}`}</Txt>
                  <StatusTag look={e.source === 'local_pending' ? { label: 'Tersimpan di HP, belum terkirim', tone: 'warn', line: 'dashed', icon: 'cloud-upload-outline' } : expenseStatus[e.status]} size="sm" />
                  <Txt variant="caption" tone="inkSecondary">{`${e.submittedByName} · ${formatShortDateTime(e.submittedAt)}${e.note ? ` · ${e.note}` : ''}`}</Txt>
                  {approver && canApprove && e.status === 'submitted' && e.source === 'server' ? (
                    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: 4 }}>
                      <Button label="Tolak" variant="danger" compact onPress={() => void dialog.confirm({ title: 'Tolak biaya ini?', message: t('{0} · {1}', [e.category, formatRupiah(e.amount)]), icon: 'close-circle-outline', tone: 'danger', confirmLabel: 'Tolak biaya' }).then((ok) => (ok ? decide.mutate({ id: e.id, ok: false }) : undefined))} />
                      <Button label="Setujui" compact onPress={() => void dialog.confirm({ title: 'Setujui biaya ini?', message: t('{0} · {1}', [e.category, formatRupiah(e.amount)]), points: ['Masuk ke biaya pekerjaan dan hitungan kontribusi'], icon: 'cash-check', tone: 'ok', confirmLabel: 'Setujui biaya' }).then((ok) => (ok ? decide.mutate({ id: e.id, ok: true }) : undefined))} />
                    </View>
                  ) : null}
                </View>
                <Money value={e.amount} size="sm" />
              </View>
            )) : <EmptyBlock icon="receipt" title="Belum ada biaya" />
          }
        </QueryView>
      </Card>
      {!approver ? <Button label="Catat biaya dari tugas yang sedang jalan" variant="secondary" icon="plus" onPress={() => router.push('/driver')} style={{ marginTop: space.md }} /> : null}
    </Screen>
  );
}

const useStyles = makeStyles((color) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.line },
}));
