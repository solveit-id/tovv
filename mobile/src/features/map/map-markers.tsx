import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { AnimatedRegion, Marker, MarkerAnimated } from 'react-native-maps';
import { radius, space, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import type { LiveUnit } from '@/data/api/contract';
import { t } from '@/core/i18n';

const STATE_TONE: Record<LiveUnit['state'], { bg: ColorToken; fg: ColorToken }> = {
  on_job: { bg: 'accent', fg: 'onAccent' },
  available: { bg: 'okInk', fg: 'surface' },
  out_of_service: { bg: 'neutralInk', fg: 'surface' },
};

/** Gambar penanda kustom Android hanya digambar ulang saat isinya berubah (hemat CPU). */
function useTrackChanges(key: string) {
  const [doneKey, setDoneKey] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDoneKey(key), 600);
    return () => clearTimeout(timer);
  }, [key]);
  return doneKey !== key;
}

/**
 * Penanda truk yang meluncur halus ke posisi baru setiap kali data diperbarui (±3 detik),
 * bukan melompat. Posisi lama (> 90 detik) digambar putus-putus dan pudar.
 */
export function TruckMarker({ unit, selected, onPress }: { unit: LiveUnit; selected: boolean; onPress: () => void }) {
  const s = useStyles();
  const c = useColors();
  const reduced = useReducedMotion();
  const tone = STATE_TONE[unit.state];
  const [region] = useState(() => new AnimatedRegion({ latitude: unit.lat, longitude: unit.lng, latitudeDelta: 0, longitudeDelta: 0 }));
  const track = useTrackChanges(`${unit.state}-${unit.freshness}-${selected}`);

  useEffect(() => {
    const to = { latitude: unit.lat, longitude: unit.lng, latitudeDelta: 0, longitudeDelta: 0 };
    if (reduced) region.setValue(to);
    else region.timing({ ...to, duration: 2600, useNativeDriver: false } as never).start();
  }, [unit.lat, unit.lng, reduced, region]);

  return (
    <MarkerAnimated
      coordinate={region as never}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
      tracksViewChanges={track}
      zIndex={selected ? 10 : unit.state === 'on_job' ? 5 : 1}
      accessibilityLabel={t('Unit {0}', [unit.code])}
    >
      <View style={s.truckWrap}>
        <View style={[s.truck, selected && s.truckSelected, unit.freshness === 'stale' && s.stale, { backgroundColor: c[tone.bg] }]}>
          <Icon name="tow-truck" size={selected ? 22 : 18} tone={tone.fg} />
        </View>
        <View style={s.tag}>
          <Txt variant="caption" bold maxFontSizeMultiplier={1.2} style={{ fontSize: 11, lineHeight: 14 }}>{unit.code}</Txt>
        </View>
      </View>
    </MarkerAnimated>
  );
}

/** Titik jemput (lingkaran) dan tujuan (pin merah) sebuah pekerjaan. */
export function PlaceMarker({ kind, lat, lng, label }: { kind: 'pickup' | 'dropoff' | 'base'; lat: number; lng: number; label: string }) {
  const s = useStyles();
  const track = useTrackChanges(kind);
  return (
    <Marker coordinate={{ latitude: lat, longitude: lng }} anchor={kind === 'dropoff' ? { x: 0.5, y: 1 } : { x: 0.5, y: 0.5 }} tracksViewChanges={track} title={label} zIndex={0}>
      {kind === 'pickup' ? (
        <View style={s.pickup}><View style={s.pickupDot} /></View>
      ) : kind === 'dropoff' ? (
        <Icon name="map-marker" size={34} tone="dangerInk" />
      ) : (
        <View style={s.base}><Icon name="warehouse" size={16} tone="inkSecondary" /></View>
      )}
    </Marker>
  );
}

const useStyles = makeStyles((c) => ({
  truckWrap: { alignItems: 'center', padding: 4 },
  truck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: c.surface,
    ...(Platform.OS === 'ios' ? { shadowColor: c.shadow, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } } : { elevation: 4 }),
  },
  truckSelected: { width: 46, height: 46, borderRadius: 23 },
  stale: { borderStyle: 'dashed', borderColor: c.warnInk, opacity: 0.85 },
  tag: { marginTop: 2, backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: space.xs + 2, borderWidth: 1, borderColor: c.line },
  pickup: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.accent },
  pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
  base: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.lineStrong },
}));
