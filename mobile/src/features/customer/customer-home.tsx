import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { SectionTitle, Sheet } from '@/components/ui/nota';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';

/** Beranda pelanggan: keputusan yang menunggu (penawaran, biaya tambahan, tagihan) lalu pesanan berjalan. */
export function CustomerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const s = session.data;
  const b2bRequesterOnly = !!s?.businessAccountName && !s.b2bRoles.includes('approver');
  return (
    <Screen headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader
          right={<HeaderActions />}
          subtitle={s ? `${s.userName}${s.businessAccountName ? ` · ${s.businessAccountName} (${s.b2bRoles.join(', ')})` : ''} · dilayani ${s.tenantName}` : undefined}
        >
          <Button variant="onNavy" icon="plus" label="Minta derek" onPress={() => router.push('/request/new')} />
        </RootHeader>
      }
    >
      <DailyActionsBlock title="Menunggu Anda" />
      <SectionTitle title="Pesanan berjalan" count={active.data?.length} />
      <Sheet padded={false}>
        <QueryView q={active}>
          {(list) =>
            list.length ? (
              list.map((o, i) => <OrderRow key={o.id} o={o} last={i === list.length - 1} />)
            ) : (
              <EmptyBlock icon="tow-truck" title="Belum ada pesanan berjalan" body="Permintaan baru akan ditinjau operator sebelum ada penawaran harga." />
            )
          }
        </QueryView>
      </Sheet>
      {b2bRequesterOnly ? (
        <View style={{ marginTop: space.lg }}>
          <Sheet>
            <EmptyBlock icon="account-key-outline" title="Anda pemesan organisasi" body="Persetujuan harga dan tagihan organisasi ditangani approver/finance organisasi Anda." />
          </Sheet>
        </View>
      ) : null}
    </Screen>
  );
}
