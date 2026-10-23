import { paletteFor, palettes } from './tokens';
import { contrastRatio } from './contrast';

const AA_TEXT = 4.5;

describe.each(Object.entries(palettes))('kontras palet %s', (_scheme, c) => {
  const textPairs: [string, string, string][] = [
    ['ink di surface', c.ink, c.surface],
    ['ink di bg', c.ink, c.bg],
    ['inkSecondary di surface', c.inkSecondary, c.surface],
    ['inkSecondary di bg', c.inkSecondary, c.bg],
    ['accentInk di surface', c.accentInk, c.surface],
    ['accentInk di accentSoft', c.accentInk, c.accentSoft],
    ['onAccent di accent (tombol)', c.onAccent, c.accent],
    ['onHero di heroFrom', c.onHero, c.heroFrom],
    ['onHero di heroTo', c.onHero, c.heroTo],
    ['onHeroSecondary di heroTo', c.onHeroSecondary, c.heroTo],
    ['onInverse di inverse (snackbar)', c.onInverse, c.inverse],
    ['ok', c.okInk, c.okWash],
    ['warn', c.warnInk, c.warnWash],
    ['danger', c.dangerInk, c.dangerWash],
    ['neutral', c.neutralInk, c.neutralWash],
    ['okInk di surface', c.okInk, c.surface],
    ['warnInk di surface', c.warnInk, c.surface],
    ['dangerInk di surface', c.dangerInk, c.surface],
    ['demo', c.demoInk, c.demoWash],
  ];

  it.each(textPairs)('%s memenuhi AA 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('garis tegas cukup terlihat sebagai pemisah non-teks', () => {
    expect(contrastRatio(c.lineStrong, c.surface)).toBeGreaterThanOrEqual(1.6);
  });
});

describe.each(['light', 'dark'] as const)('kontras mode driver (%s)', (scheme) => {
  const c = paletteFor(scheme, 'field');
  it.each([
    ['onHero di heroFrom', c.onHero, c.heroFrom],
    ['onHero di heroTo', c.onHero, c.heroTo],
    ['onHeroSecondary di heroTo', c.onHeroSecondary, c.heroTo],
    ['onModeAccent di modeAccent (tombol & pil mode)', c.onModeAccent, c.modeAccent],
    ['modeAccentInk di modeAccentSoft (tab aktif)', c.modeAccentInk, c.modeAccentSoft],
    ['modeAccentInk di surface', c.modeAccentInk, c.surface],
  ])('%s memenuhi AA 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('kunci palet mode driver sama dengan palet dasar', () => {
    expect(Object.keys(c).sort()).toEqual(Object.keys(palettes[scheme]).sort());
  });
});

describe.each(['light', 'dark'] as const)('kontras mode owner (%s)', (scheme) => {
  const c = paletteFor(scheme, 'brand');
  it('modeAccentInk di modeAccentSoft dan onModeAccent di modeAccent', () => {
    expect(contrastRatio(c.modeAccentInk, c.modeAccentSoft)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.onModeAccent, c.modeAccent)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
