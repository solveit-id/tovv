import React from 'react';
import { View } from 'react-native';
import { radius, space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { useTovvQuery } from '@/data/api/hooks';
import type { ExecutionStatus } from '@/domain/types';
import { useFocusInterval } from '@/core/hooks/use-focus-interval';
import { addMinutes, formatTime } from '@/core/format/time';
import { t } from '@/core/i18n';

export const TRACKABLE: ExecutionStatus[] = ['en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery'];
const TO_PICKUP: ExecutionStatus[] = ['confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup'];

/**
 * Sorotan perkiraan tiba sebuah pekerjaan: "±12 mnt · tiba sekitar 14.20", menuju jemput atau tujuan.
 * Data dari pelacakan (replay simulasi F-06); diperbarui tiap 15 detik selama layar terlihat.
 * Bila lokasi belum dibagikan, alasannya yang tampil — tidak ada angka tebakan.
 */
export function EtaStrip({ orderId, status, compact }: { orderId: string; status: ExecutionStatus; compact?: boolean }) {
  const s = useStyles();
  const interval = useFocusInterval(15_000);
  const q = useTovvQuery(['tracking', orderId], (a) => a.getTracking(orderId), { refetchInterval: interval, enabled: TRACKABLE.includes(status) });
  if (!TRACKABLE.includes(status)) return null;
  const snap = q.data;
  const eta = snap?.visible ? snap.eta : null;
  const where = TO_PICKUP.includes(status) ? t('lokasi jemput') : t('tujuan');
  if (!eta) {
    if (compact || !snap) return null;
    return (
      <View style={[s.strip, s.muted]}>
        <Icon name="map-clock-outline" size={18} tone="inkSecondary" />
        <Txt variant="bodySm" tone="inkSecondary" style={{ flex: 1 }}>{snap.hiddenReason ?? 'Perkiraan tiba belum tersedia.'}</Txt>
      </View>
    );
  }
  const at = formatTime(addMinutes(eta.fetchedAt, eta.minutes));
  return (
    <View style={[s.strip, compact && s.compact]} accessible accessibilityLabel={t('Perkiraan tiba {0} sekitar {1} menit lagi, pukul {2}', [where, eta.minutes, at])}>
      <Icon name="clock-fast" size={compact ? 16 : 20} tone="accentInk" />
      <View style={{ flex: 1 }}>
        <Txt variant={compact ? 'bodySm' : 'bodyStrong'} tone="accentInk" bold numberOfLines={1}>
          {t('±{0} mnt · tiba {1}', [eta.minutes, at])}
        </Txt>
        <Txt variant="caption" tone="inkSecondary" numberOfLines={compact ? 1 : 2}>
          {compact ? t('Menuju {0}', [where]) : t('Menuju {0}. Perkiraan kasar, belum termasuk macet.', [where])}
        </Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  strip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm + 2, borderRadius: radius.md, backgroundColor: c.accentSoft },
  compact: { paddingVertical: space.xs + 2 },
  muted: { backgroundColor: c.surfaceAlt },
}));
