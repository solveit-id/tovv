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
import { SectionTitle, Card } from '@/components/ui/surface';
import { HeroCard } from '@/components/ui/summary';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { useApiState } from '@/data/api/provider';
import { OrderRow } from '@/features/orders/order-row';
import { HeaderActions } from '@/features/home/header-actions';
import { executionStatus } from '@/core/i18n/status';
import { formatShortDateTime } from '@/core/format/time';

/**
 * Tugas driver: tugas terdekat menguasai kartu atas dengan satu aksi utama (buka tugas),
 * lalu tawaran/tugas aktif dan riwayat milik sendiri. Tanpa harga atau margin.
 */
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
  const lead = active.data?.[0];

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader overlap title="Tugas saya" subtitle={s ? `${s.userName} · ${s.tenantName}` : undefined} right={<HeaderActions />}>
          {s?.views.includes('owner') ? (
            <Button variant="onHero" compact icon="briefcase-outline" label="Kembali ke mode owner" style={{ alignSelf: 'flex-start' }} accessibilityHint="Perpindahan konteks eksplisit; izin owner aktif lagi setelah ini." onPress={() => void switchView('owner').then(() => router.replace('/owner'))} />
          ) : null}
        </RootHeader>
      }
    >
      <HeroCard>
        {lead ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Txt variant="label" tone="inkSecondary" style={{ flex: 1 }}>Tugas berikutnya</Txt>
              <StatusTag look={executionStatus[lead.status]} size="sm" />
            </View>
            <View style={{ gap: 2 }}>
              <Txt variant="title">{`${lead.alias} · ${lead.vehicleLabel}`}</Txt>
              <Txt variant="bodySm" tone="inkSecondary" numberOfLines={2}>{`${lead.pickup.label} → ${lead.dropoff.label}`}</Txt>
              <Txt variant="caption" tone="inkSecondary">{`Jadwal ${formatShortDateTime(lead.scheduleStart)} · unit ${lead.unitCode}`}</Txt>
            </View>
            <Button label={lead.nextStep} icon="arrow-right-circle" size="lg" onPress={() => router.push(`/order/${lead.id}`)} />
          </>
        ) : (
          <EmptyBlock icon="clipboard-check-outline" title="Belum ada tugas" body="Tawaran tugas baru muncul di sini dan di kotak masuk." />
        )}
      </HeroCard>

      <Card tone="warn" style={{ marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }} accessibilityRole="text">
          <Icon name="car-brake-alert" size={22} tone="warnInk" />
          <Txt variant="bodySm" tone="warnInk" style={{ flex: 1, fontWeight: '700' }}>Isi aplikasi hanya saat kendaraan berhenti.</Txt>
        </View>
      </Card>

      {pending ? (
        <Button label={`${pending} catatan belum terkirim — kirim sekarang`} icon="cloud-upload-outline" variant="secondary" onPress={() => router.push('/driver/sinkron')} style={{ marginTop: space.md }} />
      ) : null}

      {active.data && active.data.length > 1 ? (
        <>
          <SectionTitle title="Tugas lain & tawaran" count={active.data.length - 1} />
          {active.data.slice(1).map((o, i) => <OrderRow key={o.id} o={o} index={i} />)}
        </>
      ) : null}

      <SectionTitle title="Riwayat" count={history.data?.length} />
      <QueryView q={history}>
        {(list) =>
          list.length ? (
            list.slice(0, 8).map((o, i) => <OrderRow key={o.id} o={o} index={i} />)
          ) : (
            <Card>
              <EmptyBlock title="Belum ada riwayat" />
            </Card>
          )
        }
      </QueryView>
    </Screen>
  );
}
