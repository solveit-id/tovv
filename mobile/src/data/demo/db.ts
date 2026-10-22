import type {
  Allocation,
  AllocationReversal,
  Assignment,
  BusinessAccount,
  CashAdvance,
  ChangeOrder,
  CreditNote,
  CustomerVehicle,
  Delegation,
  Expense,
  InboxItem,
  Incident,
  Invoice,
  MediaPacket,
  Order,
  OutboxItem,
  PaymentProof,
  PaymentRequest,
  Quote,
  Receipt,
  ReceiptReversal,
  RefundRecord,
  Reservation,
  ServiceRequest,
  SupportGrant,
  Tenant,
  TenantId,
  TrackPoint,
  UnitAsset,
  UsageEvent,
  User,
} from '@/domain/types';

/**
 * Basis data demo di memori. Bentuknya meniru tabel ARCHITECTURE §3 sehingga adapter dapat diganti API.
 * Semua angka layar diturunkan dari baris ini; tidak ada total yang disimpan terpisah.
 */
export interface DemoDb {
  generation: string;
  seededAt: string;
  tenants: Tenant[];
  users: User[];
  businessAccounts: BusinessAccount[];
  units: UnitAsset[];
  vehicles: CustomerVehicle[];
  requests: ServiceRequest[];
  quotes: Quote[];
  orders: Order[];
  assignments: Assignment[];
  reservations: Reservation[];
  incidents: Incident[];
  changeOrders: ChangeOrder[];
  invoices: Invoice[];
  creditNotes: CreditNote[];
  paymentRequests: PaymentRequest[];
  proofs: PaymentProof[];
  receipts: Receipt[];
  allocations: Allocation[];
  allocationReversals: AllocationReversal[];
  receiptReversals: ReceiptReversal[];
  refunds: RefundRecord[];
  expenses: Expense[];
  advances: CashAdvance[];
  media: MediaPacket[];
  outbox: OutboxItem[];
  delegations: Delegation[];
  usage: UsageEvent[];
  inbox: InboxItem[];
  supportGrants: SupportGrant[];
  tracks: Record<string, TrackPoint[]>;
  planChanges: { tenantId: TenantId; toKind: 'subscription' | 'success'; effectiveFrom: string; requestedAt: string }[];
  sequences: { invoice: Record<TenantId, number>; idCounter: number };
  /** Kendala demo yang dapat dinyalakan di layar Tentang untuk memperlihatkan state gagal. */
  faults: { offline: boolean; failNextRead: boolean; lowStorage: boolean; replayPausedAt: string | null; planExpired: boolean };
}
