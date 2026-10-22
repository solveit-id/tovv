import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Cell, CellGrid, Money, SectionTitle, Sheet } from '@/components/ui/nota';
import { QueryView, EmptyBlock } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { useApiState } from '@/data/api/provider';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';
import { useDemoNow } from '@/core/hooks/use-demo-now';
import { formatDateTime } from '@/core/format/time';
import { formatRupiah } from '@/core/format/money';

/** Beranda owner: yang tertahan hari ini lebih dulu, lalu buku operasi dari ledger, lalu pekerjaan berjalan; aksi utama di footer (Hitung harga di tab Lainnya). */
export function OwnerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const { switchView } = useApiState();
  const now = useDemoNow();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const summary = useTovvQuery(['owner-summary'], (api) => api.getOwnerSummary());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const canDrive = session.data?.views.includes('driver');
  const myDrive = active.data?.find((o) => o.driverName === session.data?.userName && o.status !== 'handed_over');

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      footer={<Button label="Catat permintaan" icon="phone-plus-outline" onPress={() => router.push('/request/new')} accessibilityHint="Hitung harga tersedia di tab Lainnya" />}
      header={
        <RootHeader right={<HeaderActions />} subtitle={`${session.data?.tenantName ?? ''} · ${formatDateTime(now)}`}>
          {canDrive ? (
            <Button
              variant="onNavy"
              icon="steering"
              label={myDrive ? `Masuk mode driver · ${myDrive.alias} ${myDrive.status === 'in_transit' ? 'dalam perjalanan' : 'aktif'}` : 'Masuk mode driver'}
              accessibilityHint="Mode driver hanya membuka tugas Anda; izin owner tidak ikut."
              onPress={() => {
                void switchView('driver').then(() => router.replace('/driver'));
              }}
            />
          ) : null}
        </RootHeader>
      }
    >
      <DailyActionsBlock limit={3} />

      <SectionTitle title="Buku operasi" action={<Button label="Laporan" variant="quiet" compact icon="chart-box-outline" onPress={() => router.push('/reports')} />} />
      <QueryView q={summary}>
        {(s) => (
          <View style={{ gap: space.sm }}>
            <CellGrid>
              {s.money.map((m) => (
                <Cell key={m.key} label={m.label} onPress={() => router.push({ pathname: '/reports', params: { focus: m.key } })} accessibilityLabel={`${m.label} ${formatRupiah(m.amount)}. ${m.hint}`}>
                  <Money value={m.amount} align="left" />
                  <Txt variant="caption" tone="inkSecondary" numberOfLines={3}>{m.hint}</Txt>
                </Cell>
              ))}
              <Cell label="Kontribusi final — bukan laba bersih" wide onPress={() => router.push({ pathname: '/reports', params: { focus: 'contribution' } })}>
                <View style={styles.contrib}>
                  <Money value={s.contribution.final} size="lg" align="left" />
                  <Txt variant="bodySm" tone="inkSecondary" style={{ flex: 1 }}>
                    {`dari ${s.contribution.coverage} pekerjaan selesai`}
                  </Txt>
                </View>
                {s.contribution.provisionalAliases.length ? (
                  <Txt variant="caption" tone="warnInk">
                    {`Sementara (biaya belum lengkap, tidak dihitung nol): ${s.contribution.provisionalAliases.join(', ')}`}
                  </Txt>
                ) : null}
              </Cell>
            </CellGrid>
            <Txt variant="caption" tone="inkSecondary">
              {`${s.periodLabel} · per ${formatDateTime(s.asOf)} · formula ${s.formulaVersion} · dihitung dari baris transaksi demo yang sama dengan laporan.`}
            </Txt>
          </View>
        )}
      </QueryView>

      <SectionTitle
        title="Pekerjaan berjalan"
        count={active.data?.length}
        action={<Button label="Semua" variant="quiet" compact onPress={() => router.push('/owner/pekerjaan')} />}
      />
      <Sheet padded={false}>
        <QueryView q={active}>
          {(list) =>
            list.length ? (
              list.slice(0, 4).map((o, i, arr) => <OrderRow key={o.id} o={o} last={i === arr.length - 1} />)
            ) : (
              <EmptyBlock icon="tow-truck" title="Tidak ada pekerjaan berjalan" />
            )
          }
        </QueryView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contrib: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
});
