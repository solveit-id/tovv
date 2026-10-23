import React, { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { radius, space, cardChrome } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { useEnter } from '@/core/design/motion';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/layout/screen';
import { RootHeader } from '@/components/layout/app-header';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/form';
import { Money, Card } from '@/components/ui/surface';
import { StatusTag } from '@/components/ui/status-tag';
import { EmptyBlock, QueryView } from '@/components/ui/states';
import { useTovvQuery } from '@/data/api/hooks';
import type { RequestSummary } from '@/data/api/contract';
import { quoteStatus, requestStatus, channelLabel } from '@/core/i18n/status';
import { formatShortDateTime } from '@/core/format/time';
import { OrderRow } from '@/features/orders/order-row';
import { HeaderActions } from '@/features/home/header-actions';
import { t } from '@/core/i18n';

/** Kartu permintaan: kode + status, pelanggan, rute, kekurangan data, kanal, dan penawaran terakhir. */
export function RequestRow({ r, index = 0 }: { r: RequestSummary; last?: boolean; index?: number }) {
  const styles = useStyles();
  const router = useRouter();
  const entering = useEnter(index);
  const q = r.latestQuote;
  return (
    <Animated.View entering={entering}>
      <PressableScale
        onPress={() => router.push(`/request/${r.id}`)}
        accessibilityRole="button"
        accessibilityLabel={t('Permintaan {0}, {1}, {2}', [r.alias, requestStatus[r.status].label, r.customerLabel])}
        style={styles.card}
      >
        <View style={styles.head}>
          <Txt variant="titleSm">{r.alias}</Txt>
          <StatusTag look={requestStatus[r.status]} size="sm" />
          <View style={{ flex: 1 }} />
          <Icon name="chevron-right" size={20} tone="inkMuted" />
        </View>
        <Txt variant="bodyStrong" numberOfLines={1}>{r.customerLabel}</Txt>
        <Txt variant="bodySm" tone="inkSecondary" numberOfLines={2}>{`${r.vehicleLabel} · ${r.pickupLabel} → ${r.dropoffLabel}`}</Txt>
        {r.needsReviewReasons.length ? (
          <View style={styles.missing}>
            <Icon name="alert-circle-outline" size={15} tone="warnInk" />
            <Txt variant="caption" tone="warnInk" style={{ flex: 1 }}>{t('Belum lengkap: {0}', [r.needsReviewReasons.join(', ')])}</Txt>
          </View>
        ) : null}
        <View style={styles.head}>
          <Icon name="phone-outline" size={14} tone="inkSecondary" />
          <Txt variant="caption" tone="inkSecondary" style={{ flex: 1 }}>{`${channelLabel[r.channel]} · ${formatShortDateTime(r.createdAt)}`}</Txt>
          {q ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="caption" tone={q.status === 'expired' ? 'dangerInk' : q.status === 'sent' ? 'warnInk' : 'inkSecondary'} bold>{t('Penawaran v{0} · {1}{2}', [q.version, quoteStatus[q.status].label, q.status === 'expired' && r.status === 'quoted' ? ' · buat ulang' : ''])}</Txt>
              <Money value={q.amount} size="sm" />
            </View>
          ) : null}
        </View>
      </PressableScale>
    </Animated.View>
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
          {canCreate ? <Button variant="onHero" compact icon="phone-plus-outline" label={createLabel} style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/request/new')} /> : null}
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
      {tab === 'requests' ? (
          <QueryView q={requests} skeleton="action">
            {(list) => (list.length ? list.map((r, i) => <RequestRow key={r.id} r={r} index={i} />) : <Card><EmptyBlock icon="phone-incoming-outline" title="Tidak ada permintaan terbuka" /></Card>)}
          </QueryView>
        ) : (
          <QueryView q={tab === 'active' ? active : history} skeleton="order" skeletonRows={2}>
            {(list) => (list.length ? list.map((o, i) => <OrderRow key={`${tab}-${o.id}`} o={o} index={i} showMoney />) : <Card><EmptyBlock icon="tow-truck" title={tab === 'active' ? 'Tidak ada pekerjaan yang sedang jalan' : 'Belum ada riwayat'} /></Card>)}
          </QueryView>
        )}
    </Screen>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  card: { padding: space.lg, gap: space.xs + 2, borderRadius: radius.xl, backgroundColor: c.surface, marginBottom: space.md, ...cardChrome(c, scheme) },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  missing: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', backgroundColor: c.warnWash, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6 },
}));
