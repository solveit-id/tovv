import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { SectionTitle, Card } from '@/components/ui/surface';
import { HeroCard, HeroStats, ShortcutGrid, type Shortcut } from '@/components/ui/summary';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import { DailyActionsBlock } from '@/features/home/daily-actions-block';
import { HeaderActions } from '@/features/home/header-actions';
import { OrderRow } from '@/features/orders/order-row';
import { firstName } from '@/core/format/name';
import { formatDateTime } from '@/core/format/time';
import { formatRupiah } from '@/core/format/money';

/** Beranda admin: dispatcher dan finance melihat ringkasan, pintasan dan tindakan sesuai izin masing-masing. */
export function AdminHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useTovvQuery(['session'], (a) => a.getSession());
  const actions = useTovvQuery(['daily-actions'], (a) => a.getDailyActions());
  const s = session.data;
  const scopes = new Set(s?.scopes ?? []);
  const dispatcher = scopes.has('request.manage');
  const finance = scopes.has('payment.verify') || scopes.has('invoice.issue');
  const active = useTovvQuery(['orders', 'active'], (a) => a.listOrders('active'), { enabled: dispatcher });
  const roleLabel = s ? (s.staffRoles.includes('finance') ? 'Finance' : 'Dispatcher') : '';
  const blockers = actions.data?.filter((a) => a.severity === 'blocker').length ?? 0;

  const shortcuts: Shortcut[] = [
    ...(dispatcher
      ? [
          { key: 'inbox', label: 'Permintaan masuk', icon: 'phone-incoming-outline', onPress: () => router.push('/admin/permintaan'), tone: 'warnInk', wash: 'warnWash' },
          { key: 'sched', label: 'Jadwal', icon: 'calendar-clock-outline', onPress: () => router.push('/admin/jadwal'), tone: 'okInk', wash: 'okWash' },
        ] satisfies Shortcut[]
      : []),
    ...(finance
      ? [
          { key: 'fin', label: 'Periksa bayar', icon: 'cash-check', onPress: () => router.push('/admin/keuangan'), tone: 'okInk', wash: 'okWash' },
          { key: 'exp', label: 'Biaya & uang jalan', icon: 'receipt-text-outline', onPress: () => router.push('/finance/expenses'), tone: 'warnInk', wash: 'warnWash' },
          { key: 'rep', label: 'Laporan', icon: 'chart-box-outline', onPress: () => router.push('/reports') },
        ] satisfies Shortcut[]
      : []),
    { key: 'more', label: 'Lainnya', icon: 'dots-horizontal', onPress: () => router.push('/admin/lainnya'), tone: 'neutralInk', wash: 'neutralWash' },
  ];

  return (
    <Screen
      headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={<RootHeader overlap right={<HeaderActions />} title={s ? `Halo, ${firstName(s.userName)}` : undefined} subtitle={s ? `${roleLabel} · ${s.tenantName}` : undefined} />}
      fab={dispatcher ? { label: 'Catat permintaan', icon: 'phone-plus', onPress: () => router.push('/request/new'), accessibilityHint: 'Catat permintaan dari telepon atau chat pelanggan' } : undefined}
    >
      <HeroCard>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="label" tone="inkSecondary">Perlu tindakan hari ini</Txt>
            <Txt variant="figureXl">{actions.data ? String(actions.data.length) : '–'}</Txt>
          </View>
          {blockers ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="alert-octagon" size={16} tone="dangerInk" />
              <Txt variant="bodySm" tone="dangerInk" bold>{`${blockers} menghambat`}</Txt>
            </View>
          ) : null}
        </View>
        <HeroStats
          items={[
            { label: dispatcher ? 'Order berjalan' : 'Peran', value: <Txt variant="figure">{dispatcher ? String(active.data?.length ?? '–') : roleLabel}</Txt> },
            {
              label: 'Wewenang harga',
              value: <Txt variant="bodyStrong" tone={s?.delegation ? 'okInk' : 'inkSecondary'} numberOfLines={2}>{s?.delegation ? `Delegasi s/d ${formatRupiah(s.delegation.limit)}` : 'Perlu owner'}</Txt>,
            },
          ]}
        />
      </HeroCard>

      <ShortcutGrid items={shortcuts.slice(0, 4)} />

      {s?.delegation ? (
        <Card tone="info" style={{ marginTop: space.xl }}>
          <Txt variant="bodyStrong" tone="accentInk">{`Delegasi aktif dari ${s.delegation.delegatorName}`}</Txt>
          <Txt variant="bodySm">{`Anda boleh memberi diskon sampai ${formatRupiah(s.delegation.limit)} di bawah target harga. Berakhir ${formatDateTime(s.delegation.expiresAt)}.`}</Txt>
        </Card>
      ) : s && dispatcher ? (
        <Card tone="info" style={{ marginTop: space.xl }}>
          <Txt variant="bodySm">Anda dapat menyusun draf penawaran, tetapi harga baru bisa dikirim ke pelanggan setelah disetujui owner.</Txt>
        </Card>
      ) : null}

      <DailyActionsBlock />

      {dispatcher ? (
        <View>
          <SectionTitle title="Order berjalan" count={active.data?.length} />
          <QueryView q={active}>
            {(list) =>
              list.length ? (
                list.map((o, i) => <OrderRow key={o.id} o={o} index={i} />)
              ) : (
                <Card>
                  <EmptyBlock icon="tow-truck" title="Tidak ada order berjalan" />
                </Card>
              )
            }
          </QueryView>
        </View>
      ) : null}
    </Screen>
  );
}
