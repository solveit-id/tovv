import React from 'react';
import { View } from 'react-native';
import { space } from '@/core/design/tokens';
import { makeStyles } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';

interface Stop {
  label: string;
  address?: string | null;
}

/**
 * Rute ringkas jemput → tujuan (gaya aplikasi ojek/kurir): cincin biru untuk jemput, pin merah untuk
 * tujuan, dihubungkan garis putus-putus. Alamat tampil di bawah nama tempat bila `detailed`.
 */
export function RouteRail({ pickup, dropoff, detailed }: { pickup: Stop; dropoff: Stop; detailed?: boolean }) {
  const s = useStyles();
  return (
    <View style={s.root} accessible accessibilityLabel={`${pickup.label} → ${dropoff.label}`}>
      <View style={s.rail}>
        <View style={s.from} />
        <View style={s.line}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={s.dot} />
          ))}
        </View>
        <Icon name="map-marker" size={18} tone="dangerInk" />
      </View>
      <View style={s.stops}>
        <View>
          <Txt variant="bodySm" bold numberOfLines={1}>{pickup.label}</Txt>
          {detailed && pickup.address ? <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>{pickup.address}</Txt> : null}
        </View>
        <View>
          <Txt variant="bodySm" bold numberOfLines={1}>{dropoff.label}</Txt>
          {detailed && dropoff.address ? <Txt variant="caption" tone="inkSecondary" numberOfLines={1}>{dropoff.address}</Txt> : null}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flexDirection: 'row', gap: space.md },
  rail: { width: 18, alignItems: 'center', paddingTop: 4, paddingBottom: 2 },
  from: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: c.accent, backgroundColor: c.surface },
  // Titik-titik, bukan borderStyle dashed: garis putus-putus satu sisi tidak konsisten di iOS.
  line: { flex: 1, minHeight: 14, justifyContent: 'space-evenly', alignItems: 'center', overflow: 'hidden', marginVertical: 2 },
  dot: { width: 2, height: 3, borderRadius: 1, backgroundColor: c.lineStrong },
  stops: { flex: 1, gap: space.md, justifyContent: 'space-between' },
}));
