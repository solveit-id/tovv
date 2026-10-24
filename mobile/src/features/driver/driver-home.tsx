import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SectionTitle, Card } from '@/components/ui/surface';
import { HeroCard } from '@/components/ui/summary';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, LoadingBlock, QueryView } from '@/components/ui/states';
import { RouteRail } from '@/components/business/route-rail';
import { useTovvQuery } from '@/data/api/hooks';
import { useModeSwitch } from '@/features/home/use-mode-switch';
import type { OrderSummary } from '@/data/api/contract';
import { OrderRow } from '@/features/orders/order-row';
import { EtaStrip } from '@/features/home/eta-strip';
import { useDeferred } from '@/core/hooks/use-deferred';
import { HeaderActions } from '@/features/home/header-actions';
import { executionStatus } from '@/core/i18n/status';
import { formatShortDateTime } from '@/core/format/time';
import { firstName } from '@/core/format/name';
import { t } from '@/core/i18n';

/** Sebelum muat, sopir menuju titik jemput; setelahnya menuju tujuan. */
function navTarget(o: OrderSummary) {
  return ['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup'].includes(o.status) ? o.pickup : o.dropoff;
}

function openNavigation(o: OrderSummary) {
  const p = navTarget(o);
  if (p.lat === null || p.lng === null) return;
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${p.lat},${p.lng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
  });
  void Linking.openURL(url);
}

/**
 * Beranda mode driver (palet lapangan: biru-arang + kuning). Tugas terdekat menguasai kartu atas dengan
 * satu tombol besar untuk langkah berikutnya, lalu navigasi, ringkasan hari ini, tawaran, dan riwayat.
 * Tanpa harga atau margin.
 */
export function DriverHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const s = useStyles();
  const switchMode = useModeSwitch();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const history = useTovvQuery(['orders', 'history'], (api) => api.listOrders('history'));
  const outbox = useTovvQuery(['outbox'], (api) => api.listOutbox());
  const pending = outbox.data?.filter((x) => x.status === 'pending').length ?? 0;
  const me = session.data;
  const lead = active.data?.[0];
  const isOwner = me?.views.includes('owner');
  const target = lead ? navTarget(lead) : null;
  const [allHistory, setAllHistory] = useState(false);
  const later = useDeferred();

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader
          overlap
          title={me ? t('Halo, {0}', [firstName(me.userName)]) : 'Tugas saya'}
          subtitle={me?.tenantName}
          chip={{ icon: 'steering', label: 'Mode driver' }}
          right={<HeaderActions />}
        >
          {isOwner ? (
            <Button variant="onHero" compact icon="briefcase-outline" label="Kembali ke mode owner" style={{ alignSelf: 'flex-start' }} accessibilityHint={t('Menu owner seperti keuangan dan armada aktif lagi.')} onPress={() => void switchMode('owner')} />
          ) : null}
        </RootHeader>
      }
    >
      <HeroCard>
        {active.isPending ? (
          <LoadingBlock kind="hero" label="Mencari tugas Anda…" />
        ) : lead ? (
          <>
            <View style={s.leadHead}>
              <Txt variant="label" tone="inkSecondary" style={{ flex: 1 }}>Tugas sekarang</Txt>
              <StatusTag look={executionStatus[lead.status]} size="sm" />
            </View>
            <View style={{ gap: 2 }}>
              <Txt variant="title">{lead.alias}</Txt>
              <Txt variant="bodySm" tone="inkSecondary">{`${lead.vehicleLabel} · ${lead.plate}`}</Txt>
            </View>
            <EtaStrip orderId={lead.id} status={lead.status} />
            <RouteRail pickup={lead.pickup} dropoff={lead.dropoff} detailed />
            <View style={s.meta}>
              <Icon name="clock-outline" size={15} tone="inkSecondary" />
              <Txt variant="caption" tone="inkSecondary" style={{ flex: 1 }}>{t('Jadwal {0} · unit {1}', [formatShortDateTime(lead.scheduleStart), lead.unitCode])}</Txt>
            </View>
            <Button label={lead.nextStep} variant="mode" icon="arrow-right-circle" size="lg" onPress={() => router.push(`/order/${lead.id}`)} />
            <View style={s.row}>
              <Button label="Lihat di peta" variant="secondary" icon="map-outline" compact style={{ flex: 1 }} onPress={() => router.push('/driver/map')} />
              {target && target.lat !== null ? (
                <Button label="Navigasi" variant="secondary" icon="navigation-variant-outline" compact style={{ flex: 1 }} onPress={() => openNavigation(lead)} />
              ) : null}
            </View>
          </>
        ) : (
          <EmptyBlock art="truck" title="Belum ada tugas" body="Tawaran tugas baru akan muncul di sini dan di kotak masuk." />
        )}
      </HeroCard>

      <View style={s.safety} accessibilityRole="text">
        <Icon name="car-brake-alert" size={20} tone="warnInk" />
        <Txt variant="bodySm" tone="warnInk" bold style={{ flex: 1 }}>Isi aplikasi hanya saat kendaraan berhenti.</Txt>
      </View>

      {pending ? (
        <Card tone="warn" style={{ marginTop: space.md }} onPress={() => router.push('/driver/sync')} accessibilityLabel={t('Kirim {0} catatan yang tertunda', [pending])}>
          <View style={s.pendingRow}>
            <Icon name="cloud-upload-outline" size={22} tone="warnInk" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" tone="warnInk">{t('{0} catatan belum terkirim', [pending])}</Txt>
              <Txt variant="caption">Tersimpan aman di HP. Ketuk untuk mengirim saat sinyal bagus.</Txt>
            </View>
            <Icon name="chevron-right" size={20} tone="warnInk" />
          </View>
        </Card>
      ) : null}

      {active.data && active.data.length > 1 ? (
        <>
          <SectionTitle title="Tugas lain dan tawaran" count={active.data.length - 1} />
          {active.data.slice(1).map((o, i) => <OrderRow key={o.id} o={o} index={i} />)}
        </>
      ) : null}

      <SectionTitle title="Riwayat" count={history.data?.length} />
      <QueryView q={history} ready={later} skeleton="order" skeletonRows={2}>
        {(list) =>
          list.length ? (
            <>
              {(allHistory ? list : list.slice(0, 3)).map((o, i) => <OrderRow key={o.id} o={o} index={i} />)}
              {list.length > 3 ? <Button label={allHistory ? 'Tampilkan lebih sedikit' : t('Lihat {0} lainnya', [list.length - 3])} variant="secondary" icon={allHistory ? 'chevron-up' : 'chevron-down'} onPress={() => setAllHistory((v) => !v)} /> : null}
            </>
          ) : (
            <Card>
              <EmptyBlock icon="history" title="Belum ada riwayat" body="Tugas yang sudah diserahkan akan tercatat di sini." />
            </Card>
          )
        }
      </QueryView>
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  leadHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', gap: space.sm },
  safety: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg, paddingHorizontal: space.md, paddingVertical: space.md, borderRadius: radius.lg, backgroundColor: c.warnWash },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
}));
