import React, { useEffect, useRef, useState } from 'react';
import { Easing, Platform, View } from 'react-native';
import { AnimatedRegion, Marker, MarkerAnimated, type MapMarker, type MapMarkerProps } from 'react-native-maps';
import { radius, space, type ColorToken } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { TowTruckTop } from '@/components/brand/tow-truck';
import type { LiveUnit } from '@/data/api/contract';
import { bearing } from '@/core/format/geo';
import { t } from '@/core/i18n';

// Tipe MarkerAnimated di react-native-maps belum mengikuti tipe Animated RN 0.88.
const AnimatedMarker = MarkerAnimated as unknown as React.ComponentType<Omit<MapMarkerProps, 'coordinate'> & { coordinate: AnimatedRegion }>;

const STATE_BODY: Record<LiveUnit['state'], ColorToken> = {
  on_job: 'accent',
  available: 'okInk',
  out_of_service: 'neutralInk',
};

/** Gambar penanda kustom hanya digambar ulang saat isinya berubah (hemat CPU, terutama Android). */
function useTrackChanges(key: string) {
  const [doneKey, setDoneKey] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDoneKey(key), 500);
    return () => clearTimeout(timer);
  }, [key]);
  return doneKey !== key;
}

/** Arah hadap truk dari perpindahan terakhirnya; tetap arah lama bila diam. Dibulatkan 10° agar jarang menggambar ulang. */
function useHeading(lat: number, lng: number, fallback: number | null) {
  const prev = useRef({ lat, lng });
  const [heading, setHeading] = useState(fallback ?? 0);
  useEffect(() => {
    const p = prev.current;
    if (Math.abs(p.lat - lat) + Math.abs(p.lng - lng) > 0.00002) {
      setHeading(Math.round(bearing(p, { lat, lng }) / 10) * 10);
      prev.current = { lat, lng };
    }
  }, [lat, lng]);
  return heading;
}

function TruckBody({ unit, selected, heading }: { unit: LiveUnit; selected: boolean; heading: number }) {
  const s = useStyles();
  const c = useColors();
  return (
    <View style={s.truckWrap}>
      <View style={[s.halo, selected && s.haloOn, unit.freshness === 'stale' && s.haloStale]}>
        <View style={{ transform: [{ rotate: `${heading}deg` }] }}>
          <TowTruckTop size={selected ? 44 : 38} body={c[STATE_BODY[unit.state]]} />
        </View>
      </View>
      <View style={[s.tag, selected && s.tagOn]}>
        <Txt variant="caption" bold tone={selected ? 'onAccent' : 'ink'} maxFontSizeMultiplier={1.2} style={s.tagText}>{unit.code}</Txt>
      </View>
    </View>
  );
}

/**
 * Penanda unit derek: truk tampak atas yang menghadap arah geraknya, meluncur terus-menerus ke posisi
 * baru dalam waktu yang sama dengan jeda pembaruan data, sehingga gerakannya tidak patah-patah.
 * Android memakai animasi native peta; iOS memakai AnimatedRegion. Posisi lama (> 90 detik) diberi
 * lingkar putus-putus kuning.
 */
export const TruckMarker = React.memo(function TruckMarker({ unit, selected, onSelect, glideMs, fallbackHeading }: { unit: LiveUnit; selected: boolean; onSelect: (unitId: string) => void; glideMs: number; fallbackHeading: number | null }) {
  const reduced = useReducedMotion();
  const heading = useHeading(unit.lat, unit.lng, fallbackHeading);
  const track = useTrackChanges(`${unit.state}-${unit.freshness}-${selected}-${heading}`);
  const markerRef = useRef<MapMarker>(null);
  const [region] = useState(() => new AnimatedRegion({ latitude: unit.lat, longitude: unit.lng, latitudeDelta: 0, longitudeDelta: 0 }));
  const [initial] = useState(() => ({ latitude: unit.lat, longitude: unit.lng }));
  const label = t('Unit {0}, {1}', [unit.code, unit.state === 'on_job' ? t('sedang bertugas') : unit.state === 'available' ? t('siap dipakai') : t('tidak beroperasi')]);

  useEffect(() => {
    const to = { latitude: unit.lat, longitude: unit.lng };
    if (Platform.OS === 'android') {
      markerRef.current?.animateMarkerToCoordinate(to, reduced ? 1 : glideMs);
    } else if (reduced) {
      region.setValue({ ...to, latitudeDelta: 0, longitudeDelta: 0 });
    } else {
      region.timing({ ...to, latitudeDelta: 0, longitudeDelta: 0, duration: glideMs, easing: Easing.linear, useNativeDriver: false } as never).start();
    }
  }, [unit.lat, unit.lng, reduced, region, glideMs]);

  const body = <TruckBody unit={unit} selected={selected} heading={heading} />;
  const common = {
    anchor: { x: 0.5, y: 0.4 },
    onPress: () => onSelect(unit.unitId),
    tracksViewChanges: track,
    zIndex: selected ? 10 : unit.state === 'on_job' ? 5 : 1,
    accessibilityLabel: label,
  };
  if (Platform.OS === 'android') {
    return (
      <Marker ref={markerRef} coordinate={initial} {...common}>
        {body}
      </Marker>
    );
  }
  return (
    <AnimatedMarker coordinate={region} {...common}>
      {body}
    </AnimatedMarker>
  );
});

/** Titik jemput (cincin biru + label), tujuan (pin merah + label) dan pool operator. */
export const PlaceMarker = React.memo(function PlaceMarker({ kind, lat, lng, label }: { kind: 'pickup' | 'dropoff' | 'base'; lat: number; lng: number; label: string }) {
  const s = useStyles();
  const track = useTrackChanges(kind);
  const caption = kind === 'pickup' ? t('Jemput') : kind === 'dropoff' ? t('Tujuan') : null;
  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={kind === 'dropoff' ? { x: 0.5, y: 1 } : { x: 0.5, y: 0.5 }}
      tracksViewChanges={track}
      title={label}
      zIndex={0}
      accessibilityLabel={caption ? `${caption}: ${label}` : label}
    >
      {kind === 'pickup' ? (
        <View style={s.placeWrap}>
          <View style={s.placeTag}><Txt variant="caption" bold tone="accentInk" maxFontSizeMultiplier={1.2} style={s.tagText}>{caption}</Txt></View>
          <View style={s.pickup}><View style={s.pickupDot} /></View>
        </View>
      ) : kind === 'dropoff' ? (
        <View style={s.placeWrap}>
          <View style={s.placeTag}><Txt variant="caption" bold tone="dangerInk" maxFontSizeMultiplier={1.2} style={s.tagText}>{caption}</Txt></View>
          <Icon name="map-marker" size={36} tone="dangerInk" />
        </View>
      ) : (
        <View style={s.base}><Icon name="warehouse" size={16} tone="inkSecondary" /></View>
      )}
    </Marker>
  );
});

const useStyles = makeStyles((c) => ({
  truckWrap: { alignItems: 'center', padding: 4 },
  halo: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  haloOn: { backgroundColor: c.accentSoft, borderWidth: 2, borderColor: c.accent },
  haloStale: { borderWidth: 2, borderStyle: 'dashed', borderColor: c.warnInk, opacity: 0.85 },
  tag: { marginTop: -4, backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: space.xs + 3, paddingVertical: 1, borderWidth: 1, borderColor: c.line },
  tagOn: { backgroundColor: c.accent, borderColor: c.accent },
  tagText: { fontSize: 11, lineHeight: 14 },
  placeWrap: { alignItems: 'center', padding: 2 },
  placeTag: { backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1, marginBottom: 3, borderWidth: 1, borderColor: c.line },
  pickup: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.accent },
  pickupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent },
  base: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.lineStrong },
}));
