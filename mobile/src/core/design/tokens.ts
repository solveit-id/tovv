import { Platform } from 'react-native';

/**
 * Token desain Tovv — arah "Nota Rangkap".
 * Warna merek diturunkan dari solveit-logo-*.svg (biru #1136D6–#19B8F2, navy #082A56, slate #5C7392).
 * Rasio kontras diuji di tokens.test.ts.
 */
export const color = {
  ground: '#F6F8FB',
  sheet: '#FFFFFF',
  sheetSunk: '#EEF2F7',
  rule: '#D5DDE8',
  ruleStrong: '#AEBBCD',

  ink: '#0D1B2E',
  inkSecondary: '#5C7392',
  inkDisabled: '#98A6BA',

  carbon: '#1136D6',
  carbonPressed: '#0C29A8',
  carbonTint: '#E8EDFD',

  navy: '#082A56',
  navyRaised: '#0F3769',
  onNavy: '#FFFFFF',
  onNavySecondary: '#B9C8E3',
  sky: '#19B8F2',

  serial: '#C42032',

  plyPink: '#F6D5DE',
  plyYellow: '#F7E6A1',
  plyBlue: '#D6E4FA',

  okInk: '#1A6B3C',
  okWash: '#E3F3E8',
  warnInk: '#8A5300',
  warnWash: '#FFF0CC',
  dangerInk: '#B42318',
  dangerWash: '#FDE8E6',
  neutralInk: '#43566F',
  neutralWash: '#EBEFF5',

  demoInk: '#082A56',
  demoWash: '#F7E6A1',

  scrim: 'rgba(8, 42, 86, 0.48)',
} as const;

export type ColorToken = keyof typeof color;

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
  cell: 4,
  sheet: 6,
  control: 8,
  pill: 999,
} as const;

/** Target sentuh minimum: 48 dp Android, ≥44 pt iOS. Satu nilai untuk satu bahasa desain. */
export const touch = {
  min: 48,
} as const;

const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const type = {
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  headline: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  titleSm: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  figure: { fontSize: 17, lineHeight: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  figureLg: { fontSize: 26, lineHeight: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  serial: { fontSize: 13, lineHeight: 18, fontWeight: '700', fontFamily: monoFamily, letterSpacing: 0.4 },
  mono: { fontSize: 13, lineHeight: 18, fontWeight: '400', fontFamily: monoFamily },
} as const;

export type TypeVariant = keyof typeof type;

/** Durasi dalam ms. Easing ada di motion.ts (bergantung Reanimated). */
export const duration = { fast: 140, base: 220, slow: 320, stamp: 260 } as const;

export const stroke = {
  hairline: 1,
  rule: 1.5,
  stage: 3,
} as const;
