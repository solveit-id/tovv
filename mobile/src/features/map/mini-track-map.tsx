import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { radius, space } from '@/core/design/tokens';
import { makeStyles, useTheme } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TowTruckTop } from '@/components/brand/tow-truck';
import type { Place } from '@/domain/types';
import { bearing } from '@/core/format/geo';
import { t } from '@/core/i18n';
import { PlaceMarker } from './map-markers';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from './map-style';

/**
 * Peta kecil di layar perjalanan: rute jemput → tujuan dan posisi truk terakhir. Tidak bisa digeser
 * (agar layar tetap mudah digulir); ketuk "Buka peta" untuk peta langsung layar penuh.
 */
export function MiniTrackMap({ pickup, dropoff, position, stale, onExpand }: { pickup: Place; dropoff: Place; position: { lat: number; lng: number } | null; stale: boolean; onExpand: () => void }) {
  const s = useStyles();
  const { c, scheme } = useTheme();
  const reduced = useReducedMotion();
  const ref = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const a = pickup.lat !== null && pickup.lng !== null ? { latitude: pickup.lat, longitude: pickup.lng } : null;
  const b = dropoff.lat !== null && dropoff.lng !== null ? { latitude: dropoff.lat, longitude: dropoff.lng } : null;
  const truck = position ? { latitude: position.lat, longitude: position.lng } : null;
  const heading = position && b ? bearing(position, { lat: b.latitude, lng: b.longitude }) : 0;

  useEffect(() => {
    if (!ready) return;
    const pts = [a, b, truck].filter((p): p is { latitude: number; longitude: number } => !!p);
    if (pts.length) ref.current?.fitToCoordinates(pts, { edgePadding: { top: 48, right: 40, bottom: 40, left: 40 }, animated: !reduced });
    // Bingkai hanya dihitung ulang saat peta siap; pergeseran truk kecil tidak menggeser kamera.
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={s.wrap}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={{ latitude: truck?.latitude ?? a?.latitude ?? -7.29, longitude: truck?.longitude ?? a?.longitude ?? 112.74, latitudeDelta: 0.18, longitudeDelta: 0.18 }}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        userInterfaceStyle={scheme}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsPointsOfInterests={false}
        onMapReady={() => setReady(true)}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {a && b ? <Polyline coordinates={[a, b]} strokeColor={c.surface} strokeWidth={8} zIndex={1} /> : null}
        {a && b ? <Polyline coordinates={truck ? [truck, b] : [a, b]} strokeColor={c.inkMuted} strokeWidth={4} lineDashPattern={[10, 8]} zIndex={2} /> : null}
        {a && truck ? <Polyline coordinates={[a, truck]} strokeColor={c.accent} strokeWidth={6} zIndex={3} /> : null}
        {a ? <PlaceMarker kind="pickup" lat={a.latitude} lng={a.longitude} label={pickup.label} /> : null}
        {b ? <PlaceMarker kind="dropoff" lat={b.latitude} lng={b.longitude} label={dropoff.label} /> : null}
        {truck ? (
          <Marker coordinate={truck} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} zIndex={10}>
            <View style={[s.truck, stale && s.truckStale]}>
              <View style={{ transform: [{ rotate: `${Math.round(heading)}deg` }] }}>
                <TowTruckTop size={38} body={c.accent} />
              </View>
            </View>
          </Marker>
        ) : null}
      </MapView>
      <PressableScale depth="subtle" onPress={onExpand} accessibilityRole="button" accessibilityLabel={t('Buka peta langsung')} style={s.expand}>
        <Icon name="arrow-expand" size={16} tone="ink" />
        <Txt variant="caption" bold>Buka peta</Txt>
      </PressableScale>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { height: 220, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.line },
  truck: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  truckStale: { borderWidth: 2, borderStyle: 'dashed', borderColor: c.warnInk },
  expand: { position: 'absolute', right: space.sm, top: space.sm, flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
}));
