import type { Rupiah } from './types';

/**
 * Kalkulator harga PRD §5 "Harga dan biaya". Semua integer rupiah; persen dalam basis point.
 * P = pendapatan jasa; D = biaya langsung; F = biaya SaaS per layanan + penanganan komersial;
 * A = alokasi tetap; R = cadangan; T = target surplus.
 */
export interface PricingInput {
  price: Rupiah;
  direct: Rupiah | null;
  allocation: Rupiah;
  reserve: Rupiah;
  feePerService: Rupiah;
  adminHandling: Rupiah;
  targetSurplus: Rupiah;
  /** Biaya komersial persentase dari P, basis point (0 ≤ bps < 10000). */
  percentFeeBps?: number;
}

export type PricingCertainty = 'incomplete' | 'loss' | 'below_target' | 'meets_target';

export interface PricingResult {
  fee: Rupiah;
  contribution: Rupiah | null;
  surplus: Rupiah | null;
  /** surplus / P dalam basis point; null jika P = 0 atau biaya belum lengkap. */
  marginBps: number | null;
  /** surplus / (D+F+A+R) dalam basis point. */
  markupBps: number | null;
  targetPrice: Rupiah | null;
  gapToTarget: Rupiah | null;
  certainty: PricingCertainty;
}

function assertBps(bps: number) {
  if (!Number.isInteger(bps) || bps < 0 || bps >= 10_000) {
    throw new RangeError('Persentase biaya komersial harus 0 ≤ r < 100%.');
  }
}

/** ceil(a / b) untuk integer non-negatif. */
function ceilDiv(a: number, b: number): number {
  return Math.floor((a + b - 1) / b);
}

export function percentFee(price: Rupiah, bps: number): Rupiah {
  assertBps(bps);
  return ceilDiv(price * bps, 10_000);
}

/** Harga target: D+F+A+R+T, atau ceil((D+A+R+f+T)/(1−r)) bila ada biaya persentase. */
export function targetPrice(input: Omit<PricingInput, 'price'>): Rupiah | null {
  if (input.direct === null) return null;
  const fixed = input.direct + input.allocation + input.reserve + input.feePerService + input.adminHandling + input.targetSurplus;
  const bps = input.percentFeeBps ?? 0;
  assertBps(bps);
  if (bps === 0) return fixed;
  let candidate = ceilDiv(fixed * 10_000, 10_000 - bps);
  // Harga hasil wajib dihitung ulang dengan pembulatan komponen ceil IDR.
  while (candidate - percentFee(candidate, bps) < fixed) candidate += 1;
  return candidate;
}

export function evaluatePrice(input: PricingInput): PricingResult {
  const bps = input.percentFeeBps ?? 0;
  const fee = input.feePerService + input.adminHandling + (bps ? percentFee(input.price, bps) : 0);
  const target = targetPrice(input);
  if (input.direct === null) {
    return {
      fee,
      contribution: null,
      surplus: null,
      marginBps: null,
      markupBps: null,
      targetPrice: null,
      gapToTarget: null,
      certainty: 'incomplete',
    };
  }
  const contribution = input.price - input.direct - fee;
  const surplus = contribution - input.allocation - input.reserve;
  const costBase = input.direct + fee + input.allocation + input.reserve;
  const marginBps = input.price === 0 ? null : Math.trunc((surplus * 10_000) / input.price);
  const markupBps = costBase === 0 ? null : Math.trunc((surplus * 10_000) / costBase);
  const gap = target === null ? null : input.price - target;
  const certainty: PricingCertainty =
    surplus < 0 ? 'loss' : gap !== null && gap < 0 ? 'below_target' : 'meets_target';
  return { fee, contribution, surplus, marginBps, markupBps, targetPrice: target, gapToTarget: gap, certainty };
}

/** Fixture F-01 (PRD §5) — kalkulator terisolasi, bukan transaksi F-09. */
export const F01: PricingInput = {
  price: 3_200_000,
  direct: 2_400_000,
  allocation: 300_000,
  reserve: 100_000,
  feePerService: 10_000,
  adminHandling: 4_000,
  targetSurplus: 400_000,
};

/** Fixture F-02: D+A+R+f = 2.810.000, r = 1%, T = 400.000. */
export const F02: Omit<PricingInput, 'price'> = {
  direct: 2_400_000,
  allocation: 300_000,
  reserve: 100_000,
  feePerService: 10_000,
  adminHandling: 0,
  targetSurplus: 400_000,
  percentFeeBps: 100,
};
