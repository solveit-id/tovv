import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/form';
import { Money, Serial, Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { collectionStatus, proofStatus } from '@/core/i18n/status';
import { formatLocalDate, formatShortDateTime } from '@/core/format/time';

type Tab = 'proofs' | 'invoices' | 'all';

/**
 * Antrean finance: bukti menunggu pemeriksaan, invoice terbuka, dan semua invoice. Penagihan dan pemeriksaan
 * manual; tidak ada rekonsiliasi bank otomatis.
 */
export function FinanceQueueScreen({ title = 'Keuangan' }: { title?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('proofs');
  const proofs = useTovvQuery(['proofs', 'review'], (a) => a.listProofs('review'));
  const open = useTovvQuery(['invoices', 'open'], (a) => a.listInvoices('open'));
  const all = useTovvQuery(['invoices', 'all'], (a) => a.listInvoices('all'));
  return (
    <Screen
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader title={title} subtitle="Pemeriksaan manual · DEMO nonpayable">
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button variant="onNavy" icon="cash-check" label="Biaya & uang jalan" compact onPress={() => router.push('/finance/expenses')} style={{ flex: 1 }} />
            <Button variant="onNavy" icon="chart-box-outline" label="Laporan" compact onPress={() => router.push('/reports')} style={{ flex: 1 }} />
          </View>
        </RootHeader>
      }
    >
      <Segmented value={tab} onChange={setTab} options={[{ value: 'proofs', label: 'Bukti', count: proofs.data?.length }, { value: 'invoices', label: 'Terbuka', count: open.data?.length }, { value: 'all', label: 'Semua', count: all.data?.length }]} />
      <Sheet padded={false}>
        {tab === 'proofs' ? (
          <QueryView q={proofs}>
            {(list) =>
              list.length ? list.map((p, i) => (
                <Pressable key={p.id} onPress={() => router.push(`/proof/${p.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.row, i < list.length - 1 && styles.divider, pressed && { backgroundColor: color.carbonTint }]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Serial>{`${p.alias} · ${p.invoiceNumber}`}</Serial>
                    <StatusTag look={proofStatus[p.status]} size="sm" />
                    {p.flagReason ? <Txt variant="caption" tone="warnInk">{p.flagReason}</Txt> : null}
                    <Txt variant="caption" tone="inkSecondary">{`${p.submittedByName} · ${formatShortDateTime(p.receivedAt)} · ${p.referenceClaimed}`}</Txt>
                  </View>
                  <Money value={p.amountClaimed} size="sm" />
                  <Icon name="chevron-right" tone="inkSecondary" />
                </Pressable>
              )) : <EmptyBlock icon="file-check-outline" title="Tidak ada bukti menunggu" body="Bukti baru dari pelanggan atau pencatatan dibantu muncul di sini." />
            }
          </QueryView>
        ) : (
          <QueryView q={tab === 'invoices' ? open : all}>
            {(list) =>
              list.length ? list.map((inv, i) => (
                <Pressable key={inv.id} onPress={() => router.push(`/invoice/${inv.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.row, i < list.length - 1 && styles.divider, pressed && { backgroundColor: color.carbonTint }]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Serial>{inv.number}</Serial>
                    <StatusTag look={collectionStatus[inv.collection]} size="sm" />
                    <Txt variant="caption" tone={inv.overdueDays ? 'dangerInk' : 'inkSecondary'}>{`${inv.alias} · ${inv.payerLabel} · jatuh tempo ${formatLocalDate(inv.dueDate)}${inv.overdueDays ? ` · lewat ${inv.overdueDays} hari` : ''}`}</Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="caption" tone="inkSecondary">Sisa</Txt>
                    <Money value={inv.outstanding} size="sm" />
                  </View>
                  <Icon name="chevron-right" tone="inkSecondary" />
                </Pressable>
              )) : <EmptyBlock icon="file-document-outline" title="Tidak ada invoice" />
            }
          </QueryView>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
});
