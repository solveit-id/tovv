import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { radius, space } from '@/core/design/tokens';
import { ThemeModeScope, makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card, Money, SectionTitle } from '@/components/ui/surface';
import { CountUpMoney, HeroCard, HeroStats, ShortcutGrid } from '@/components/ui/summary';
import { QueryView, EmptyBlock, LoadingBlock } from '@/components/ui/states';
import { useDeferred } from '@/core/hooks/use-deferred';
import { TowTruckArt } from '@/components/brand/tow-truck';
import { useTovvQuery } from '@/data/api/hooks';
import type { OrderSummary } from '@/data/api/contract';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { useModeSwitch } from '@/features/home/use-mode-switch';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';
import { useDemoNow } from '@/core/hooks/use-demo-now';
import { formatDate, formatDateTime } from '@/core/format/time';
import { firstName } from '@/core/format/name';
import { t } from '@/core/i18n';

/**
 * Kartu pindah ke mode driver: memakai warna mode driver (biru-arang + kuning) sebagai pratinjau,
 * supaya owner tahu persis tampilan apa yang akan dibuka.
 */
function DriveModeCard({ job, onPress }: { job: OrderSummary | undefined; onPress: () => void }) {
  return (
    <ThemeModeScope mode="field">
      <DriveModeCardBody job={job} onPress={onPress} />
    </ThemeModeScope>
  );
}

function DriveModeCardBody({ job, onPress }: { job: OrderSummary | undefined; onPress: () => void }) {
  const s = useStyles();
  return (
    <View style={s.drive}>
      <View style={s.driveText}>
        <View style={s.driveChip}>
          <Icon name="steering" size={14} tone="onModeAccent" />
          <Txt variant="caption" tone="onModeAccent" bold>Mode driver</Txt>
        </View>
        <Txt variant="titleSm" tone="onHero">{job ? t('Anda yang menyetir {0}', [job.alias]) : 'Mau berangkat sendiri?'}</Txt>
        <Txt variant="bodySm" tone="onHeroSecondary" numberOfLines={3}>
          {job ? t('{0} → {1}. Buka mode driver untuk langkah berikutnya.', [job.pickup.label, job.dropoff.label]) : 'Lihat tugas, buka navigasi, dan ambil foto bukti dari mode driver.'}
        </Txt>
        <Button label="Masuk mode driver" variant="mode" icon="arrow-right" compact onPress={onPress} style={{ alignSelf: 'flex-start', marginTop: space.xs }} />
      </View>
      <View style={s.driveArt} pointerEvents="none">
        <TowTruckArt width={150} loaded={!!job} />
      </View>
    </View>
  );
}

/**
 * Beranda owner: ringkasan uang di kartu yang menimpa header, pintasan kerja, pintu ke mode driver,
 * lalu yang tertahan hari ini dan pekerjaan yang sedang jalan.
 */
export function OwnerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const switchMode = useModeSwitch();
  const now = useDemoNow();
  const later = useDeferred();
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
        <RootHeader
          overlap
          right={<HeaderActions />}
          title={s ? t('Halo, {0}', [firstName(s.userName)]) : undefined}
          subtitle={s ? `${s.tenantName} · ${formatDate(now)}` : undefined}
          chip={canDrive ? { icon: 'briefcase-outline', label: 'Mode owner' } : undefined}
        />
      }
      fab={{ label: 'Catat permintaan', icon: 'phone-plus', onPress: () => router.push('/request/new'), accessibilityHint: 'Catat permintaan dari telepon atau chat pelanggan' }}
    >
      <HeroCard onPress={() => router.push({ pathname: '/reports', params: { focus: 'receivable' } })} accessibilityLabel={t('Buka laporan keuangan')}>
        <QueryView q={summary} skeleton="hero" loadingLabel="Menghitung ringkasan uang…">
          {(sum) => {
            const receivable = money('receivable');
            return (
              <>
                <View style={{ gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Txt variant="label" tone="inkSecondary" style={{ flex: 1 }}>Belum dibayar pelanggan</Txt>
                    <Icon name="chevron-right" size={18} tone="inkMuted" />
                  </View>
                  <CountUpMoney value={receivable?.amount ?? null} missingLabel="belum ada data" />
                  <Txt variant="caption" tone="inkSecondary">{t('{0} · diperbarui {1}', [sum.periodLabel, formatDateTime(sum.asOf)])}</Txt>
                </View>
                <HeroStats
                  items={[
                    { label: 'Uang masuk', value: <Money value={money('receipts')?.amount ?? null} align="left" tone="okInk" /> },
                    { label: 'Kontribusi yang sudah pasti', value: <Money value={sum.contribution.final} align="left" /> },
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
          { key: 'work', label: 'Pekerjaan', icon: 'clipboard-list-outline', onPress: () => router.push('/owner/jobs'), tone: 'warnInk', wash: 'warnWash', badge: active.data?.length },
          { key: 'fleet', label: 'Armada', icon: 'tow-truck', onPress: () => router.push('/fleet'), tone: 'neutralInk', wash: 'neutralWash' },
          { key: 'rep', label: 'Laporan', icon: 'chart-box-outline', onPress: () => router.push('/reports') },
        ]}
      />

      {canDrive ? <DriveModeCard job={myDrive} onPress={() => void switchMode('driver')} /> : null}

      {later ? <DailyActionsBlock limit={3} /> : <LoadingBlock kind="action" rows={2} />}

      <SectionTitle title="Pekerjaan yang sedang jalan" count={active.data?.length} action={<Button label="Semua" variant="quiet" compact onPress={() => router.push('/owner/jobs')} />} />
      <QueryView q={active} ready={later} skeleton="order" skeletonRows={2}>
        {(list) =>
          list.length ? (
            list.slice(0, 4).map((o, i) => <OrderRow key={o.id} o={o} index={i} />)
          ) : (
            <Card>
              <EmptyBlock art="truck" title="Belum ada pekerjaan yang jalan" body="Pekerjaan muncul di sini setelah pelanggan menyetujui harga." />
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
                {t('Biaya {0} belum lengkap, jadi belum ikut dihitung. Kontribusi juga belum dipotong biaya kantor, jadi bukan laba bersih.', [summary.data.contribution.provisionalAliases.join(', ')])}
              </Txt>
            </View>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  drive: { marginTop: space.xl, borderRadius: radius.xl, backgroundColor: c.heroTo, padding: space.lg, flexDirection: 'row', overflow: 'hidden', minHeight: 150 },
  driveText: { flex: 1, gap: space.xs, paddingRight: 96, zIndex: 1 },
  driveChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: c.modeAccent, marginBottom: 2 },
  driveArt: { position: 'absolute', right: -34, bottom: 6, opacity: 0.95 },
}));
