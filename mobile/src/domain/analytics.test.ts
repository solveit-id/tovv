import { buildF09 } from '@/data/fixtures/f09';
import { DEMO_CLOCK_C0 } from '@/core/format/time';
import { computeAnalytics, DEMO_PERIOD } from './analytics';
import { invoiceBalance, receiptUnapplied } from './ledger';
import type { TenantId } from './types';

/** Oracle PRD §8.3 — expected dihitung dari tabel dokumen, bukan dari fungsi yang diuji. */
const run = (tenantIds: TenantId[]) =>
  computeAnalytics(buildF09(), { tenantIds, ...DEMO_PERIOD, asOf: DEMO_CLOCK_C0 });

describe('oracle F-09 (PRD §8.3)', () => {
  const A = run(['tenant-a']);
  const B = run(['tenant-b']);
  const all = run(['tenant-a', 'tenant-b']);

  it('jumlah request, order dan request pernah quote', () => {
    expect([A.requestCount, B.requestCount, all.requestCount]).toEqual([16, 8, 24]);
    expect([A.orderCount, B.orderCount, all.orderCount]).toEqual([10, 4, 14]);
    expect([A.quotedRequestIds.length, B.quotedRequestIds.length, all.quotedRequestIds.length]).toEqual([13, 6, 19]);
  });

  it('konversi memakai request quoted sebagai penyebut', () => {
    expect(A.conversion).toMatchObject({ numerator: 10, denominator: 13 });
    expect(B.conversion).toMatchObject({ numerator: 4, denominator: 6 });
    expect(all.conversion.value!.toFixed(6)).toBe((14 / 19).toFixed(6));
  });

  it('status request dan order per tenant', () => {
    const counts = (m: Record<string, string[] | undefined>) => Object.fromEntries(Object.entries(m).filter(([, v]) => v && v.length).map(([k, v]) => [k, v!.length]));
    expect(counts(A.requestsByStatus)).toEqual({ converted: 10, quoted: 2, lost: 1, needs_review: 1, draft: 1, canceled: 1 });
    expect(counts(B.requestsByStatus)).toEqual({ converted: 4, quoted: 1, lost: 1, ready_to_quote: 1, draft: 1 });
    expect(counts(A.ordersByStatus)).toEqual({ closed: 5, handed_over: 1, in_transit: 1, confirmed: 1, canceled: 1, aborted: 1 });
    expect(counts(B.ordersByStatus)).toEqual({ closed: 2, handed_over: 1, assigned: 1 });
  });

  it('selesai dan bermasalah (tidak dijumlah sebagai partisi)', () => {
    expect([A.completedOrderIds.length, B.completedOrderIds.length]).toEqual([6, 3]);
    expect(all.problematicOrderIds.sort()).toEqual(['O-A06', 'O-A09', 'O-B03']);
  });

  it('invoice, penerimaan, refund, alokasi, piutang dan unapplied', () => {
    expect([A.invoiceGross, B.invoiceGross, all.invoiceGross]).toEqual([6_700_000, 4_200_000, 10_900_000]);
    expect([A.creditTotal, B.creditTotal]).toEqual([200_000, 0]);
    expect([A.invoiceNet, B.invoiceNet, all.invoiceNet]).toEqual([6_500_000, 4_200_000, 10_700_000]);
    expect([A.receiptGross, B.receiptGross, all.receiptGross]).toEqual([4_700_000, 1_800_000, 6_500_000]);
    expect([A.refundRecorded, B.refundRecorded]).toEqual([200_000, 0]);
    expect([A.netReceipts, B.netReceipts, all.netReceipts]).toEqual([4_500_000, 1_800_000, 6_300_000]);
    expect([A.allocationNet, B.allocationNet, all.allocationNet]).toEqual([4_300_000, 1_800_000, 6_100_000]);
    expect([A.receivable, B.receivable, all.receivable]).toEqual([2_200_000, 2_400_000, 4_600_000]);
    expect([A.unapplied, B.unapplied]).toEqual([200_000, 0]);
  });

  it('semua piutang overdue pada bucket 1–30 hari', () => {
    expect(all.aging['1-30']).toBe(4_600_000);
    expect(all.aging.current + all.aging['31-60'] + all.aging['61+'] + all.aging.unknown).toBe(0);
  });

  it('kontribusi final 2.150.000 (5/6) dan 880.000 (2/3); total 3.030.000 pada 7/9', () => {
    expect(A.contributionFinalTotal).toBe(2_150_000);
    expect(A.contributionCoverage).toMatchObject({ numerator: 5, denominator: 6 });
    expect(B.contributionFinalTotal).toBe(880_000);
    expect(B.contributionCoverage).toMatchObject({ numerator: 2, denominator: 3 });
    expect(all.contributionFinalTotal).toBe(3_030_000);
    expect(all.contributionCoverage).toMatchObject({ numerator: 7, denominator: 9 });
    const a04 = A.contributions.find((c) => c.alias === 'A04')!;
    expect(a04.contribution).toBeNull();
    const byAlias = Object.fromEntries(A.contributions.map((c) => [c.alias, c.contribution]));
    expect(byAlias).toMatchObject({ A01: 350_000, A02: 550_000, A03: 600_000, A05: 400_000, A10: 250_000 });
  });

  it('estimasi vs aktual hanya pasangan lengkap', () => {
    expect(A.variance).toMatchObject({ actual: 4_450_000, estimate: 4_200_000, delta: 250_000 });
    expect(B.variance).toMatchObject({ actual: 1_900_000, estimate: 1_750_000, delta: 150_000 });
  });

  it('kelengkapan M-12', () => {
    expect(A.completeness.evidenceComplete).toMatchObject({ numerator: 6, denominator: 6 });
    expect(B.completeness.evidenceComplete).toMatchObject({ numerator: 2, denominator: 3 });
    expect(A.completeness.invoiced).toMatchObject({ numerator: 5, denominator: 6 });
    expect(B.completeness.invoiced).toMatchObject({ numerator: 3, denominator: 3 });
  });
});

describe('koreksi A10 (PRD §5 contoh koreksi)', () => {
  const db = buildF09();
  it('invoice net 800.000, alokasi 800.000, saldo 0, unapplied 0', () => {
    const b = invoiceBalance(db, 'I-A10', DEMO_CLOCK_C0);
    expect(b).toMatchObject({ net: 800_000, allocated: 800_000, outstanding: 0, collection: 'settled' });
    expect(receiptUnapplied(db, 'RC-A10', DEMO_CLOCK_C0)).toBe(0);
  });
  it('A03 lebih bayar 200.000 menjadi unapplied, bukan saldo negatif', () => {
    expect(invoiceBalance(db, 'I-A03', DEMO_CLOCK_C0).outstanding).toBe(0);
    expect(receiptUnapplied(db, 'RC-A03', DEMO_CLOCK_C0)).toBe(200_000);
  });
  it('A02 sebagian: sisa 1.000.000 tetap piutang', () => {
    expect(invoiceBalance(db, 'I-A02', DEMO_CLOCK_C0)).toMatchObject({ outstanding: 1_000_000, collection: 'partially_paid' });
  });
});
