import { evaluatePrice, F01, F02, percentFee, targetPrice } from './pricing';

describe('kalkulator harga PRD §5', () => {
  it('F-01 menghasilkan contribution 786.000, surplus 386.000, target 3.214.000', () => {
    const r = evaluatePrice(F01);
    expect(r.contribution).toBe(786_000);
    expect(r.surplus).toBe(386_000);
    expect(r.targetPrice).toBe(3_214_000);
    expect(r.gapToTarget).toBe(-14_000);
    expect(r.certainty).toBe('below_target');
  });

  it('F-02 target persentase = ceil(3.210.000/0,99) = 3.242.425 dan dihitung ulang', () => {
    const t = targetPrice(F02);
    expect(t).toBe(3_242_425);
    expect(t! - percentFee(t!, 100)).toBe(3_210_000);
  });

  it('biaya langsung yang hilang bukan nol: hasil null dan berlabel incomplete', () => {
    const r = evaluatePrice({ ...F01, direct: null });
    expect(r.contribution).toBeNull();
    expect(r.surplus).toBeNull();
    expect(r.certainty).toBe('incomplete');
  });

  it('P = 0 memberi margin null, bukan pembagian nol', () => {
    const r = evaluatePrice({ ...F01, price: 0 });
    expect(r.marginBps).toBeNull();
    expect(r.certainty).toBe('loss');
  });

  it('r = 100% atau negatif ditolak', () => {
    expect(() => targetPrice({ ...F02, percentFeeBps: 10_000 })).toThrow(RangeError);
    expect(() => targetPrice({ ...F02, percentFeeBps: -1 })).toThrow(RangeError);
  });

  it('harga di atas target memenuhi target', () => {
    expect(evaluatePrice({ ...F01, price: 3_300_000 }).certainty).toBe('meets_target');
  });
});
