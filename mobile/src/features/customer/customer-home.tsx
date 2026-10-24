import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { radius, space, cardChrome } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionTitle, Card } from '@/components/ui/surface';
import { HeroCard } from '@/components/ui/summary';
import { StatusTag } from '@/components/ui/status-tag';
import { QueryView } from '@/components/ui/states';
import { RouteRail } from '@/components/business/route-rail';
import { useTovvQuery } from '@/data/api/hooks';
import type { OrderSummary, ServicePackageDTO } from '@/data/api/contract';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { EtaStrip } from '@/features/home/eta-strip';
import { OrderRow } from '@/features/orders/order-row';
import { ServiceTile } from '@/features/services/service-card';
import { executionStatus } from '@/core/i18n/status';
import { firstName } from '@/core/format/name';
import { useDeferred } from '@/core/hooks/use-deferred';
import { t } from '@/core/i18n';

const B2B_ROLE: Record<string, string> = { requester: 'pemesan', approver: 'penyetuju', finance: 'keuangan', receiver: 'penerima' };

/** Pesanan yang sedang jalan, disorot: status, perkiraan tiba, rute, dan satu tombol lacak. */
function ActiveOrderCard({ o, service }: { o: OrderSummary; service: ServicePackageDTO | undefined }) {
  const s = useStyles();
  const router = useRouter();
  return (
    <View style={s.active}>
      <View style={s.activeHead}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="label" tone="inkSecondary">{t('Pesanan {0}{1}', [o.alias, service ? ` · ${service.name}` : ''])}</Txt>
          <Txt variant="titleSm" numberOfLines={2}>{`${o.vehicleLabel} · ${o.plate}`}</Txt>
        </View>
        <StatusTag look={executionStatus[o.status]} size="sm" />
      </View>
      <EtaStrip orderId={o.id} status={o.status} />
      <RouteRail pickup={o.pickup} dropoff={o.dropoff} />
      {o.driverName ? (
        <View style={s.driver}>
          <Icon name="account-tie-outline" size={16} tone="inkSecondary" />
          <Txt variant="caption" tone="inkSecondary" numberOfLines={1} style={{ flex: 1 }}>{t('Sopir {0} · unit {1}', [firstName(o.driverName), o.unitCode])}</Txt>
        </View>
      ) : null}
      <View style={s.row}>
        <Button label="Lacak di peta" icon="map-marker-radius-outline" style={{ flex: 1 }} onPress={() => router.push('/customer/map')} />
        <Button label="Detail" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(`/order/${o.id}`)} />
      </View>
    </View>
  );
}

/**
 * Beranda pelanggan, dibuat sesederhana mungkin: (1) isian "Mau dijemput di mana?" dan tombol pesan,
 * (2) pesanan yang sedang jalan dengan perkiraan tiba, (3) hal yang menunggu jawaban (hanya bila ada),
 * (4) pilihan paket layanan.
 */
export function CustomerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const s = useStyles();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const packages = useTovvQuery(['service-packages'], (api) => api.listServicePackages());
  const me = session.data;
  const b2bRequesterOnly = !!me?.businessAccountName && !me.b2bRoles.includes('approver');
  const org = me?.businessAccountName ? `${me.businessAccountName} (${me.b2bRoles.map((r) => t(B2B_ROLE[r] ?? r)).join(', ')})` : null;
  const lead = active.data?.[0];
  const later = useDeferred();
  const pkgOf = (o: OrderSummary) => packages.data?.find((p) => p.kind === o.service);

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={<RootHeader overlap right={<HeaderActions />} title={me ? t('Halo, {0}', [firstName(me.userName)]) : undefined} subtitle={me ? t('{0}Dilayani {1}', [org ? `${org} · ` : '', me.tenantName]) : undefined} />}
    >
      <HeroCard>
        <Txt variant="headline">Kendaraan Anda di mana?</Txt>
        <PressableScale
          depth="subtle"
          onPress={() => router.push({ pathname: '/request/new', params: { pick: 'pickup' } })}
          accessibilityRole="button"
          accessibilityLabel={t('Jemput di mana? Pilih lokasi jemput')}
          style={s.where}
        >
          <View style={s.dot} />
          <Txt variant="bodyStrong" tone="inkSecondary" style={{ flex: 1 }} numberOfLines={1}>Jemput di mana?</Txt>
          <Icon name="magnify" size={20} tone="inkMuted" />
        </PressableScale>
        <Button label="Pesan towing" icon="tow-truck" size="lg" onPress={() => router.push('/request/new')} />
        <Txt variant="caption" tone="inkSecondary">Operator mengecek dulu, lalu mengirim harga untuk Anda setujui. Belum ada yang dibayar sekarang.</Txt>
      </HeroCard>

      {lead ? (
        <>
          <SectionTitle title="Pesanan berjalan" count={active.data?.length} />
          <ActiveOrderCard o={lead} service={pkgOf(lead)} />
          {active.data && active.data.length > 1 ? active.data.slice(1).map((o, i) => <OrderRow key={o.id} o={o} index={i} />) : null}
        </>
      ) : null}

      <DailyActionsBlock title="Menunggu jawaban Anda" hint="Harga, biaya tambahan, dan tagihan yang perlu Anda putuskan." hideWhenEmpty />

      <SectionTitle title="Pilih layanan" action={<Button label="Bandingkan" variant="quiet" compact onPress={() => router.push('/services')} />} />
      <QueryView q={packages} ready={later} skeleton="action" skeletonRows={2}>
        {(list) => (
          <View style={s.grid}>
            {list.map((p) => (
              <ServiceTile key={p.kind} p={p} onPress={() => router.push({ pathname: '/request/new', params: { service: p.kind, pick: 'pickup' } })} />
            ))}
          </View>
        )}
      </QueryView>

      {b2bRequesterOnly ? (
        <Card tone="info" style={{ marginTop: space.lg }}>
          <Txt variant="bodyStrong" tone="accentInk">Anda memesan atas nama organisasi</Txt>
          <Txt variant="bodySm">Persetujuan harga dan pembayaran diurus penyetuju atau bagian keuangan organisasi Anda.</Txt>
        </Card>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  where: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 54, paddingHorizontal: space.md + 2, borderRadius: radius.md, backgroundColor: c.surfaceAlt },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: c.accent, backgroundColor: c.surface },
  active: { padding: space.lg, gap: space.md, borderRadius: radius.xl, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.accent, marginBottom: space.md, ...cardChrome(c, scheme, 2) },
  activeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  driver: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
}));
