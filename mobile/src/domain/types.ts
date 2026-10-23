/**
 * Tipe domain Tovv. Enum mengikuti PRD §5 (kanonik); jangan menambah status tunggal "paid".
 * Uang disimpan sebagai integer rupiah (number, safe integer) di store demo dan dikirim sebagai
 * string pada DTO (INTEGRATION_PLAN §2). Waktu ISO 8601 UTC dengan sufiks Z.
 */

export type TenantId = 'tenant-a' | 'tenant-b';
export type IsoUtc = string;
export type MoneyString = string;
export type Rupiah = number;

export type ViewGroup = 'owner' | 'admin' | 'driver' | 'customer';
/**
 * Tampilan yang dibuka aplikasi saat ini: owner (termasuk tugas dispatcher dan finance), driver, pelanggan.
 * `admin` tetap ada di model data dan uji kebijakan, tetapi tidak dapat dipilih di aplikasi.
 */
export const APP_VIEWS: readonly ViewGroup[] = ['owner', 'driver', 'customer'];
export type StaffRole = 'owner' | 'dispatcher' | 'finance' | 'driver' | 'partner';
export type B2bRole = 'requester' | 'approver' | 'finance' | 'receiver';

export type RequestStatus = 'draft' | 'needs_review' | 'ready_to_quote' | 'quoted' | 'converted' | 'lost' | 'canceled';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'superseded';
export type ExecutionStatus =
  | 'confirmed'
  | 'assigned'
  | 'en_route_pickup'
  | 'arrived_pickup'
  | 'loading'
  | 'in_transit'
  | 'arrived_delivery'
  | 'handed_over'
  | 'closed'
  | 'canceled'
  | 'aborted';
export type AssignmentStatus = 'offered' | 'accepted' | 'rejected' | 'revoked' | 'completed';
export type ReservationStatus = 'confirmed' | 'released';
export type EvidenceCompleteness = 'incomplete' | 'complete' | 'disputed';
export type InvoiceStatus = 'draft' | 'issued' | 'void' | 'corrected';
export type PaymentRequestStatus = 'active' | 'expired' | 'superseded' | 'canceled' | 'fulfilled';
export type ProofStatus = 'pending_review' | 'flagged_review' | 'rejected' | 'verified' | 'verification_reversed';
export type ReceiptStatus = 'posted' | 'reversed';
export type RefundStatus = 'requested' | 'approved' | 'recorded' | 'rejected' | 'canceled';
export type CollectionStatus = 'unpaid' | 'partially_paid' | 'settled';
export type UsageStatus = 'not_eligible' | 'eligible_pending_review' | 'billable' | 'billed_demo' | 'credited';
export type OutboxStatus = 'pending' | 'sending' | 'synced' | 'needs_review' | 'permanently_failed';
export type IncidentStatus = 'open' | 'resolved';
export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected';
export type ExpenseStatus = 'submitted' | 'approved' | 'rejected';

export type Channel = 'phone' | 'mobile' | 'b2b' | 'chat' | 'manual';
export type CostCompleteness = 'final' | 'provisional' | 'na';
export type LocationSource = 'device' | 'stale' | 'manual' | 'simulated' | 'unknown';
export type CaptureOrigin = 'camera' | 'gallery';
export type MediaStage = 'request_condition' | 'pickup_before_loading' | 'incident' | 'delivery_handover';
export type MediaPacketStatus = 'pending_upload' | 'processing' | 'ready' | 'failed' | 'needs_review';
export type TimingKind = 'immediate' | 'scheduled' | 'flexible';
export type PaymentMethod = 'transfer_demo' | 'cash_demo';
export type Custody = 'operator_demo' | 'driver_demo';
export type PlanKind = 'subscription' | 'success';

export type DelegationScope =
  | 'quote.send'
  | 'quote.override_within_limit'
  | 'assignment.manage'
  | 'expense.approve'
  | 'invoice.issue'
  | 'payment.verify';

export interface Tenant {
  id: TenantId;
  name: string;
  shortName: string;
  timezone: string;
  plan: { kind: PlanKind; version: string; amount: Rupiah; label: string };
  paymentInstruction: PaymentInstruction;
}

export interface PaymentInstruction {
  id: string;
  version: number;
  operatorName: string;
  payeeLabel: string;
  account: 'DEMO-NONPAYABLE-A' | 'DEMO-NONPAYABLE-B';
}

export interface User {
  id: string;
  tenantId: TenantId;
  name: string;
  email: string;
  staffRoles: StaffRole[];
  businessAccountId?: string;
  b2bRoles?: B2bRole[];
  customerKind?: 'personal' | 'b2b';
  phoneLabel: string;
}

export interface BusinessAccount {
  id: string;
  tenantId: TenantId;
  alias: 'BA1' | 'BA2' | 'BB1';
  name: string;
  poRequired: boolean;
  termsVersion: string;
  netDays: number;
  rateCards: RateCard[];
  favoriteRoutes: { id: string; label: string; pickup: Place; dropoff: Place }[];
}

export interface RateCard {
  id: string;
  route: string;
  amount: Rupiah;
  validFrom: IsoUtc;
  validTo: IsoUtc;
  version: number;
}

export interface Place {
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface UnitAsset {
  id: string;
  tenantId: TenantId;
  code: string;
  label: string;
  ownership: 'own' | 'partner';
  partnerName?: string;
  capacityKg: number;
  deckLengthMm: number;
  deckWidthMm: number;
  equipment: string[];
  status: 'active' | 'out_of_service';
  specSource: 'synthetic';
  costTemplateVersion: string;
  ratePerKm: Rupiah;
  baseCost: Rupiah;
  lastPosition: { lat: number; lng: number; capturedAt: IsoUtc; source: LocationSource; accuracyM: number | null };
}

export interface CustomerVehicle {
  id: string;
  requestId: string;
  label: string;
  plate: string;
  weightKg: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  condition: string;
}

export interface Parties {
  orderer: string;
  sender: string;
  receiver: string;
  payer: string;
}

export interface Timing {
  kind: TimingKind;
  start: IsoUtc | null;
  end: IsoUtc | null;
  immediateConfirmed?: boolean;
}

export interface AssistedConsent {
  actorId: string;
  channel: Channel;
  at: IsoUtc;
  note: string;
}

export interface ServiceRequest {
  id: string;
  alias: string;
  tenantId: TenantId;
  day: number;
  channel: Channel;
  status: RequestStatus;
  customerUserId: string | null;
  businessAccountId: string | null;
  parties: Parties;
  vehicleId: string;
  pickup: Place;
  dropoff: Place;
  timing: Timing;
  createdAt: IsoUtc;
  createdBy: string;
  needsReviewReasons: string[];
  lostReason?: string;
  cancelReason?: string;
  poRef?: string | null;
  sourceOrderId?: string | null;
  idempotencyKey: string;
}

export interface QuoteItem {
  label: string;
  amount: Rupiah;
}

export interface CostEstimate {
  /** D: biaya langsung; null jika belum diketahui (bukan nol). */
  direct: Rupiah | null;
  allocation: Rupiah;
  reserve: Rupiah;
  feePerService: Rupiah;
  adminHandling: Rupiah;
  targetSurplus: Rupiah;
  components: { label: string; amount: Rupiah | null; source: string }[];
}

export interface Quote {
  id: string;
  requestId: string;
  tenantId: TenantId;
  version: number;
  status: QuoteStatus;
  amount: Rupiah;
  items: QuoteItem[];
  priority: { fee: Rupiah; commitment: string; failureTerms: string } | null;
  unitId: string | null;
  scheduleStart: IsoUtc | null;
  scheduleEnd: IsoUtc | null;
  validUntil: IsoUtc;
  sentAt: IsoUtc | null;
  createdAt: IsoUtc;
  createdBy: string;
  termsVersion: string | null;
  estimate: CostEstimate;
  belowTargetReason: string | null;
  acceptedBy: string | null;
  acceptedAt: IsoUtc | null;
  assistedConsent: AssistedConsent | null;
  rejectedReason: string | null;
}

export interface StatusEvent {
  id: string;
  status: ExecutionStatus;
  occurredAt: IsoUtc;
  actorId: string;
  note?: string;
  source: 'server' | 'local_pending';
}

export interface Order {
  id: string;
  alias: string;
  tenantId: TenantId;
  requestId: string;
  quoteId: string;
  status: ExecutionStatus;
  confirmedAt: IsoUtc;
  unitId: string;
  scheduleStart: IsoUtc;
  scheduleEnd: IsoUtc;
  events: StatusEvent[];
  handedOverAt: IsoUtc | null;
  closedAt: IsoUtc | null;
  canceledAt: IsoUtc | null;
  abortedAt: IsoUtc | null;
  estimateDirect: Rupiah;
  costCompleteness: CostCompleteness;
  evidence: EvidenceCompleteness;
  planSnapshot: { kind: PlanKind; version: string; feePerService: Rupiah };
  readiness: { contact: boolean; pickupReady: boolean; receiverReady: boolean | null; note?: string };
  abortInfo?: { location: string; custody: string; pic: string; plan: string };
  handover?: { receiverName: string; acceptance: 'accepted' | 'objection'; objectionNote?: string; at: IsoUtc };
  version: number;
}

export interface Assignment {
  id: string;
  orderId: string;
  tenantId: TenantId;
  driverId: string;
  unitId: string;
  status: AssignmentStatus;
  offeredAt: IsoUtc;
  respondedAt: IsoUtc | null;
  reason: string | null;
  offeredBy: string;
}

export interface Reservation {
  id: string;
  orderId: string;
  unitId: string;
  driverId: string;
  start: IsoUtc;
  end: IsoUtc;
  status: ReservationStatus;
}

export interface Incident {
  id: string;
  orderId: string;
  type: 'receiver_not_ready' | 'vehicle_issue' | 'access_blocked' | 'custody_abort' | 'handover_dispute' | 'other';
  status: IncidentStatus;
  pic: string;
  note: string;
  openedAt: IsoUtc;
  resolvedAt: IsoUtc | null;
  followUp: string;
}

export interface ChangeOrder {
  id: string;
  orderId: string;
  amount: Rupiah;
  reason: string;
  status: ChangeOrderStatus;
  createdAt: IsoUtc;
  createdBy: string;
  decidedBy: string | null;
  decidedAt: IsoUtc | null;
}

export interface Invoice {
  id: string;
  number: string;
  tenantId: TenantId;
  orderId: string;
  status: InvoiceStatus;
  issuedAt: IsoUtc | null;
  dueDate: string | null;
  gross: Rupiah;
  items: QuoteItem[];
  correctsInvoiceId: string | null;
  payerLabel: string;
  businessAccountId: string | null;
  customerUserId: string | null;
  version: number;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  amount: Rupiah;
  postedAt: IsoUtc;
  reason: string;
}

export interface PaymentRequest {
  id: string;
  invoiceId: string;
  reference: string;
  requestedAmount: Rupiah;
  outstandingSnapshot: Rupiah;
  invoiceVersion: number;
  instructionVersion: number;
  createdAt: IsoUtc;
  expiresAt: IsoUtc;
  status: PaymentRequestStatus;
  createdBy: string;
  history: { at: IsoUtc; status: PaymentRequestStatus; note: string }[];
}

export interface PaymentProof {
  id: string;
  invoiceId: string;
  paymentRequestId: string | null;
  amountClaimed: Rupiah;
  method: PaymentMethod;
  referenceClaimed: string;
  eventAt: IsoUtc;
  submittedBy: string;
  receivedAt: IsoUtc;
  status: ProofStatus;
  flagReason: string | null;
  priorProofId: string | null;
  review: {
    by: string;
    at: IsoUtc;
    reason: string;
    amountVerified: Rupiah | null;
    custody: Custody | null;
    receivedEventAt: IsoUtc | null;
  } | null;
  assistedReason: string | null;
  attachmentLabel: string;
}

export interface Receipt {
  id: string;
  tenantId: TenantId;
  proofId: string;
  invoiceId: string;
  amount: Rupiah;
  postedAt: IsoUtc;
  method: PaymentMethod;
  custody: Custody;
  status: ReceiptStatus;
  verifiedBy: string;
}

export interface Allocation {
  id: string;
  receiptId: string;
  invoiceId: string;
  amount: Rupiah;
  postedAt: IsoUtc;
}

export interface AllocationReversal {
  id: string;
  allocationId: string;
  amount: Rupiah;
  postedAt: IsoUtc;
  reason: string;
}

export interface ReceiptReversal {
  id: string;
  receiptId: string;
  amount: Rupiah;
  postedAt: IsoUtc;
  reason: string;
}

export interface RefundRecord {
  id: string;
  receiptId: string;
  amount: Rupiah;
  status: RefundStatus;
  recordedAt: IsoUtc | null;
  reason: string;
}

export interface Expense {
  id: string;
  orderId: string;
  tenantId: TenantId;
  category: string;
  amount: Rupiah;
  status: ExpenseStatus;
  submittedBy: string;
  submittedAt: IsoUtc;
  decidedBy: string | null;
  note: string;
  source: 'server' | 'local_pending';
}

export interface CashAdvance {
  id: string;
  orderId: string;
  driverId: string;
  amount: Rupiah;
  returned: Rupiah;
  settledAt: IsoUtc | null;
}

export interface MediaPacket {
  id: string;
  clientMediaId: string;
  tenantId: TenantId;
  requestId: string;
  orderId: string | null;
  vehicleId: string;
  stage: MediaStage;
  slot: string;
  captureOrigin: CaptureOrigin;
  eventAt: IsoUtc | null;
  deviceCapturedAt: IsoUtc | null;
  deviceRecordedAt: IsoUtc;
  locationCapturedAt: IsoUtc | null;
  serverReceivedAt: IsoUtc | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  locationSource: LocationSource;
  note: string;
  uploaderId: string;
  isDemo: true;
  synthetic: boolean;
  status: MediaPacketStatus;
  originalUri: string | null;
  overlayUri: string | null;
  originalMd5: string | null;
  byteSize: number | null;
}

export interface OutboxItem {
  localId: string;
  tenantId: TenantId;
  actorId: string;
  datasetGeneration: string;
  aggregateId: string;
  commandType: 'status.event' | 'media.upload' | 'expense.submit' | 'request.create' | 'handover.submit' | 'incident.open';
  label: string;
  eventAt: IsoUtc;
  idempotencyKey: string;
  attempts: number;
  status: OutboxStatus;
  lastError: string | null;
  dependencyId: string | null;
}

export interface Delegation {
  id: string;
  tenantId: TenantId;
  delegatorId: string;
  delegateId: string;
  scopes: DelegationScope[];
  limit: Rupiah;
  effectiveAt: IsoUtc;
  expiresAt: IsoUtc;
  reason: string;
  revokedAt: IsoUtc | null;
  version: number;
}

export interface UsageEvent {
  id: string;
  tenantId: TenantId;
  orderId: string;
  status: UsageStatus;
  amount: Rupiah;
  note: string;
}

export interface InboxItem {
  id: string;
  eventId: string;
  tenantId: TenantId;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: IsoUtc;
  read: boolean;
}

export interface SupportGrant {
  id: string;
  tenantId: TenantId;
  actorLabel: string;
  scopes: string[];
  reason: string;
  createdAt: IsoUtc;
  expiresAt: IsoUtc;
  revokedAt: IsoUtc | null;
}

export interface TrackPoint {
  eventId: string;
  capturedAt: IsoUtc;
  lat: number;
  lng: number;
  accuracyM: number | null;
  source: 'device' | 'simulated';
}
