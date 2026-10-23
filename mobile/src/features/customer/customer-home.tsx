import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { SectionTitle, Card } from '@/components/ui/surface';
import { HeroCard, ShortcutGrid } from '@/components/ui/summary';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';
import { firstName } from '@/core/format/name';
import { t } from '@/core/i18n';

const B2B_ROLE: Record<string, string> = { requester: 'pemesan', approver: 'penyetuju', finance: 'keuangan', receiver: 'penerima' };

/** Beranda pelanggan: minta derek dalam satu ketukan, keputusan yang menunggu, lalu pesanan berjalan. */
export function CustomerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const s = session.data;
  const b2bRequesterOnly = !!s?.businessAccountName && !s.b2bRoles.includes('approver');
  const org = s?.businessAccountName ? `${s.businessAccountName} (${s.b2bRoles.map((r) => B2B_ROLE[r] ?? r).join(', ')})` : null;

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={<RootHeader overlap right={<HeaderActions />} title={s ? t('Halo, {0}', [firstName(s.userName)]) : undefined} subtitle={s ? t('{0}Dilayani {1}', [org ? `${org} · ` : '', s.tenantName]) : undefined} />}
    >
      <HeroCard>
        <View style={{ gap: 4 }}>
          <Txt variant="headline">Mobil mogok atau perlu dipindahkan?</Txt>
          <Txt variant="bodySm" tone="inkSecondary">Kirim lokasi dan kondisi kendaraan. Operator mengecek dulu, lalu mengirim harga untuk Anda setujui.</Txt>
        </View>
        <Button label="Pesan derek" icon="tow-truck" size="lg" onPress={() => router.push('/request/new')} />
      </HeroCard>

      <ShortcutGrid
        items={[
          { key: 'orders', label: 'Pesanan', icon: 'clipboard-text-clock-outline', onPress: () => router.push('/customer/orders'), badge: active.data?.length },
          { key: 'bills', label: 'Tagihan', icon: 'file-document-outline', onPress: () => router.push('/customer/invoices'), tone: 'warnInk', wash: 'warnWash' },
          { key: 'inbox', label: 'Kotak masuk', icon: 'bell-outline', onPress: () => router.push('/inbox'), tone: 'okInk', wash: 'okWash' },
          { key: 'more', label: 'Lainnya', icon: 'dots-horizontal', onPress: () => router.push('/customer/more'), tone: 'neutralInk', wash: 'neutralWash' },
        ]}
      />

      <DailyActionsBlock title="Menunggu keputusan Anda" hint="Penawaran harga, biaya tambahan, dan tagihan yang perlu Anda jawab." />

      <SectionTitle title="Pesanan yang sedang jalan" count={active.data?.length} />
      <QueryView q={active}>
        {(list) =>
          list.length ? (
            list.map((o, i) => <OrderRow key={o.id} o={o} index={i} />)
          ) : (
            <Card>
              <EmptyBlock icon="tow-truck" title="Belum ada pesanan yang sedang jalan" body="Permintaan baru dicek operator dulu sebelum Anda menerima harga." />
            </Card>
          )
        }
      </QueryView>

      {b2bRequesterOnly ? (
        <Card tone="info" style={{ marginTop: space.md }}>
          <Txt variant="bodyStrong" tone="accentInk">Anda pemesan untuk organisasi</Txt>
          <Txt variant="bodySm">Persetujuan harga dan pembayaran ditangani oleh penyetuju atau bagian keuangan organisasi Anda.</Txt>
        </Card>
      ) : null}
    </Screen>
  );
}
