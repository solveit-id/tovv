import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { color, space } from '@/core/design/tokens';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/form';
import { Money, Serial, Sheet } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import type { RequestSummary } from '@/data/api/contract';
import { quoteStatus, requestStatus, channelLabel } from '@/core/i18n/status';
import { formatShortDateTime } from '@/core/format/time';
import { OrderRow } from '@/features/orders/order-row';
import { HeaderActions } from '@/features/home/header-actions';

export function RequestRow({ r, last }: { r: RequestSummary; last?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/request/${r.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Permintaan ${r.alias}, ${requestStatus[r.status].label}, ${r.customerLabel}`}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { backgroundColor: color.carbonTint }]}
    >
      <View style={styles.head}>
        <Serial>{`R-${r.alias}`}</Serial>
        <StatusTag look={requestStatus[r.status]} size="sm" />
        <View style={{ flex: 1 }} />
        <Icon name="chevron-right" size={20} tone="inkSecondary" />
      </View>
      <Txt variant="bodyStrong" numberOfLines={2}>{r.customerLabel}</Txt>
      <Txt variant="bodySm" tone="inkSecondary" numberOfLines={2}>{`${r.vehicleLabel} · ${r.pickupLabel} → ${r.dropoffLabel}`}</Txt>
      {r.needsReviewReasons.length ? <Txt variant="caption" tone="warnInk">{r.needsReviewReasons.join(' · ')}</Txt> : null}
      <View style={styles.head}>
        <Txt variant="caption" tone="inkSecondary" style={{ flex: 1 }}>{`${channelLabel[r.channel]} · ${formatShortDateTime(r.createdAt)}`}</Txt>
        {r.latestQuote ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Txt variant="caption" tone={r.latestQuote.status === 'expired' ? 'dangerInk' : r.latestQuote.status === 'sent' ? 'warnInk' : 'inkSecondary'}>{`v${r.latestQuote.version} · ${quoteStatus[r.latestQuote.status].label}${r.latestQuote.status === 'expired' && r.status === 'quoted' ? ' · perlu penawaran ulang' : ''}`}</Txt>
            <Money value={r.latestQuote.amount} size="sm" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

type Tab = 'active' | 'requests' | 'history';

/** Daftar pekerjaan: order berjalan, permintaan terbuka, dan riwayat; satu tempat untuk menelusuri. */
export function WorkListScreen({ title = 'Pekerjaan', initial = 'active', canCreate = true, createLabel = 'Catat permintaan' }: { title?: string; initial?: Tab; canCreate?: boolean; createLabel?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>(initial);
  const active = useTovvQuery(['orders', 'active'], (a) => a.listOrders('active'));
  const history = useTovvQuery(['orders', 'history'], (a) => a.listOrders('history'));
  const requests = useTovvQuery(['requests', 'open'], (a) => a.listRequests('open'));
  return (
    <Screen headerScrolls
      onRefresh={() => qc.invalidateQueries()}
      header={
        <RootHeader title={title} right={<HeaderActions />}>
          {canCreate ? <Button variant="onNavy" icon="phone-plus-outline" label={createLabel} onPress={() => router.push('/request/new')} /> : null}
        </RootHeader>
      }
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: 'Berjalan', count: active.data?.length },
          { value: 'requests', label: 'Permintaan', count: requests.data?.length },
          { value: 'history', label: 'Riwayat', count: history.data?.length },
        ]}
      />
      <Sheet padded={false}>
        {tab === 'requests' ? (
          <QueryView q={requests}>
            {(list) => (list.length ? list.map((r, i) => <RequestRow key={r.id} r={r} last={i === list.length - 1} />) : <EmptyBlock icon="phone-incoming-outline" title="Tidak ada permintaan terbuka" />)}
          </QueryView>
        ) : (
          <QueryView q={tab === 'active' ? active : history}>
            {(list) => (list.length ? list.map((o, i) => <OrderRow key={o.id} o={o} last={i === list.length - 1} showMoney />) : <EmptyBlock icon="tow-truck" title={tab === 'active' ? 'Tidak ada pekerjaan berjalan' : 'Belum ada riwayat'} />)}
          </QueryView>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { padding: space.lg, gap: space.xs + 2 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
