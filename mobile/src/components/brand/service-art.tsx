import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useColors } from '@/core/design/theme';
import type { Palette } from '@/core/design/tokens';
import type { ServiceKind } from '@/domain/types';
import { TowTruckArt } from './tow-truck';

/**
 * Ilustrasi paket layanan Tovv (tampak samping, menghadap kanan, kanvas 320×132 yang sama dengan
 * TowTruckArt supaya sejajar di kartu). Vektor dengan warna token, ikut tema terang/gelap.
 */

function Wheel({ cx, cy = 104, r = 13, c }: { cx: number; cy?: number; r?: number; c: Palette }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r + 2.5} fill={c.illoSteel} />
      <Circle cx={cx} cy={cy} r={r} fill={c.illoTire} />
      <Circle cx={cx} cy={cy} r={r * 0.5} fill={c.illoRim} />
    </G>
  );
}

/** Kabin truk kecil (dipakai Car Carrier dan Storing Motor), ujung depan di x = 308. */
function Cab({ c, x = 0 }: { c: Palette; x?: number }) {
  return (
    <G transform={`translate(${x} 0)`}>
      <Path d="M250 96 V58 Q250 48 260 48 H280 Q286 48 290 53 L302 68 Q310 70 310 80 V90 Q310 96 304 96 Z" fill={c.illoBody} />
      <Path d="M250 86 H310 V90 Q310 96 304 96 H250 Z" fill={c.illoBodyShade} />
      <Path d="M256 55 Q256 53 258 53 H279 Q282 53 284 56 L294 68 H256 Z" fill={c.illoGlass} />
      <Rect x={262} y={42} width={18} height={6} rx={3} fill={c.illoBeacon} />
      <Rect x={302} y={74} width={8} height={5} rx={2} fill={c.illoBeacon} opacity={0.75} />
    </G>
  );
}

/** Mobil kecil 70×24 untuk muatan car carrier; `y` = tepi bawah roda. */
function MiniCar({ x, y, fill, shade, c }: { x: number; y: number; fill: string; shade: string; c: Palette }) {
  return (
    <G transform={`translate(${x} ${y - 24})`}>
      <Path d="M0 15 Q0 10 5 9 L17 7 L27 1 H48 Q53 1 57 5 L63 10 Q70 11 70 15 V19 H0 Z" fill={fill} />
      <Path d="M0 15 H70 V19 H0 Z" fill={shade} />
      <Path d="M22 9 L29 3 H38 V9 Z M41 3 H48 Q51 3 54 6 L57 9 H41 Z" fill={c.illoGlass} />
      <Circle cx={15} cy={19} r={5} fill={c.illoTire} />
      <Circle cx={55} cy={19} r={5} fill={c.illoTire} />
      <Circle cx={15} cy={19} r={2.2} fill={c.illoRim} />
      <Circle cx={55} cy={19} r={2.2} fill={c.illoRim} />
    </G>
  );
}

export const CarCarrierArt = React.memo(function CarCarrierArt({ width = 240 }: { width?: number }) {
  const c = useColors();
  const cars = [
    { fill: c.illoCar, shade: c.illoCarShade },
    { fill: c.illoBodyLight, shade: c.illoBody },
    { fill: c.illoRim, shade: c.illoSteelLight },
  ];
  return (
    <Svg width={width} height={(width * 132) / 320} viewBox="0 0 320 132" importantForAccessibility="no-hide-descendants">
      <Ellipse cx={160} cy={122} rx={152} ry={6} fill={c.illoGround} />
      {/* Rangka trailer dua tingkat */}
      <Rect x={6} y={90} width={244} height={7} rx={2} fill={c.illoSteel} />
      <Rect x={6} y={58} width={236} height={5} rx={2} fill={c.illoSteelLight} />
      {[8, 86, 164, 238].map((x) => (
        <Rect key={x} x={x} y={58} width={4} height={34} rx={1.5} fill={c.illoSteel} />
      ))}
      {[0, 1, 2].map((i) => (
        <MiniCar key={`b${i}`} x={14 + i * 76} y={90} fill={cars[i]!.fill} shade={cars[i]!.shade} c={c} />
      ))}
      {[0, 1, 2].map((i) => (
        <MiniCar key={`t${i}`} x={14 + i * 76} y={58} fill={cars[(i + 1) % 3]!.fill} shade={cars[(i + 1) % 3]!.shade} c={c} />
      ))}
      <Cab c={c} />
      {[40, 70, 196, 226, 286].map((x) => (
        <Wheel key={x} cx={x} r={11} c={c} />
      ))}
    </Svg>
  );
});

export const MotorStoringArt = React.memo(function MotorStoringArt({ width = 240 }: { width?: number }) {
  const c = useColors();
  return (
    <Svg width={width} height={(width * 132) / 320} viewBox="0 0 320 132" importantForAccessibility="no-hide-descendants">
      <Ellipse cx={172} cy={122} rx={140} ry={6} fill={c.illoGround} />
      {/* Bak dengan pagar rendah dan rel naik */}
      <Rect x={70} y={94} width={180} height={8} rx={3} fill={c.illoSteel} />
      <Rect x={74} y={82} width={170} height={12} rx={2} fill={c.illoSteelLight} />
      <Path d="M74 82 V66 M120 82 V66 M166 82 V66 M212 82 V66 M74 68 H244" stroke={c.illoSteel} strokeWidth={3} strokeLinecap="round" />
      <Path d="M74 86 L22 118" stroke={c.illoSteel} strokeWidth={5} strokeLinecap="round" />
      <Path d="M74 92 L30 118" stroke={c.illoRim} strokeWidth={3} strokeLinecap="round" />
      {/* Motor besar di atas bak */}
      <G>
        <Circle cx={112} cy={70} r={12} fill={c.illoTire} />
        <Circle cx={112} cy={70} r={5} fill={c.illoRim} />
        <Circle cx={192} cy={70} r={12} fill={c.illoTire} />
        <Circle cx={192} cy={70} r={5} fill={c.illoRim} />
        <Path d="M112 70 L136 54 H170 L192 70" stroke={c.illoSteel} strokeWidth={4} strokeLinejoin="round" fill="none" />
        <Path d="M132 56 Q134 44 150 44 H166 Q174 44 176 52 L172 58 H136 Z" fill={c.illoCar} />
        <Path d="M120 50 Q122 46 128 46 H146 L142 54 H122 Z" fill={c.illoTire} />
        <Path d="M176 50 L188 40 M184 38 H194" stroke={c.illoSteel} strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M188 44 L192 70" stroke={c.illoRim} strokeWidth={3} />
        <Path d="M104 82 L112 70 M200 82 L192 70" stroke={c.illoBeacon} strokeWidth={2.5} strokeLinecap="round" />
      </G>
      <Cab c={c} />
      {[110, 222, 286].map((x) => (
        <Wheel key={x} cx={x} r={12} c={c} />
      ))}
    </Svg>
  );
});

export const SelfDriveArt = React.memo(function SelfDriveArt({ width = 240 }: { width?: number }) {
  const c = useColors();
  return (
    <Svg width={width} height={(width * 132) / 320} viewBox="0 0 320 132" importantForAccessibility="no-hide-descendants">
      <Ellipse cx={170} cy={122} rx={140} ry={6} fill={c.illoGround} />
      <Path d="M8 126 H312" stroke={c.illoRim} strokeWidth={3} strokeDasharray="22 16" strokeLinecap="round" />
      <Path d="M6 70 H40 M14 84 H44 M2 98 H34" stroke={c.illoRim} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      {/* Sedan pelanggan */}
      <Path d="M52 92 Q52 78 66 74 L112 66 L146 44 Q152 40 162 40 H220 Q234 40 244 50 L264 68 L282 72 Q298 76 298 92 V100 Q298 106 292 106 H58 Q52 106 52 100 Z" fill={c.illoCar} />
      <Path d="M52 92 H298 V100 Q298 106 292 106 H58 Q52 106 52 100 Z" fill={c.illoCarShade} />
      <Path d="M132 66 L152 48 Q155 46 160 46 H190 V66 Z" fill={c.illoGlass} />
      <Path d="M196 46 H220 Q230 46 238 54 L252 66 H196 Z" fill={c.illoGlass} />
      {/* Sopir di balik kemudi */}
      <Circle cx={216} cy={55} r={6} fill={c.illoSteel} />
      <Path d="M206 66 Q206 61 216 61 Q226 61 226 66 Z" fill={c.illoSteel} />
      <Path d="M230 58 L236 66" stroke={c.illoSteel} strokeWidth={3} strokeLinecap="round" />
      <Rect x={286} y={78} width={10} height={6} rx={2} fill={c.illoBeacon} opacity={0.8} />
      <Path d="M193 70 V98" stroke={c.illoCarShade} strokeWidth={1.5} />
      <Wheel cx={104} cy={104} r={16} c={c} />
      <Wheel cx={248} cy={104} r={16} c={c} />
    </Svg>
  );
});

/** Ilustrasi sesuai paket layanan. */
export function ServiceArt({ kind, width = 200 }: { kind: ServiceKind; width?: number }) {
  if (kind === 'car_carrier') return <CarCarrierArt width={width} />;
  if (kind === 'motor_storing') return <MotorStoringArt width={width} />;
  if (kind === 'self_drive') return <SelfDriveArt width={width} />;
  return <TowTruckArt width={width} loaded />;
}
