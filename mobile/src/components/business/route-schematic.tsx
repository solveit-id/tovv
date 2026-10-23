import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import { radius, space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { Txt } from '@/components/ui/txt';
import type { Place } from '@/domain/types';
import { t } from '@/core/i18n';

interface Pt {
  lat: number;
  lng: number;
}

/**
 * Skema rute (bukan peta jalan): jemput → tujuan dalam proyeksi sederhana, jalur yang sudah ditempuh
 * utuh, sisa putus-putus. Dipakai saat penyedia peta belum dipasang (MAPS_MODE=simulated); diberi label.
 */
export function RouteSchematic({
  pickup,
  dropoff,
  position,
  stale,
  accuracyM,
  height = 168,
}: {
  pickup: Place;
  dropoff: Place;
  position: Pt | null;
  stale: boolean;
  accuracyM: number | null;
  height?: number;
}) {
  const color = useColors();
  const styles = useStyles();
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const pad = 28;
  const pts = [pickup, dropoff].filter((p): p is Place & { lat: number; lng: number } => p.lat !== null && p.lng !== null);
  const canDraw = w > 0 && pts.length === 2;
  let project = (p: Pt) => ({ x: 0, y: 0 });
  let metersToPx = 0;
  if (canDraw) {
    const a = pts[0]!;
    const b = pts[1]!;
    const minLat = Math.min(a.lat, b.lat);
    const maxLat = Math.max(a.lat, b.lat);
    const minLng = Math.min(a.lng, b.lng);
    const maxLng = Math.max(a.lng, b.lng);
    const spanLat = Math.max(maxLat - minLat, 0.01);
    const spanLng = Math.max(maxLng - minLng, 0.01);
    const scale = Math.min((w - pad * 2) / spanLng, (height - pad * 2) / spanLat);
    const offX = (w - spanLng * scale) / 2;
    const offY = (height - spanLat * scale) / 2;
    project = (p: Pt) => ({ x: offX + (p.lng - minLng) * scale, y: offY + (maxLat - p.lat) * scale });
    metersToPx = scale / 111_000;
  }
  const A = canDraw ? project(pts[0]!) : null;
  const B = canDraw ? project(pts[1]!) : null;
  const P = canDraw && position ? project(position) : null;
  const halo = accuracyM && metersToPx ? Math.max(6, accuracyM * metersToPx) : 0;

  return (
    <View
      style={[styles.box, { height }]}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('Skema rute simulasi dari {0} ke {1}{2}', [pickup.label, dropoff.label, position ? (stale ? ', posisi terakhir sudah lama' : ', posisi terakhir diterima') : ', posisi belum tersedia'])}
    >
      {canDraw && A && B ? (
        <Svg width={w} height={height}>
          <G opacity={0.55}>
            {Array.from({ length: Math.ceil(w / 24) }).map((_, i) => (
              <Line key={`v${i}`} x1={i * 24} y1={0} x2={i * 24} y2={height} stroke={color.line} strokeWidth={0.75} />
            ))}
            {Array.from({ length: Math.ceil(height / 24) }).map((_, i) => (
              <Line key={`h${i}`} x1={0} y1={i * 24} x2={w} y2={i * 24} stroke={color.line} strokeWidth={0.75} />
            ))}
          </G>
          <Line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={color.lineStrong} strokeWidth={3} strokeDasharray="6 6" strokeLinecap="round" />
          {P ? <Line x1={A.x} y1={A.y} x2={P.x} y2={P.y} stroke={color.accent} strokeWidth={4} strokeLinecap="round" /> : null}
          <Circle cx={A.x} cy={A.y} r={8} fill={color.ink} />
          <Circle cx={A.x} cy={A.y} r={3} fill={color.surface} />
          <Rect x={B.x - 7} y={B.y - 7} width={14} height={14} fill={color.surface} stroke={color.ink} strokeWidth={3} />
          {P ? (
            <G>
              {halo ? <Circle cx={P.x} cy={P.y} r={halo} fill={color.accent} opacity={0.12} /> : null}
              <Circle cx={P.x} cy={P.y} r={10} fill={stale ? color.surface : color.accent} stroke={color.accent} strokeWidth={3} strokeDasharray={stale ? '3 3' : undefined} />
              <Circle cx={P.x} cy={P.y} r={3.5} fill={stale ? color.accent : color.surface} />
            </G>
          ) : null}
        </Svg>
      ) : null}
      <View style={styles.legend} pointerEvents="none">
        <Txt variant="caption" tone="inkSecondary" style={{ fontWeight: '700' }} maxFontSizeMultiplier={1.3}>
          SKEMA SIMULASI · bukan peta sungguhan
        </Txt>
      </View>
    </View>
  );
}

const useStyles = makeStyles((color) => ({
  box: { backgroundColor: color.surfaceAlt, borderRadius: radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth * 2, borderColor: color.line },
  legend: { position: 'absolute', left: space.sm, bottom: space.sm, backgroundColor: color.legendWash, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
}));
