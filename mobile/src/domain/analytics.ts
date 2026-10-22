import type { DemoDb } from '@/data/demo/db';
import type { ExecutionStatus, Order, RequestStatus, Rupiah, TenantId } from './types';
import { agingBucket, allocationNet, invoiceBalance, invoiceNet, receiptUnapplied, type AgingBucket } from './ledger';

/**
 * ReportingReadService versi frontend (ARCHITECTURE §8): satu sumber untuk dashboard dan ekspor.
 * Formula PRD §7 M-01–M-12. `null` = tidak diketahui; 0 hanya bila query lengkap memastikan nol.
 */
export const FORMULA_VERSION = 'M-2.1';

export interface AnalyticsFilter {
  tenantIds: TenantId[];
  /** Interval [from, to) dalam UTC. */
  from: string;
  to: string;
  asOf: string;
  businessAccountId?: string | null;
  timezone?: string;
}

export interface Ratio {
  numerator: number;
  denominator: number;
  value: number | null;
}

export interface ContributionRow {
  orderId: string;
  alias: string;
  commercialNet: Rupiah;
  actualDirect: Rupiah | null;
  estimateDirect: Rupiah;
  fee: Rupiah;
  contribution: Rupiah | null;
  state: 'final' | 'provisional';
  reason: string | null;
}

export interface AnalyticsResult {
  filter: AnalyticsFilter;
  formulaVersion: string;
  requestsByStatus: Record<RequestStatus, string[]>;
  requestCount: number;
  ordersByStatus: Partial<Record<ExecutionStatus, string[]>>;
  orderCount: number;
  quotedRequestIds: string[];
  conversion: Ratio;
  completedOrderIds: string[];
  canceledOrderIds: string[];
  abortedOrderIds: string[];
  problematicOrderIds: string[];
  invoiceGross: Rupiah;
  creditTotal: Rupiah;
  invoiceNet: Rupiah;
  receiptGross: Rupiah;
  refundRecorded: Rupiah;
  netReceipts: Rupiah;
  allocationNet: Rupiah;
  receivable: Rupiah;
  unapplied: Rupiah;
  aging: Record<AgingBucket, Rupiah>;
  receivableInvoiceIds: string[];
  variance: { actual: Rupiah; estimate: Rupiah; delta: Rupiah; coverage: Ratio };
  contributions: ContributionRow[];
  contributionFinalTotal: Rupiah;
  contributionCoverage: Ratio;
  completeness: { costFinal: Ratio; evidenceComplete: Ratio; invoiced: Ratio };
}

const inRange = (iso: string | null | undefined, f: AnalyticsFilter) =>
  !!iso && Date.parse(iso) >= Date.parse(f.from) && Date.parse(iso) < Date.parse(f.to) && Date.parse(iso) <= Date.parse(f.asOf);
const upTo = (iso: string | null | undefined, asOf: string) => !!iso && Date.parse(iso) <= Date.parse(asOf);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const ratio = (n: number, d: number): Ratio => ({ numerator: n, denominator: d, value: d === 0 ? null : n / d });

/** Biaya langsung aktual: hanya bila biaya order final; selain itu null (bukan nol). */
export function actualDirect(db: DemoDb, order: Order): Rupiah | null {
  if (order.costCompleteness !== 'final') return null;
  return sum(db.expenses.filter((e) => e.orderId === order.id && e.status === 'approved').map((e) => e.amount));
}

/** commercial_net(order) = accepted quote + approved change orders − commercial credits. */
export function commercialNet(db: DemoDb, order: Order, asOf: string): Rupiah {
  const quote = db.quotes.find((q) => q.id === order.quoteId);
  const changes = sum(db.changeOrders.filter((c) => c.orderId === order.id && c.status === 'approved').map((c) => c.amount));
  const invoiceIds = db.invoices.filter((i) => i.orderId === order.id).map((i) => i.id);
  const credits = sum(db.creditNotes.filter((c) => invoiceIds.includes(c.invoiceId) && upTo(c.postedAt, asOf)).map((c) => c.amount));
  return (quote?.amount ?? 0) + changes - credits;
}

export function contributionFor(db: DemoDb, order: Order, asOf: string): ContributionRow {
  const net = commercialNet(db, order, asOf);
  const actual = actualDirect(db, order);
  const usage = db.usage.find((u) => u.orderId === order.id);
  const fee = order.planSnapshot.kind === 'success' && usage && usage.status === 'billable' ? usage.amount : 0;
  const disputed = order.evidence === 'disputed';
  const final = actual !== null && !disputed;
  return {
    orderId: order.id,
    alias: order.alias,
    commercialNet: net,
    actualDirect: actual,
    estimateDirect: order.estimateDirect,
    fee,
    contribution: final ? net - actual - fee : null,
    state: final ? 'final' : 'provisional',
    reason: actual === null ? 'Biaya aktual belum lengkap' : disputed ? 'Serah-terima berkeberatan' : null,
  };
}

export function computeAnalytics(db: DemoDb, filter: AnalyticsFilter): AnalyticsResult {
  const tz = filter.timezone ?? 'Asia/Jakarta';
  const scoped = <T extends { tenantId: TenantId }>(xs: T[]) => xs.filter((x) => filter.tenantIds.includes(x.tenantId));
  const byAccount = (requestId: string) => {
    if (!filter.businessAccountId) return true;
    return db.requests.find((r) => r.id === requestId)?.businessAccountId === filter.businessAccountId;
  };

  const requests = scoped(db.requests).filter((r) => inRange(r.createdAt, filter) && byAccount(r.id));
  const requestsByStatus = {
    draft: [], needs_review: [], ready_to_quote: [], quoted: [], converted: [], lost: [], canceled: [],
  } as Record<RequestStatus, string[]>;
  requests.forEach((r) => requestsByStatus[r.status].push(r.id));

  const orders = scoped(db.orders).filter((o) => inRange(o.confirmedAt, filter) && byAccount(o.requestId));
  const ordersByStatus: Partial<Record<ExecutionStatus, string[]>> = {};
  orders.forEach((o) => (ordersByStatus[o.status] ??= []).push(o.id));

  // M-03: cohort request yang pertama kali quote dikirim dalam periode.
  const quotedRequestIds = scoped(db.requests)
    .filter((r) => byAccount(r.id))
    .filter((r) => {
      const sent = db.quotes.filter((q) => q.requestId === r.id && q.sentAt).map((q) => Date.parse(q.sentAt!));
      if (!sent.length) return false;
      return inRange(new Date(Math.min(...sent)).toISOString(), filter);
    })
    .map((r) => r.id);
  const accepted = quotedRequestIds.filter((rid) => db.quotes.some((q) => q.requestId === rid && q.status === 'accepted' && upTo(q.acceptedAt, filter.asOf)));

  // M-04
  const allScopedOrders = scoped(db.orders).filter((o) => byAccount(o.requestId));
  const completed = allScopedOrders.filter((o) => inRange(o.handedOverAt, filter));
  const canceled = allScopedOrders.filter((o) => inRange(o.canceledAt, filter));
  const aborted = allScopedOrders.filter((o) => inRange(o.abortedAt, filter));
  const problematic = [...new Set(db.incidents.filter((i) => inRange(i.openedAt, filter)).map((i) => i.orderId))].filter((id) =>
    allScopedOrders.some((o) => o.id === id),
  );

  // M-05..M-08
  const invoices = scoped(db.invoices).filter((i) => byAccount(db.orders.find((o) => o.id === i.orderId)?.requestId ?? ''));
  const cohortInvoices = invoices.filter((i) => (i.status === 'issued' || i.status === 'corrected') && inRange(i.issuedAt, filter));
  const invoiceGross = sum(cohortInvoices.map((i) => i.gross));
  const invoiceNetTotal = sum(cohortInvoices.map((i) => invoiceNet(db, i.id, filter.asOf)));

  const invoiceIdSet = new Set(invoices.map((i) => i.id));
  const receipts = scoped(db.receipts).filter((r) => invoiceIdSet.has(r.invoiceId));
  const receiptGross = sum(receipts.filter((r) => inRange(r.postedAt, filter)).map((r) => r.amount));
  const receiptIds = new Set(receipts.map((r) => r.id));
  const reversals = sum(db.receiptReversals.filter((x) => receiptIds.has(x.receiptId) && inRange(x.postedAt, filter)).map((x) => x.amount));
  const refundRecorded = sum(db.refunds.filter((x) => receiptIds.has(x.receiptId) && x.status === 'recorded' && inRange(x.recordedAt, filter)).map((x) => x.amount));

  const openInvoices = invoices.filter((i) => (i.status === 'issued' || i.status === 'corrected') && upTo(i.issuedAt, filter.asOf));
  const aging: Record<AgingBucket, Rupiah> = { current: 0, '1-30': 0, '31-60': 0, '61+': 0, unknown: 0 };
  const receivableInvoiceIds: string[] = [];
  let receivable = 0;
  let allocTotal = 0;
  openInvoices.forEach((i) => {
    const b = invoiceBalance(db, i.id, filter.asOf, tz);
    allocTotal += allocationNet(db, i.id, filter.asOf);
    if (b.outstanding > 0) {
      receivable += b.outstanding;
      receivableInvoiceIds.push(i.id);
      aging[agingBucket(b, i.dueDate)] += b.outstanding;
    }
  });
  const unapplied = sum(receipts.map((r) => receiptUnapplied(db, r.id, filter.asOf)));

  // M-09, M-10, M-12
  const contributions = completed.map((o) => contributionFor(db, o, filter.asOf));
  const finals = contributions.filter((c) => c.state === 'final');
  const costPairs = completed.map((o) => ({ o, actual: actualDirect(db, o) })).filter((p) => p.actual !== null);
  const evidenceComplete = completed.filter((o) => o.evidence === 'complete').length;
  const invoiced = completed.filter((o) => invoices.some((i) => i.orderId === o.id && (i.status === 'issued' || i.status === 'corrected') && upTo(i.issuedAt, filter.asOf))).length;

  return {
    filter,
    formulaVersion: FORMULA_VERSION,
    requestsByStatus,
    requestCount: requests.length,
    ordersByStatus,
    orderCount: orders.length,
    quotedRequestIds,
    conversion: ratio(accepted.length, quotedRequestIds.length),
    completedOrderIds: completed.map((o) => o.id),
    canceledOrderIds: canceled.map((o) => o.id),
    abortedOrderIds: aborted.map((o) => o.id),
    problematicOrderIds: problematic,
    invoiceGross,
    creditTotal: invoiceGross - invoiceNetTotal,
    invoiceNet: invoiceNetTotal,
    receiptGross,
    refundRecorded,
    netReceipts: receiptGross - reversals - refundRecorded,
    allocationNet: allocTotal,
    receivable,
    unapplied,
    aging,
    receivableInvoiceIds,
    variance: {
      actual: sum(costPairs.map((p) => p.actual!)),
      estimate: sum(costPairs.map((p) => p.o.estimateDirect)),
      delta: sum(costPairs.map((p) => p.actual! - p.o.estimateDirect)),
      coverage: ratio(costPairs.length, completed.length),
    },
    contributions,
    contributionFinalTotal: sum(finals.map((c) => c.contribution!)),
    contributionCoverage: ratio(finals.length, completed.length),
    completeness: {
      costFinal: ratio(completed.filter((o) => o.costCompleteness === 'final').length, completed.length),
      evidenceComplete: ratio(evidenceComplete, completed.length),
      invoiced: ratio(invoiced, completed.length),
    },
  };
}

/** Periode demo PRD §8.1: [2026-09-22, 2026-10-22) WIB. */
export const DEMO_PERIOD = { from: '2026-09-21T17:00:00.000Z', to: '2026-10-21T17:00:00.000Z' };
