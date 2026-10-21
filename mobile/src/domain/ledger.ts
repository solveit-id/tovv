import type {
  Allocation,
  AllocationReversal,
  CollectionStatus,
  CreditNote,
  Invoice,
  Receipt,
  ReceiptReversal,
  RefundRecord,
  Rupiah,
} from './types';
import { diffLocalDays, localDate } from '@/core/format/time';

/** Baris ledger yang diperlukan untuk menghitung saldo (PRD §5 "Pembayaran tanpa gateway"). */
export interface LedgerRows {
  invoices: Invoice[];
  creditNotes: CreditNote[];
  receipts: Receipt[];
  allocations: Allocation[];
  allocationReversals: AllocationReversal[];
  receiptReversals: ReceiptReversal[];
  refunds: RefundRecord[];
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const before = (iso: string | null, asOf: string) => iso !== null && Date.parse(iso) <= Date.parse(asOf);

function counted(inv: Invoice): boolean {
  return inv.status === 'issued' || inv.status === 'corrected';
}

/** Invoice net = issued amount − credit notes posted (sampai as_of). */
export function invoiceNet(rows: LedgerRows, invoiceId: string, asOf: string): Rupiah {
  const inv = rows.invoices.find((i) => i.id === invoiceId);
  if (!inv || !counted(inv) || !before(inv.issuedAt, asOf)) return 0;
  const credits = sum(rows.creditNotes.filter((c) => c.invoiceId === invoiceId && before(c.postedAt, asOf)).map((c) => c.amount));
  return Math.max(0, inv.gross - credits);
}

/** Allocation net per invoice = alokasi posted − reversal. */
export function allocationNet(rows: LedgerRows, invoiceId: string, asOf: string): Rupiah {
  const allocs = rows.allocations.filter((a) => a.invoiceId === invoiceId && before(a.postedAt, asOf));
  const ids = new Set(allocs.map((a) => a.id));
  const reversed = sum(rows.allocationReversals.filter((r) => ids.has(r.allocationId) && before(r.postedAt, asOf)).map((r) => r.amount));
  return sum(allocs.map((a) => a.amount)) - reversed;
}

export function outstanding(rows: LedgerRows, invoiceId: string, asOf: string): Rupiah {
  return Math.max(0, invoiceNet(rows, invoiceId, asOf) - allocationNet(rows, invoiceId, asOf));
}

export interface InvoiceBalance {
  invoiceId: string;
  gross: Rupiah;
  credit: Rupiah;
  net: Rupiah;
  allocated: Rupiah;
  outstanding: Rupiah;
  collection: CollectionStatus;
  fullyCredited: boolean;
  overdueDays: number | null;
}

export function invoiceBalance(rows: LedgerRows, invoiceId: string, asOf: string, tz = 'Asia/Jakarta'): InvoiceBalance {
  const inv = rows.invoices.find((i) => i.id === invoiceId);
  const net = invoiceNet(rows, invoiceId, asOf);
  const allocated = allocationNet(rows, invoiceId, asOf);
  const due = Math.max(0, net - allocated);
  const credit = inv ? Math.max(0, inv.gross - net) : 0;
  const collection: CollectionStatus = due === 0 ? 'settled' : allocated > 0 ? 'partially_paid' : 'unpaid';
  const today = localDate(asOf, tz);
  const overdueDays = inv?.dueDate && due > 0 && inv.dueDate < today ? diffLocalDays(inv.dueDate, today) : null;
  return {
    invoiceId,
    gross: inv?.gross ?? 0,
    credit,
    net,
    allocated,
    outstanding: due,
    collection,
    fullyCredited: !!inv && inv.gross > 0 && net === 0,
    overdueDays,
  };
}

/** Receipt available = posted − reversal − refund recorded − allocation net. Sisa positif = unapplied, bukan wallet. */
export function receiptUnapplied(rows: LedgerRows, receiptId: string, asOf: string): Rupiah {
  const r = rows.receipts.find((x) => x.id === receiptId);
  if (!r || !before(r.postedAt, asOf)) return 0;
  const reversed = sum(rows.receiptReversals.filter((x) => x.receiptId === receiptId && before(x.postedAt, asOf)).map((x) => x.amount));
  const refunded = sum(rows.refunds.filter((x) => x.receiptId === receiptId && x.status === 'recorded' && before(x.recordedAt, asOf)).map((x) => x.amount));
  const allocs = rows.allocations.filter((a) => a.receiptId === receiptId && before(a.postedAt, asOf));
  const ids = new Set(allocs.map((a) => a.id));
  const allocNet = sum(allocs.map((a) => a.amount)) - sum(rows.allocationReversals.filter((x) => ids.has(x.allocationId) && before(x.postedAt, asOf)).map((x) => x.amount));
  return Math.max(0, r.amount - reversed - refunded - allocNet);
}

export type AgingBucket = 'current' | '1-30' | '31-60' | '61+' | 'unknown';

export function agingBucket(balance: InvoiceBalance, dueDate: string | null): AgingBucket {
  if (balance.outstanding === 0) return 'current';
  if (!dueDate) return 'unknown';
  if (balance.overdueDays === null) return 'current';
  if (balance.overdueDays <= 30) return '1-30';
  if (balance.overdueDays <= 60) return '31-60';
  return '61+';
}
