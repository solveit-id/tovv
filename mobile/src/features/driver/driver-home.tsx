import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SectionTitle, Sheet } from '@/components/ui/nota';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { useApiState } from '@/data/api/provider';
import { OrderRow } from '@/features/orders/order-row';
import { HeaderActions } from '@/features/home/header-actions';

/** Daftar tugas driver: tawaran dan tugas aktif milik sendiri saja; tanpa harga atau margin. */
export function DriverHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const { switchView } = useApiState();
  const session = useTovvQuery(['session'], (api) => api.getSession());
  const active = useTovvQuery(['orders', 'active'], (api) => api.listOrders('active'));
  const history = useTovvQuery(['orders', 'history'], (api) => api.listOrders('history'));
  const outbox = useTovvQuery(['outbox'], (api) => api.listOutbox());
  const pending = outbox.data?.filter((x) => x.status === 'pending').length ?? 0;
  const s = session.data;
  return (
    <Screen
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader title="Tugas saya" subtitle={s ? `${s.userName} · ${s.tenantName}` : undefined} right={<HeaderActions />}>
          {s?.views.includes('owner') ? (
            <Button variant="onNavy" icon="briefcase-outline" label="Kembali ke mode owner" accessibilityHint="Perpindahan konteks eksplisit; izin owner aktif lagi setelah ini." onPress={() => void switchView('owner').then(() => router.replace('/owner'))} />
          ) : null}
        </RootHeader>
      }
    >
      <View style={styles.safety} accessibilityRole="text">
        <Icon name="car-brake-alert" size={20} tone="warnInk" />
        <Txt variant="bodySm" tone="warnInk" style={{ flex: 1, fontWeight: '600' }}>Isi aplikasi hanya saat kendaraan berhenti.</Txt>
      </View>
      {pending ? (
        <Button label={`${pending} catatan tersimpan di ponsel, belum terkirim`} icon="cloud-upload-outline" variant="secondary" onPress={() => router.push('/driver/sinkron')} style={{ marginTop: space.md }} />
      ) : null}
      <SectionTitle title="Aktif & tawaran" count={active.data?.length} />
      <Sheet padded={false}>
        <QueryView q={active}>
          {(list) =>
            list.length ? list.map((o, i) => <OrderRow key={o.id} o={o} last={i === list.length - 1} />) : <EmptyBlock icon="clipboard-check-outline" title="Belum ada tugas" body="Tawaran tugas baru muncul di sini dan di kotak masuk." />
          }
        </QueryView>
      </Sheet>
      <SectionTitle title="Riwayat" count={history.data?.length} />
      <Sheet padded={false}>
        <QueryView q={history}>
          {(list) => (list.length ? list.slice(0, 8).map((o, i, arr) => <OrderRow key={o.id} o={o} last={i === arr.length - 1} />) : <EmptyBlock title="Belum ada riwayat" />)}
        </QueryView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safety: { flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, backgroundColor: color.warnWash, borderRadius: 6 },
});
