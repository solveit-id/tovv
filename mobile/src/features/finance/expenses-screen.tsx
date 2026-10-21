import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { DetailHeader, RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { LineItem, Money, SectionTitle, Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvMutation, useTovvQuery } from '@/data/api/hooks';
import { useSession } from '@/data/api/provider';
import { expenseStatus } from '@/core/i18n/status';
import { formatShortDateTime } from '@/core/format/time';

/**
 * Biaya aktual & uang jalan (FIN-01). Uang muka bukan biaya: advance 500.000, biaya 420.000, kembali 80.000
 * menghasilkan biaya 420.000 saja. Driver melihat biaya sendiri; finance menyetujui.
 */
export function ExpensesScreen({ asTab = false }: { asTab?: boolean }) {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useSession();
  const approver = session?.view === 'owner' || session?.view === 'admin';
  const ex = useTovvQuery(['expenses'], (a) => a.listExpenses());
  const adv = useTovvQuery(['advances'], (a) => a.listAdvances());
  const sess = useTovvQuery(['session'], (a) => a.getSession());
  const canApprove = sess.data?.scopes.includes('expense.approve');
  const decide = useTovvMutation((a, v: { id: string; ok: boolean }) => a.decideExpense(v.id, v.ok), { success: (r) => `Keputusan tercatat (${r.length} biaya).` });
  return (
    <Screen onRefresh={() => qc.invalidateQueries()} header={asTab ? <RootHeader title="Biaya & uang jalan" subtitle="Catat saat berhenti; bukti nota menyusul" /> : <DetailHeader title="Biaya & uang jalan" />}>
      <SectionTitle title="Uang jalan" />
      <QueryView q={adv}>
        {(list) =>
          list.length ? (
            <View style={{ gap: space.sm }}>
              {list.map((a) => (
                <Sheet key={a.id}>
                  <Txt variant="bodyStrong">{`${a.alias} · ${a.driverName}`}</Txt>
                  <LineItem label="Uang muka" value={<Money value={a.amount} />} />
                  <LineItem label="Dipakai untuk biaya disetujui" value={<Money value={a.spent} />} />
                  <LineItem label="Dikembalikan" value={<Money value={a.returned} />} />
                  <LineItem label="Sisa dipertanggungjawabkan" emphasis value={<Money value={a.outstanding} tone={a.outstanding === '0' ? 'okInk' : 'warnInk'} />} />
                  <Txt variant="caption" tone="inkSecondary">{a.settled ? 'Selesai: uang muka tidak dihitung sebagai biaya.' : 'Belum diselesaikan.'}</Txt>
                </Sheet>
              ))}
            </View>
          ) : <EmptyBlock icon="cash" title="Tidak ada uang jalan" />
        }
      </QueryView>
      <SectionTitle title="Biaya aktual" count={ex.data?.length} />
      <Sheet padded={false}>
        <QueryView q={ex}>
          {(list) =>
            list.length ? list.map((e, i) => (
              <View key={e.id} style={[styles.row, i < list.length - 1 && styles.divider]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="bodyStrong">{`${e.alias} · ${e.category}`}</Txt>
                  <StatusTag look={e.source === 'local_pending' ? { label: 'Tersimpan di ponsel, belum terkirim', tone: 'warn', line: 'dashed', icon: 'cloud-upload-outline' } : expenseStatus[e.status]} size="sm" />
                  <Txt variant="caption" tone="inkSecondary">{`${e.submittedByName} · ${formatShortDateTime(e.submittedAt)}${e.note ? ` · ${e.note}` : ''}`}</Txt>
                  {approver && canApprove && e.status === 'submitted' && e.source === 'server' ? (
                    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: 4 }}>
                      <Button label="Tolak" variant="danger" compact onPress={() => decide.mutate({ id: e.id, ok: false })} />
                      <Button label="Setujui" compact onPress={() => decide.mutate({ id: e.id, ok: true })} />
                    </View>
                  ) : null}
                </View>
                <Money value={e.amount} size="sm" />
              </View>
            )) : <EmptyBlock icon="receipt" title="Belum ada biaya" />
          }
        </QueryView>
      </Sheet>
      {!approver ? <Button label="Catat biaya dari tugas aktif" variant="secondary" icon="plus" onPress={() => router.push('/driver')} style={{ marginTop: space.md }} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
});
