import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { radius, space, cardChrome } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { useEnter } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { StatusTag } from '@/components/ui/status-tag';
import { StageTicks } from '@/components/business/stage-line';
import { RouteRail } from '@/components/business/route-rail';
import type { OrderSummary, TimelineEntry } from '@/data/api/contract';
import { executionStatus, EXECUTION_FLOW } from '@/core/i18n/status';
import { formatShortDateTime, formatTime } from '@/core/format/time';
import { t } from '@/core/i18n';

/** Langkah berikutnya yang hanya keterangan (tidak ada yang perlu dilakukan pengguna ini). */
const PASSIVE = /^(Menunggu|Tagihan tercatat|Tugas selesai|Selesai|Dibatalkan|Dihentikan)/;

export function ticksFor(status: OrderSummary['status']): TimelineEntry[] {
  const idx = EXECUTION_FLOW.indexOf(status);
  return EXECUTION_FLOW.slice(0, 8).map((s, i) => ({
    status: s,
    label: executionStatus[s].label,
    at: null,
    state: idx < 0 ? 'upcoming' : i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  }));
}

/**
 * Kartu pekerjaan (gaya pelacakan pesanan): kode + status, pelanggan, rute jemput → antar,
 * progres tahap, jadwal/unit/driver, lalu langkah berikutnya yang disorot.
 */
export function OrderRow({ o, showMoney, index = 0 }: { o: OrderSummary; last?: boolean; showMoney?: boolean; index?: number }) {
  const router = useRouter();
  const s = useStyles();
  const entering = useEnter(index);
  const look = executionStatus[o.status];
  const terminal = ['canceled', 'aborted'].includes(o.status);
  const owes = showMoney && o.outstanding && o.outstanding !== '0';
  const passive = PASSIVE.test(o.nextStep);
  const ticks = ticksFor(o.status);
  const stageNo = ticks.findIndex((t) => t.state === 'current') + 1;
  return (
    <Animated.View entering={entering}>
      <PressableScale
        onPress={() => router.push(`/order/${o.id}`)}
        accessibilityRole="button"
        accessibilityLabel={t('Pekerjaan {0}, {1}. {2}. Dari {3} ke {4}. Berikutnya: {5}.', [o.alias, look.label, o.customerLabel, o.pickup.label, o.dropoff.label, o.nextStep])}
        style={s.card}
      >
        <View style={s.head}>
          <Txt variant="titleSm">{o.alias}</Txt>
          <StatusTag look={look} size="sm" />
          <View style={{ flex: 1 }} />
          {o.incidentOpen ? <Icon name="alert-octagon" size={18} tone="dangerInk" /> : null}
          {o.changeOrderPending ? <Icon name="cash-plus" size={18} tone="warnInk" /> : null}
          <Icon name="chevron-right" size={20} tone="inkMuted" />
        </View>
        <Txt variant="bodyStrong" numberOfLines={1}>{o.customerLabel}</Txt>

        <View style={s.route}>
          <RouteRail pickup={o.pickup} dropoff={o.dropoff} />
        </View>

        <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>{`${o.vehicleLabel} · ${o.plate}`}</Txt>
        {!terminal ? (
          <View style={{ gap: 4 }}>
            <StageTicks entries={ticks} />
            {stageNo > 0 ? <Txt variant="caption" tone="inkSecondary">{t('Tahap {0} dari {1} · {2}', [stageNo, ticks.length, look.label])}</Txt> : null}
          </View>
        ) : null}

        <View style={s.meta}>
          <Icon name="clock-outline" size={14} tone="inkSecondary" />
          <Txt variant="caption" tone="inkSecondary" style={{ flex: 1 }} numberOfLines={2}>
            {`${formatShortDateTime(o.scheduleStart)}–${formatTime(o.scheduleEnd)} · ${o.unitCode}${o.driverName ? ` · ${o.driverName}` : ''}`}
          </Txt>
          {owes ? (
            <View style={s.owe}>
              <Txt variant="caption" tone="warnInk" bold>Masih ada tagihan</Txt>
            </View>
          ) : null}
        </View>

        {passive ? (
          <View style={s.passive}>
            <Icon name="information-outline" size={16} tone="inkSecondary" />
            <Txt variant="bodySm" tone="inkSecondary" style={{ flex: 1 }}>{o.nextStep}</Txt>
          </View>
        ) : (
          <View style={s.next}>
            <Icon name="arrow-right-circle" size={18} tone="accentInk" />
            <Txt variant="bodySm" tone="accentInk" style={{ fontWeight: '700', flex: 1 }}>{t('Berikutnya: {0}', [o.nextStep])}</Txt>
          </View>
        )}
      </PressableScale>
    </Animated.View>
  );
}

const useStyles = makeStyles((c, scheme) => ({
  card: { padding: space.lg, gap: space.sm, borderRadius: radius.xl, backgroundColor: c.surface, marginBottom: space.md, ...cardChrome(c, scheme) },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  route: { paddingVertical: space.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  owe: { backgroundColor: c.warnWash, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  passive: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.accentSoft, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm + 2, marginTop: 2 },
}));
