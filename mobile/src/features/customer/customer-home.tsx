import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionTitle, Card } from '@/components/ui/surface';
import { HeroCard, ShortcutGrid } from '@/components/ui/summary';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { TowTruckArt } from '@/components/brand/tow-truck';
import { useTovvQuery } from '@/data/api/hooks';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';
import { firstName } from '@/core/format/name';
import { t } from '@/core/i18n';

const B2B_ROLE: Record<string, string> = { requester: 'pemesan', approver: 'penyetuju', finance: 'keuangan', receiver: 'penerima' };

/**
 * Beranda pelanggan: kartu pemesanan dengan isian "Jemput di mana?" seperti aplikasi ojek online,
 * keputusan yang menunggu, lalu pesanan yang sedang jalan.
 */
export function CustomerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const s = useStyles();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const me = session.data;
  const b2bRequesterOnly = !!me?.businessAccountName && !me.b2bRoles.includes('approver');
  const org = me?.businessAccountName ? `${me.businessAccountName} (${me.b2bRoles.map((r) => t(B2B_ROLE[r] ?? r)).join(', ')})` : null;

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={<RootHeader overlap right={<HeaderActions />} title={me ? t('Halo, {0}', [firstName(me.userName)]) : undefined} subtitle={me ? t('{0}Dilayani {1}', [org ? `${org} · ` : '', me.tenantName]) : undefined} />}
    >
      <HeroCard>
        <View style={s.heroTop}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="headline">Mobil mogok atau perlu dipindah?</Txt>
            <Txt variant="bodySm" tone="inkSecondary">Kirim lokasi dan kondisi mobil. Operator mengecek dulu, lalu mengirim harga untuk Anda setujui.</Txt>
          </View>
        </View>
        <View style={s.art} pointerEvents="none">
          <TowTruckArt width={128} loaded />
        </View>
        <PressableScale
          depth="subtle"
          onPress={() => router.push({ pathname: '/request/new', params: { pick: 'pickup' } })}
          accessibilityRole="button"
          accessibilityLabel={t('Jemput di mana? Pilih lokasi jemput')}
          style={s.where}
        >
          <View style={s.dot} />
          <Txt variant="bodyStrong" tone="inkSecondary" style={{ flex: 1 }}>Jemput di mana?</Txt>
          <Icon name="magnify" size={20} tone="inkMuted" />
        </PressableScale>
        <Button label="Pesan derek" icon="tow-truck" size="lg" onPress={() => router.push('/request/new')} />
      </HeroCard>

      <ShortcutGrid
        items={[
          { key: 'orders', label: 'Pesanan', icon: 'clipboard-text-clock-outline', onPress: () => router.push('/customer/orders'), badge: active.data?.length },
          { key: 'map', label: 'Lacak derek', icon: 'map-marker-radius-outline', onPress: () => router.push('/customer/map'), tone: 'okInk', wash: 'okWash' },
          { key: 'bills', label: 'Tagihan', icon: 'file-document-outline', onPress: () => router.push('/customer/invoices'), tone: 'warnInk', wash: 'warnWash' },
          { key: 'inbox', label: 'Kotak masuk', icon: 'bell-outline', onPress: () => router.push('/inbox'), tone: 'neutralInk', wash: 'neutralWash' },
        ]}
      />

      <DailyActionsBlock title="Menunggu jawaban Anda" hint="Harga, biaya tambahan, dan tagihan yang perlu Anda putuskan." />

      <SectionTitle title="Pesanan yang sedang jalan" count={active.data?.length} />
      <QueryView q={active} skeleton="order" skeletonRows={1}>
        {(list) =>
          list.length ? (
            list.map((o, i) => <OrderRow key={o.id} o={o} index={i} />)
          ) : (
            <Card>
              <EmptyBlock art="truck" title="Belum ada pesanan yang jalan" body="Setelah Anda memesan, operator mengecek dulu sebelum mengirim harga." />
            </Card>
          )
        }
      </QueryView>

      {b2bRequesterOnly ? (
        <Card tone="info" style={{ marginTop: space.md }}>
          <Txt variant="bodyStrong" tone="accentInk">Anda memesan atas nama organisasi</Txt>
          <Txt variant="bodySm">Persetujuan harga dan pembayaran diurus penyetuju atau bagian keuangan organisasi Anda.</Txt>
        </Card>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  heroTop: { flexDirection: 'row', paddingRight: 88 },
  art: { position: 'absolute', right: -18, top: 6 },
  where: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52, paddingHorizontal: space.md + 2, borderRadius: radius.md, backgroundColor: c.surfaceAlt },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: c.accent, backgroundColor: c.surface },
}));
