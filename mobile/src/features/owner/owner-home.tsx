import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card, Money, SectionTitle } from '@/components/ui/surface';
import { CountUpMoney, HeroCard, HeroStats, ShortcutGrid } from '@/components/ui/summary';
import { QueryView, EmptyBlock, SkeletonBar } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { useApiState } from '@/data/api/provider';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';
import { useDemoNow } from '@/core/hooks/use-demo-now';
import { formatDate, formatDateTime } from '@/core/format/time';
import { firstName } from '@/core/format/name';


/**
 * Beranda owner: ringkasan uang di kartu yang menimpa header, pintasan kerja,
 * lalu yang tertahan hari ini dan pekerjaan berjalan.
 */
export function OwnerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const { switchView } = useApiState();
  const now = useDemoNow();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const summary = useTovvQuery(['owner-summary'], (api) => api.getOwnerSummary());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const s = session.data;
  const canDrive = s?.views.includes('driver');
  const myDrive = active.data?.find((o) => o.driverName === s?.userName && o.status !== 'handed_over');
  const money = (key: string) => summary.data?.money.find((m) => m.key === key);

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader overlap right={<HeaderActions />} title={s ? `Halo, ${firstName(s.userName)}` : undefined} subtitle={s ? `${s.tenantName} · ${formatDate(now)}` : undefined} />
      }
      fab={{ label: 'Catat permintaan', icon: 'phone-plus', onPress: () => router.push('/request/new'), accessibilityHint: 'Catat permintaan dari telepon atau chat pelanggan' }}
    >
      <HeroCard onPress={() => router.push({ pathname: '/reports', params: { focus: 'receivable' } })} accessibilityLabel="Buka laporan keuangan">
        <QueryView q={summary} skeletonRows={1}>
          {(sum) => {
            const receivable = money('receivable');
            return (
              <>
                <View style={{ gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Txt variant="label" tone="inkSecondary" style={{ flex: 1 }}>Belum dibayar pelanggan</Txt>
                    <Icon name="chevron-right" size={18} tone="inkMuted" />
                  </View>
                  {receivable ? <CountUpMoney value={receivable.amount} /> : <SkeletonBar width="60%" height={32} />}
                  <Txt variant="caption" tone="inkSecondary">{`${sum.periodLabel} · diperbarui ${formatDateTime(sum.asOf)}`}</Txt>
                </View>
                <HeroStats
                  items={[
                    { label: 'Uang diterima', value: <Money value={money('receipts')?.amount ?? null} align="left" tone="okInk" /> },
                    { label: 'Kontribusi final', value: <Money value={sum.contribution.final} align="left" /> },
                  ]}
                />
              </>
            );
          }}
        </QueryView>
      </HeroCard>

      <ShortcutGrid
        items={[
          { key: 'price', label: 'Hitung harga', icon: 'calculator-variant-outline', onPress: () => router.push('/pricing'), tone: 'okInk', wash: 'okWash' },
          { key: 'work', label: 'Pekerjaan', icon: 'clipboard-list-outline', onPress: () => router.push('/owner/pekerjaan'), tone: 'warnInk', wash: 'warnWash', badge: active.data?.length },
          { key: 'fleet', label: 'Armada', icon: 'tow-truck', onPress: () => router.push('/fleet'), tone: 'neutralInk', wash: 'neutralWash' },
          canDrive
            ? { key: 'drive', label: myDrive ? `Mode driver · ${myDrive.alias}` : 'Mode driver', icon: 'steering', onPress: () => void switchView('driver').then(() => router.replace('/driver')) }
            : { key: 'rep', label: 'Laporan', icon: 'chart-box-outline', onPress: () => router.push('/reports') },
        ]}
      />

      <DailyActionsBlock limit={3} />

      <SectionTitle title="Pekerjaan berjalan" count={active.data?.length} action={<Button label="Semua" variant="quiet" compact onPress={() => router.push('/owner/pekerjaan')} />} />
      <QueryView q={active}>
        {(list) =>
          list.length ? (
            list.slice(0, 4).map((o, i) => <OrderRow key={o.id} o={o} index={i} />)
          ) : (
            <Card>
              <EmptyBlock icon="tow-truck" title="Tidak ada pekerjaan berjalan" body="Pekerjaan muncul di sini setelah penawaran disetujui pelanggan." />
            </Card>
          )
        }
      </QueryView>

      {summary.data?.contribution.provisionalAliases.length ? (
        <Card tone="warn" style={{ marginTop: space.sm }}>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Icon name="progress-alert" size={20} tone="warnInk" />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong" tone="warnInk">Kontribusi masih sementara</Txt>
              <Txt variant="bodySm" tone="ink">
                {`Biaya ${summary.data.contribution.provisionalAliases.join(', ')} belum lengkap, jadi belum ikut dihitung (tidak dianggap nol). Kontribusi bukan laba bersih.`}
              </Txt>
            </View>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
