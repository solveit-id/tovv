import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { space } from '@/core/design/tokens';
import { makeStyles, useColors } from '@/core/design/theme';
import { useReducedMotion } from '@/core/design/motion';
import { Txt } from '@/components/ui/txt';
import { t, tr } from '@/core/i18n';

/**
 * Ilustrasi unit towing flatbed Tovv (tampak samping, menghadap kanan): kabin biru merek, lampu rotari
 * kuning, dek baja, dan — bila `loaded` — mobil pelanggan yang diikat di atas dek. Vektor (SVG) dengan
 * warna dari palet aktif, jadi tajam di semua kepadatan layar dan ikut tema terang/gelap.
 */
export const TowTruckArt = React.memo(function TowTruckArt({ width = 240, loaded = false, accessibilityLabel }: { width?: number; loaded?: boolean; accessibilityLabel?: string }) {
  const c = useColors();
  const height = (width * 132) / 320;
  const wheel = (cx: number) => (
    <G key={cx}>
      <Circle cx={cx} cy={104} r={17} fill={c.illoSteel} />
      <Circle cx={cx} cy={104} r={14} fill={c.illoTire} />
      <Circle cx={cx} cy={104} r={7} fill={c.illoRim} />
      <Circle cx={cx} cy={104} r={2.5} fill={c.illoSteel} />
    </G>
  );
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 320 132"
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel ? tr(accessibilityLabel) : undefined}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      <Ellipse cx={162} cy={122} rx={146} ry={6} fill={c.illoGround} />
      {/* Sasis dan dek flatbed */}
      <Rect x={30} y={94} width={250} height={8} rx={3} fill={c.illoSteel} />
      <Path d="M4 92 L14 82 H204 V96 H14 Z" fill={c.illoSteelLight} />
      <Rect x={14} y={82} width={190} height={3} fill={c.illoRim} opacity={0.7} />
      {[24, 58, 92, 126, 160].map((x) => (
        <Rect key={x} x={x} y={88} width={14} height={4} rx={1} fill={c.illoBeacon} opacity={0.85} />
      ))}
      {/* Kepala dek dan lampu belakang */}
      <Rect x={198} y={48} width={9} height={48} rx={2} fill={c.illoSteel} />
      <Rect x={6} y={86} width={5} height={5} rx={1} fill={c.illoCarShade} />
      {/* Kabin */}
      <Path d="M210 96 V54 Q210 44 220 44 H246 Q252 44 256 49 L270 65 H290 Q300 65 302 75 L305 90 Q305 96 299 96 Z" fill={c.illoBody} />
      <Path d="M210 84 H304 L305 90 Q305 96 299 96 H210 Z" fill={c.illoBodyShade} />
      <Path d="M216 52 Q216 49 219 49 H244 Q248 49 250 52 L262 64 H216 Z" fill={c.illoGlass} />
      <Path d="M222 51 H229 L221 61 V54 Z" fill={c.onAccent} opacity={0.4} />
      <Path d="M246 66 V88" stroke={c.illoBodyShade} strokeWidth={1.5} />
      <Rect x={236} y={70} width={7} height={2.5} rx={1.2} fill={c.illoBodyShade} />
      <Rect x={258} y={53} width={3.5} height={9} rx={1.5} fill={c.illoSteel} />
      <Rect x={296} y={72} width={8} height={5} rx={2} fill={c.illoBeacon} opacity={0.75} />
      <Rect x={293} y={90} width={14} height={7} rx={2.5} fill={c.illoSteel} />
      <Path d="M212 50 Q213 46 218 46 H230" stroke={c.illoBodyLight} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.7} />
      {/* Lampu rotari */}
      <Rect x={221} y={38} width={22} height={6} rx={3} fill={c.illoBeacon} />
      <Rect x={228} y={38} width={8} height={6} rx={2} fill={c.onAccent} opacity={0.45} />
      {loaded ? (
        <G>
          <Path d="M60 85 L55 79 M158 85 L163 79" stroke={c.illoBeacon} strokeWidth={2.5} strokeLinecap="round" />
          {/* Mobil pelanggan yang diikat di atas dek; roda tepat di permukaan dek (y 82) */}
          <G transform="translate(0 -5)">
          <Path d="M34 72 Q34 64 42 62 L70 58 L92 44 Q96 42 102 42 H140 Q148 42 154 48 L166 60 L176 62 Q184 64 184 72 V76 Q184 78 182 78 H36 Q34 78 34 76 Z" fill={c.illoCar} />
          <Path d="M34 72 H184 V76 Q184 78 182 78 H36 Q34 78 34 76 Z" fill={c.illoCarShade} />
          <Path d="M86 58 L98 47 Q100 46 103 46 H120 V58 Z" fill={c.illoGlass} />
          <Path d="M124 46 H139 Q145 46 150 51 L158 58 H124 Z" fill={c.illoGlass} />
          <Rect x={178} y={66} width={6} height={4} rx={1.5} fill={c.illoBeacon} opacity={0.8} />
          {[64, 154].map((cx) => (
            <G key={cx}>
              <Circle cx={cx} cy={78} r={9} fill={c.illoTire} />
              <Circle cx={cx} cy={78} r={4.5} fill={c.illoRim} />
            </G>
          ))}
          </G>
        </G>
      ) : null}
      {[58, 94, 272].map(wheel)}
    </Svg>
  );
});

/**
 * Unit towing tampak atas (menghadap ke atas) untuk penanda peta. `body` = warna kabin sesuai status unit.
 * Diputar oleh pemanggil sesuai arah gerak.
 */
export const TowTruckTop = React.memo(function TowTruckTop({ size = 40, body }: { size?: number; body: string }) {
  const c = useColors();
  return (
    <Svg width={size * 0.5} height={size} viewBox="0 0 28 56">
      <Rect x={3} y={4} width={22} height={52} rx={5} fill={c.shadow} opacity={0.18} />
      <Rect x={3} y={17} width={22} height={37} rx={3} fill={c.illoSteelLight} />
      {[23, 29, 35, 41, 47].map((y) => (
        <Rect key={y} x={5} y={y} width={18} height={1.6} rx={0.8} fill={c.illoSteel} />
      ))}
      <Rect x={0.5} y={7} width={2.5} height={5} rx={1} fill={c.illoSteel} />
      <Rect x={25} y={7} width={2.5} height={5} rx={1} fill={c.illoSteel} />
      <Rect x={2} y={1} width={24} height={17} rx={6} fill={body} stroke={c.onAccent} strokeWidth={1.5} />
      <Rect x={5} y={3} width={18} height={5} rx={2} fill={c.illoGlass} />
      <Rect x={8} y={11.5} width={12} height={3} rx={1.5} fill={c.illoBeacon} />
    </Svg>
  );
});

const ROAD_DASH = 22;

/**
 * Loader bermerek: unit towing berjalan di atas marka jalan yang bergerak. Dipakai saat menunggu yang
 * lebih lama dari sekejap (membuka peta, menyiapkan data, mengirim). Hanya berjalan selama tampil;
 * "kurangi gerakan" = gambar diam dengan teks.
 */
export function TowLoader({ label = 'Sebentar, ya…', width = 168, loaded = true }: { label?: string; width?: number; loaded?: boolean }) {
  const s = useStyles();
  const reduced = useReducedMotion();
  const road = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    road.value = withRepeat(withTiming(1, { duration: 520, easing: Easing.linear }), -1, false);
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 260, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) })), -1, false);
    return () => {
      cancelAnimation(road);
      cancelAnimation(bob);
    };
  }, [reduced, road, bob]);
  const roadStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -road.value * ROAD_DASH * 2 }] }));
  const truckStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 1.5 }] }));
  const dashes = Math.ceil(width / (ROAD_DASH * 2)) + 2;
  return (
    <View style={s.loader} accessible accessibilityRole="progressbar" accessibilityLabel={t(label)} accessibilityLiveRegion="polite">
      <Animated.View style={truckStyle}>
        <TowTruckArt width={width} loaded={loaded} />
      </Animated.View>
      <View style={[s.road, { width }]}>
        <Animated.View style={[s.dashes, roadStyle]}>
          {Array.from({ length: dashes }).map((_, i) => (
            <View key={i} style={s.dash} />
          ))}
        </Animated.View>
      </View>
      {label ? <Txt variant="bodySm" tone="inkSecondary" align="center">{label}</Txt> : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  loader: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xl },
  road: { height: 4, overflow: 'hidden', borderRadius: 2, marginTop: -space.sm },
  dashes: { flexDirection: 'row', gap: ROAD_DASH },
  dash: { width: ROAD_DASH, height: 4, borderRadius: 2, backgroundColor: c.lineStrong },
}));
