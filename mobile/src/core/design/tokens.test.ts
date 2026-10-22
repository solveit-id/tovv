import { color } from './tokens';
import { contrastRatio } from './contrast';

const AA_TEXT = 4.5;

describe('kontras token warna', () => {
  const textPairs: [string, string, string][] = [
    ['ink di sheet', color.ink, color.sheet],
    ['ink di ground', color.ink, color.ground],
    ['inkSecondary di sheet', color.inkSecondary, color.sheet],
    ['inkSecondary di ground', color.inkSecondary, color.ground],
    ['carbon di sheet', color.carbon, color.sheet],
    ['carbon di carbonTint', color.carbon, color.carbonTint],
    ['onNavy di navy', color.onNavy, color.navy],
    ['onNavySecondary di navy', color.onNavySecondary, color.navy],
    ['sky di navy', color.sky, color.navy],
    ['serial di sheet', color.serial, color.sheet],
    ['ok', color.okInk, color.okWash],
    ['warn', color.warnInk, color.warnWash],
    ['danger', color.dangerInk, color.dangerWash],
    ['neutral', color.neutralInk, color.neutralWash],
    ['demo', color.demoInk, color.demoWash],
    ['putih di carbon (tombol)', '#FFFFFF', color.carbon],
  ];

  it.each(textPairs)('%s memenuhi AA 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('garis sel cukup terlihat sebagai pemisah non-teks pada ground', () => {
    expect(contrastRatio(color.ruleStrong, color.sheet)).toBeGreaterThanOrEqual(1.9);
  });
});
