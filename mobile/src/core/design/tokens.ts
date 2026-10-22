import { Platform } from 'react-native';

/**
 * Token desain Tovv — standar super-app/fintech (patokan Gojek/GoPay, Grab/Tokopedia, Jago/Jenius).
 * Biru merek diturunkan dari logo Solveit (#1136D6 → #19B8F2). Dua palet dengan kunci yang sama:
 * terang dan gelap, dipilih mengikuti sistem atau preferensi pengguna (lihat theme.tsx).
 * Rasio kontras kedua palet diuji di tokens.test.ts.
 */
const light = {
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F8',
  surfacePressed: '#E8EEFB',
  line: '#E3E8F0',
  lineStrong: '#C3CDDB',

  ink: '#0E1726',
  inkSecondary: '#56657B',
  inkMuted: '#8D99AC',

  accent: '#1136D6',
  accentPressed: '#0C29A8',
  accentSoft: '#E8EEFF',
  accentInk: '#1136D6',
  onAccent: '#FFFFFF',

  heroFrom: '#0D2EC2',
  heroTo: '#1766D1',
  heroGlow: '#19B8F2',
  onHero: '#FFFFFF',
  onHeroSecondary: '#E3ECFF',
  heroChip: 'rgba(255, 255, 255, 0.16)',

  inverse: '#111A2B',
  onInverse: '#FFFFFF',

  okInk: '#146C38',
  okWash: '#E2F5E9',
  warnInk: '#8A5300',
  warnWash: '#FFF1D6',
  dangerInk: '#B42318',
  dangerWash: '#FDECEA',
  neutralInk: '#45556C',
  neutralWash: '#EDF1F6',

  badge: '#E5372B',
  brandSky: '#19B8F2',

  demoInk: '#3A2C00',
  demoWash: '#FFD84D',
  demoRule: '#E9BE1F',

  shadow: '#0E1726',
  scrim: 'rgba(7, 12, 24, 0.5)',
  cameraGround: '#000000',
  overlayInk: 'rgba(14, 23, 38, 0.78)',
  legendWash: 'rgba(255, 255, 255, 0.9)',
  skeleton: '#E4E9F1',
};

export type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  bg: '#0A0F17',
  surface: '#141B26',
  surfaceAlt: '#1B2431',
  surfacePressed: '#1F2B3D',
  line: '#253042',
  lineStrong: '#3B4A60',

  ink: '#EDF1F7',
  inkSecondary: '#A1AEC1',
  inkMuted: '#66748A',

  accent: '#2F5EF5',
  accentPressed: '#244ED6',
  accentSoft: '#18264A',
  accentInk: '#8EAEFF',
  onAccent: '#FFFFFF',

  heroFrom: '#0C1D5E',
  heroTo: '#133C94',
  heroGlow: '#1C8FD0',
  onHero: '#FFFFFF',
  onHeroSecondary: '#D3DEF7',
  heroChip: 'rgba(255, 255, 255, 0.12)',

  inverse: '#E9EEF6',
  onInverse: '#0E1726',

  okInk: '#63D394',
  okWash: '#11301E',
  warnInk: '#F4BC52',
  warnWash: '#33250A',
  dangerInk: '#FF8F85',
  dangerWash: '#3A1714',
  neutralInk: '#B6C2D2',
  neutralWash: '#1E2834',

  badge: '#FF5A4E',
  brandSky: '#3CC6F5',

  demoInk: '#3A2C00',
  demoWash: '#FFD84D',
  demoRule: '#E9BE1F',

  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.6)',
  cameraGround: '#000000',
  overlayInk: 'rgba(10, 15, 23, 0.82)',
  legendWash: 'rgba(20, 27, 38, 0.9)',
  skeleton: '#1E2836',
};

export const palettes = { light, dark } as const;
export type Scheme = keyof typeof palettes;
export type ColorToken = keyof Palette;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

/** Target sentuh minimum: 48 dp Android, ≥44 pt iOS. Satu nilai untuk satu bahasa desain. */
export const touch = {
  min: 48,
} as const;

const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/** Skala tipe font sistem (SF Pro / Roboto). Ukuran mengikuti pengaturan teks sistem. */
export const type = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.2 },
  headline: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  titleSm: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  figure: { fontSize: 17, lineHeight: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  figureLg: { fontSize: 26, lineHeight: 32, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  figureXl: { fontSize: 32, lineHeight: 38, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
  mono: { fontSize: 13, lineHeight: 18, fontWeight: '500', fontFamily: monoFamily },
} as const;

export type TypeVariant = keyof typeof type;

/** Durasi dalam ms. Easing dan pegas ada di motion.ts (bergantung Reanimated). */
export const duration = { fast: 140, base: 240, slow: 360, count: 700 } as const;

export const stroke = {
  hairline: 1,
  rule: 1.5,
  stage: 3,
} as const;

/**
 * Bayangan lembut berarah ke bawah. Di tema gelap bayangan hampir tak terlihat,
 * jadi kartu memakai garis tipis `line` sebagai gantinya (lihat Card).
 */
export function elevation(level: 1 | 2 | 3, c: Palette) {
  const spec = { 1: [0.07, 10, 2], 2: [0.1, 18, 6], 3: [0.18, 26, 10] }[level];
  const [opacity, blur, y] = spec as [number, number, number];
  const n = parseInt(c.shadow.slice(1), 16);
  const rgba = `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
  // boxShadow (arsitektur baru RN) mengikuti borderRadius di kedua OS; elevation Android tidak selalu.
  return { boxShadow: `0px ${y}px ${blur}px ${rgba}` };
}

/** Kerangka permukaan kartu: bayangan lembut di tema terang, garis tipis di tema gelap. */
export function cardChrome(c: Palette, scheme: Scheme, level: 1 | 2 | 3 = 1) {
  return scheme === 'dark' ? { borderWidth: 1, borderColor: c.line } : elevation(level, c);
}
