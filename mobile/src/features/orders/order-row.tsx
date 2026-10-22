import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, space } from '@/core/design/tokens';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { Serial } from '@/components/ui/nota';
import { StatusTag } from '@/components/ui/status-tag';
import { StageTicks } from '@/components/nota/stage-line';
import type { OrderSummary, TimelineEntry } from '@/data/api/contract';
import { executionStatus, EXECUTION_FLOW } from '@/core/i18n/status';
import { formatShortDateTime, formatTime } from '@/core/format/time';

export function ticksFor(status: OrderSummary['status']): TimelineEntry[] {
  const idx = EXECUTION_FLOW.indexOf(status);
  return EXECUTION_FLOW.slice(0, 8).map((s, i) => ({
    status: s,
    label: executionStatus[s].label,
    at: null,
    state: idx < 0 ? 'upcoming' : i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  }));
}

/** Baris order ringkas untuk daftar: nomor seri, status, rute, tahap, dan langkah berikutnya. */
export function OrderRow({ o, last, showMoney }: { o: OrderSummary; last?: boolean; showMoney?: boolean }) {
  const router = useRouter();
  const look = executionStatus[o.status];
  const terminal = ['canceled', 'aborted'].includes(o.status);
  return (
    <Pressable
      onPress={() => router.push(`/order/${o.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Order ${o.alias}, ${look.label}. ${o.customerLabel}. ${o.pickup.label} ke ${o.dropoff.label}. Berikutnya: ${o.nextStep}.`}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { backgroundColor: color.carbonTint }]}
    >
      <View style={styles.head}>
        <Serial>{`O-${o.alias}`}</Serial>
        <StatusTag look={look} size="sm" />
        <View style={{ flex: 1 }} />
        {o.incidentOpen ? <Icon name="alert-octagon-outline" size={18} tone="dangerInk" /> : null}
        {o.changeOrderPending ? <Icon name="cash-plus" size={18} tone="warnInk" /> : null}
        <Icon name="chevron-right" size={20} tone="inkSecondary" />
      </View>
      <Txt variant="bodyStrong" numberOfLines={2}>{o.customerLabel}</Txt>
      <Txt variant="bodySm" tone="inkSecondary" numberOfLines={2}>
        {`${o.vehicleLabel} · ${o.plate} · ${o.pickup.label} → ${o.dropoff.label}`}
      </Txt>
      {!terminal ? <StageTicks entries={ticksFor(o.status)} /> : null}
      <View style={styles.meta}>
        <Txt variant="caption" tone="inkSecondary" style={{ flex: 1 }}>
          {`${formatShortDateTime(o.scheduleStart)}–${formatTime(o.scheduleEnd)} · ${o.unitCode}${o.driverName ? ` · ${o.driverName}` : ''}`}
        </Txt>
        {showMoney && o.outstanding && o.outstanding !== '0' ? (
          <Txt variant="caption" tone="warnInk" style={{ fontWeight: '700' }}>Piutang</Txt>
        ) : null}
      </View>
      <View style={styles.next}>
        <Icon name="arrow-right-bottom" size={16} tone="carbon" />
        <Txt variant="bodySm" tone="carbon" style={{ fontWeight: '600', flex: 1 }}>{o.nextStep}</Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { padding: space.lg, gap: space.xs + 2 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: color.rule },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  next: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
