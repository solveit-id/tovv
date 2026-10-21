import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { SectionTitle, Sheet } from '@/components/ui/nota';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';
import { formatDateTime } from '@/core/format/time';
import { formatRupiah } from '@/core/format/money';

/** Beranda admin: dispatcher dan finance melihat daftar tindakan sesuai izin masing-masing. */
export function AdminHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useTovvQuery(['session'], (a) => a.getSession());
  const s = session.data;
  const scopes = new Set(s?.scopes ?? []);
  const dispatcher = scopes.has('request.manage');
  const active = useTovvQuery(['orders', 'active'], (a) => a.listOrders('active'), { enabled: dispatcher });
  const roleLabel = s ? (s.staffRoles.includes('finance') ? 'Finance' : 'Dispatcher') : '';
  return (
    <Screen headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader right={<HeaderActions />} subtitle={s ? `${s.userName} · ${roleLabel} · ${s.tenantName}` : undefined}>
          {dispatcher ? <Button variant="onNavy" icon="phone-plus-outline" label="Catat permintaan telepon/chat" onPress={() => router.push('/request/new')} /> : null}
        </RootHeader>
      }
    >
      {s?.delegation ? (
        <Sheet style={{ marginTop: 0 }}>
          <Txt variant="bodyStrong" tone="carbon">{`Delegasi aktif dari ${s.delegation.delegatorName}`}</Txt>
          <Txt variant="bodySm">{`Diskon sampai ${formatRupiah(s.delegation.limit)} dari target · berakhir ${formatDateTime(s.delegation.expiresAt)}`}</Txt>
        </Sheet>
      ) : s && dispatcher ? (
        <Sheet>
          <Txt variant="bodySm" tone="inkSecondary">Tanpa delegasi: Anda dapat menyusun draf penawaran, tetapi pengiriman harga memerlukan owner.</Txt>
        </Sheet>
      ) : null}
      <DailyActionsBlock />
      {dispatcher ? (
        <View>
          <SectionTitle title="Order berjalan" count={active.data?.length} />
          <Sheet padded={false}>
            <QueryView q={active}>
              {(list) => (list.length ? list.map((o, i) => <OrderRow key={o.id} o={o} last={i === list.length - 1} />) : <EmptyBlock icon="tow-truck" title="Tidak ada order berjalan" />)}
            </QueryView>
          </Sheet>
        </View>
      ) : null}
      <View style={{ height: space.lg }} />
    </Screen>
  );
}
