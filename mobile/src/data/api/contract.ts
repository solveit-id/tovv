import type {
  AssignmentStatus,
  B2bRole,
  CaptureOrigin,
  ChangeOrderStatus,
  Channel,
  CollectionStatus,
  CostCompleteness,
  Custody,
  DelegationScope,
  EvidenceCompleteness,
  ExecutionStatus,
  ExpenseStatus,
  IncidentStatus,
  InvoiceStatus,
  LocationSource,
  MediaPacketStatus,
  MediaStage,
  MoneyString,
  OutboxStatus,
  Parties,
  PaymentMethod,
  PaymentRequestStatus,
  Place,
  PlanKind,
  ProofStatus,
  QuoteStatus,
  RequestStatus,
  StaffRole,
  TenantId,
  TimingKind,
  UsageStatus,
  ViewGroup,
} from '@/domain/types';
import type { AgingBucket } from '@/domain/ledger';
import type { PricingResult } from '@/domain/pricing';

/**
 * Kontrak data antara layar dan sumber data. Implementasi saat ini: adapter demo deterministik.
 * Bentuk mengikuti INTEGRATION_PLAN §2–3 (uang = string integer, waktu ISO UTC, status kanonik)
 * sehingga adapter HTTP ke Tovv API dapat menggantikannya tanpa merombak layar.
 */

export type ErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CAPACITY_CONFLICT'
  | 'VERSION_CONFLICT'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_SUPERSEDED'
  | 'PROOF_ALREADY_REVIEWED'
  | 'SELF_APPROVAL'
  | 'DEPENDENT_FINANCIAL_ENTRY'
  | 'DEMO_ONLY'
  | 'OFFLINE'
  | 'UNAVAILABLE'
  | 'ESCALATION_REQUIRED'
  | 'DUPLICATE_REFERENCE_REVIEW_REQUIRED'
  | 'PLAN_BLOCKED';

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly retryable = false,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiMeta {
  serverTime: string;
  environment: 'demo';
  integrationMode: 'frontend_demo';
  datasetGeneration: string;
}

// ---------- Identitas & sesi ----------

export interface DemoAccount {
  userId: string;
  tenantId: TenantId;
  tenantName: string;
  name: string;
  email: string;
  roleLabel: string;
  views: ViewGroup[];
  note: string;
}

export interface SessionContext {
  tenantId: TenantId;
  tenantName: string;
  userId: string;
  userName: string;
  view: ViewGroup;
  views: ViewGroup[];
  staffRoles: StaffRole[];
  b2bRoles: B2bRole[];
  businessAccountName: string | null;
  /** Scope efektif (peran + delegasi aktif). Server tetap pemegang otoritas. */
  scopes: string[];
  delegation: { id: string; scopes: DelegationScope[]; limit: MoneyString; expiresAt: string; delegatorName: string } | null;
  plan: { kind: PlanKind; label: string; expired: boolean };
}

// ---------- Daftar tindakan harian ----------

export type ActionSeverity = 'blocker' | 'attention' | 'info';

export interface DailyAction {
  key: string;
  sourceType: string;
  sourceId: string;
  type: string;
  title: string;
  reason: string;
  picName: string;
  dueAt: string | null;
  link: string;
  severity: ActionSeverity;
  amount: MoneyString | null;
}

// ---------- Ringkasan & dashboard ----------

export interface MoneyLine {
  key: string;
  label: string;
  amount: MoneyString | null;
  hint: string;
  sourceIds: string[];
}

export interface OwnerSummary {
  asOf: string;
  formulaVersion: string;
  periodLabel: string;
  money: MoneyLine[];
  contribution: { final: MoneyString; coverage: string; provisionalAliases: string[] };
  receivableAging: { bucket: AgingBucket; amount: MoneyString }[];
  conversion: { numerator: number; denominator: number; value: number | null };
  counts: { requests: number; orders: number; completed: number; problematic: number };
}

export interface AnalyticsReport extends OwnerSummary {
  requestsByStatus: { status: RequestStatus; count: number; ids: string[] }[];
  ordersByStatus: { status: ExecutionStatus; count: number; ids: string[] }[];
  variance: { actual: MoneyString; estimate: MoneyString; delta: MoneyString; coverage: string };
  contributions: { orderId: string; alias: string; commercialNet: MoneyString; actualDirect: MoneyString | null; fee: MoneyString; contribution: MoneyString | null; state: 'final' | 'provisional'; reason: string | null }[];
  completeness: { label: string; numerator: number; denominator: number }[];
  byAccount: { accountId: string | null; label: string; orders: number; invoiceNet: MoneyString; receivable: MoneyString; contribution: MoneyString | null; provisional: number }[];
  receivables: { invoiceId: string; number: string; alias: string; payer: string; outstanding: MoneyString; dueDate: string | null; overdueDays: number | null }[];
}

// ---------- Order & perjalanan ----------

export interface OrderSummary {
  id: string;
  alias: string;
  tenantId: TenantId;
  status: ExecutionStatus;
  customerLabel: string;
  vehicleLabel: string;
  plate: string;
  pickup: Place;
  dropoff: Place;
  scheduleStart: string;
  scheduleEnd: string;
  unitCode: string;
  driverName: string | null;
  assignmentStatus: AssignmentStatus | null;
  evidence: EvidenceCompleteness;
  costCompleteness: CostCompleteness | null;
  incidentOpen: boolean;
  changeOrderPending: boolean;
  invoiceStatus: InvoiceStatus | null;
  collection: CollectionStatus | null;
  outstanding: MoneyString | null;
  nextStep: string;
}

export interface TimelineEntry {
  status: ExecutionStatus;
  label: string;
  at: string | null;
  state: 'done' | 'current' | 'upcoming' | 'skipped' | 'pending_sync';
}

export interface TrackingSnapshot {
  orderId: string;
  visible: boolean;
  hiddenReason: string | null;
  lat: number | null;
  lng: number | null;
  capturedAt: string | null;
  accuracyM: number | null;
  source: 'device' | 'simulated' | null;
  freshness: 'live' | 'stale' | 'unknown';
  ageSeconds: number | null;
  progress: number | null;
  eta: { minutes: number; source: string; fetchedAt: string; warning: string } | null;
  pickup: Place;
  dropoff: Place;
}

export interface LiveUnit {
  unitId: string;
  code: string;
  label: string;
  lat: number;
  lng: number;
  accuracyM: number | null;
  capturedAt: string;
  ageSeconds: number;
  freshness: 'live' | 'stale';
  source: 'device' | 'simulated';
  state: 'on_job' | 'available' | 'out_of_service';
  orderId: string | null;
  orderAlias: string | null;
  driverName: string | null;
}

export interface LiveJob {
  orderId: string;
  alias: string;
  status: ExecutionStatus;
  customerLabel: string | null;
  unitCode: string;
  driverName: string | null;
  pickup: Place;
  dropoff: Place;
  trackingVisible: boolean;
  hiddenReason: string | null;
  progress: number | null;
  etaMinutes: number | null;
}

/** Peta langsung per peran (owner: armada; driver: tugas sendiri; pelanggan: pesanan sendiri). */
export interface LiveMapDTO {
  generatedAt: string;
  view: ViewGroup;
  base: { label: string; lat: number; lng: number } | null;
  units: LiveUnit[];
  jobs: LiveJob[];
}

export interface MediaItem {
  id: string;
  stage: MediaStage;
  slot: string;
  captureOrigin: CaptureOrigin;
  status: MediaPacketStatus;
  eventAt: string | null;
  deviceCapturedAt: string | null;
  serverReceivedAt: string | null;
  locationSource: LocationSource;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  locationCapturedAt: string | null;
  note: string;
  synthetic: boolean;
  originalUri: string | null;
  overlayUri: string | null;
  md5: string | null;
  uploaderName: string;
  syncStatus: OutboxStatus | null;
}

export interface QuoteDoc {
  id: string;
  requestId: string;
  version: number;
  status: QuoteStatus;
  amount: MoneyString;
  items: { label: string; amount: MoneyString }[];
  priority: { fee: MoneyString; commitment: string; failureTerms: string } | null;
  validUntil: string;
  sentAt: string | null;
  unitLabel: string | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  termsVersion: string | null;
  operatorName: string;
  acceptedByName: string | null;
  acceptedAt: string | null;
  assistedConsent: { actorName: string; channel: Channel; at: string; note: string } | null;
  rejectedReason: string | null;
  /** Hanya untuk owner/admin; null pada DTO customer dan driver. */
  internal: { estimate: PricingResult; directCost: MoneyString | null; belowTargetReason: string | null; components: { label: string; amount: MoneyString | null; source: string }[] } | null;
  allowedActions: ('accept' | 'reject' | 'send' | 'new_version')[];
  approvalNote: string | null;
}

export interface ChangeOrderDTO {
  id: string;
  amount: MoneyString;
  reason: string;
  status: ChangeOrderStatus;
  createdAt: string;
  decidedByName: string | null;
}

export interface IncidentDTO {
  id: string;
  type: string;
  typeLabel: string;
  status: IncidentStatus;
  picName: string;
  note: string;
  openedAt: string;
  resolvedAt: string | null;
  followUp: string;
}

export interface AssignmentDTO {
  id: string;
  driverId: string;
  driverName: string;
  unitCode: string;
  status: AssignmentStatus;
  offeredAt: string;
  respondedAt: string | null;
  reason: string | null;
}

export interface OrderDetail {
  summary: OrderSummary;
  requestId: string;
  channel: Channel;
  parties: Parties;
  vehicle: { label: string; plate: string; weightKg: number | null; lengthMm: number | null; widthMm: number | null; condition: string };
  timing: { kind: TimingKind; start: string | null; end: string | null };
  poRef: string | null;
  businessAccountName: string | null;
  timeline: TimelineEntry[];
  quote: QuoteDoc | null;
  assignments: AssignmentDTO[];
  incidents: IncidentDTO[];
  changeOrders: ChangeOrderDTO[];
  media: MediaItem[];
  evidenceSlots: { stage: MediaStage; slot: string; label: string; mediaId: string | null }[];
  readiness: { contact: boolean; pickupReady: boolean; receiverReady: boolean | null; note: string | null };
  handover: { receiverName: string; acceptance: 'accepted' | 'objection'; objectionNote: string | null; at: string } | null;
  abortInfo: { location: string; custody: string; pic: string; plan: string } | null;
  invoices: { id: string; number: string; status: InvoiceStatus; net: MoneyString; outstanding: MoneyString; collection: CollectionStatus }[];
  pickupContact: string;
  receiverContact: string;
  instructions: string[];
  internal: { estimateDirect: MoneyString; actualDirect: MoneyString | null; contribution: MoneyString | null; contributionState: 'final' | 'provisional'; reason: string | null; advance: { amount: MoneyString; returned: MoneyString; outstanding: MoneyString } | null } | null;
  expenses: { id: string; category: string; amount: MoneyString; status: ExpenseStatus; submittedByName: string; source: 'server' | 'local_pending' }[];
  allowedActions: OrderAction[];
  nextAction: { action: OrderAction; label: string; hint: string } | null;
  blockedReason: string | null;
}

export type OrderAction =
  | 'accept_assignment'
  | 'reject_assignment'
  | 'start_pickup'
  | 'arrive_pickup'
  | 'start_loading'
  | 'start_transit'
  | 'arrive_delivery'
  | 'handover'
  | 'close'
  | 'cancel'
  | 'abort'
  | 'report_incident'
  | 'resolve_incident'
  | 'capture_evidence'
  | 'add_expense'
  | 'manage_assignment'
  | 'propose_change'
  | 'approve_change'
  | 'issue_invoice'
  | 'view_tracking'
  | 'reorder'
  | 'mark_readiness';

// ---------- Permintaan & penawaran ----------

export interface RequestSummary {
  id: string;
  alias: string;
  status: RequestStatus;
  channel: Channel;
  customerLabel: string;
  vehicleLabel: string;
  pickupLabel: string;
  dropoffLabel: string;
  createdAt: string;
  needsReviewReasons: string[];
  latestQuote: { id: string; version: number; status: QuoteStatus; amount: MoneyString; validUntil: string } | null;
  orderId: string | null;
}

export interface RequestDetail extends RequestSummary {
  parties: Parties;
  vehicle: OrderDetail['vehicle'];
  pickup: Place;
  dropoff: Place;
  timing: { kind: TimingKind; start: string | null; end: string | null };
  businessAccount: { id: string; name: string; poRequired: boolean; termsVersion: string } | null;
  poRef: string | null;
  createdByName: string;
  quotes: QuoteDoc[];
  media: MediaItem[];
  rate: { source: 'account' | 'standard' | 'review'; amount: MoneyString | null; note: string };
  allowedActions: ('quote' | 'mark_ready' | 'cancel' | 'capture' | 'submit_draft')[];
}

export interface UnitCandidate {
  unitId: string;
  code: string;
  label: string;
  ownership: 'own' | 'partner';
  partnerName: string | null;
  eligible: boolean;
  rejections: string[];
  capacityKg: number;
  deck: string;
  distanceKm: number | null;
  distanceNote: string;
  etaMinutes: number | null;
  positionAge: string | null;
  positionFreshness: 'live' | 'stale' | 'unknown';
  estimatedDirect: MoneyString | null;
  nextFreeAt: string | null;
  conflict: boolean;
  rank: number | null;
  reason: string;
}

/** Tempat siap pilih di formulir permintaan: contoh tersimpan dan yang terakhir dipakai akun ini. */
export interface PlaceBook {
  saved: { key: string; kind: 'home' | 'work' | 'route' | 'sample'; place: Place }[];
  recent: Place[];
}

export interface NewRequestInput {
  channel: Channel;
  customerUserId: string | null;
  businessAccountId: string | null;
  parties: Parties;
  vehicle: { label: string; plate: string; weightKg: number | null; lengthMm: number | null; widthMm: number | null; condition: string };
  pickup: Place;
  dropoff: Place;
  timing: { kind: TimingKind; start: string | null; end: string | null; immediateConfirmed?: boolean };
  poRef: string | null;
  consentNote: string | null;
  asDraft: boolean;
  idempotencyKey: string;
}

export interface QuoteInput {
  requestId: string;
  unitId: string;
  scheduleStart: string;
  scheduleEnd: string;
  price: number;
  direct: number | null;
  allocation: number;
  reserve: number;
  targetSurplus: number;
  priority: { fee: number; commitment: string; failureTerms: string } | null;
  belowTargetReason: string | null;
  validHours: number;
}

// ---------- Keuangan ----------

export interface InvoiceDoc {
  id: string;
  number: string;
  status: InvoiceStatus;
  orderId: string;
  alias: string;
  operatorName: string;
  payerLabel: string;
  issuedAt: string | null;
  dueDate: string | null;
  items: { label: string; amount: MoneyString }[];
  gross: MoneyString;
  credits: { id: string; amount: MoneyString; postedAt: string; reason: string }[];
  net: MoneyString;
  allocated: MoneyString;
  outstanding: MoneyString;
  collection: CollectionStatus;
  overdueDays: number | null;
  fullyCredited: boolean;
  instruction: { account: string; payeeLabel: string; version: number };
  paymentRequests: PaymentRequestDTO[];
  proofs: ProofDTO[];
  receipts: { id: string; amount: MoneyString; postedAt: string; method: PaymentMethod; custody: Custody; unapplied: MoneyString; verifiedByName: string; refunds: { amount: MoneyString; recordedAt: string | null; status: string }[] }[];
  allowedActions: ('create_payment_request' | 'submit_proof' | 'credit_note' | 'assisted_cash')[];
}

export interface PaymentRequestDTO {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  reference: string;
  requestedAmount: MoneyString;
  outstandingSnapshot: MoneyString;
  expiresAt: string;
  status: PaymentRequestStatus;
  createdAt: string;
  deepLink: string;
  history: { at: string; status: PaymentRequestStatus; note: string }[];
}

export interface ProofDTO {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  alias: string;
  amountClaimed: MoneyString;
  method: PaymentMethod;
  referenceClaimed: string;
  eventAt: string;
  receivedAt: string;
  submittedByName: string;
  submittedById: string;
  status: ProofStatus;
  flagReason: string | null;
  review: { byName: string; at: string; reason: string; amountVerified: MoneyString | null; custody: Custody | null } | null;
  assistedReason: string | null;
  attachmentLabel: string;
  outstandingNow: MoneyString;
  similarReferences: string[];
  allowedActions: ('verify' | 'reject')[];
  blockedReason: string | null;
}

export interface ProofInput {
  invoiceId: string;
  paymentRequestId: string | null;
  amount: number;
  method: PaymentMethod;
  reference: string;
  eventAt: string;
  assistedReason: string | null;
  attachmentLabel: string;
}

export interface VerifyInput {
  proofId: string;
  amountVerified: number;
  receivedEventAt: string;
  custody: Custody;
  reason: string;
  duplicateResolution: string | null;
}

export interface ExpenseDTO {
  id: string;
  orderId: string;
  alias: string;
  category: string;
  amount: MoneyString;
  status: ExpenseStatus;
  submittedByName: string;
  submittedAt: string;
  source: 'server' | 'local_pending';
  note: string;
}

export interface AdvanceDTO {
  id: string;
  orderId: string;
  alias: string;
  driverName: string;
  amount: MoneyString;
  spent: MoneyString;
  returned: MoneyString;
  outstanding: MoneyString;
  settled: boolean;
}

// ---------- Armada, B2B, SaaS, akses ----------

export interface FleetDTO {
  units: (UnitCandidate & { status: 'active' | 'out_of_service'; equipment: string[]; costTemplate: string; specSource: string })[];
  drivers: { id: string; name: string; roles: string[]; activeAssignment: string | null }[];
  reservations: { id: string; orderAlias: string; unitCode: string; driverName: string | null; start: string; end: string; status: string }[];
}

export interface BusinessAccountDTO {
  id: string;
  alias: string;
  name: string;
  poRequired: boolean;
  termsVersion: string;
  netDays: number;
  rateCards: { id: string; route: string; amount: MoneyString; validFrom: string; validTo: string; valid: boolean }[];
  members: { id: string; name: string; roles: B2bRole[] }[];
  favoriteRoutes: { id: string; label: string }[];
  orders: number;
  invoiceNet: MoneyString;
  receivable: MoneyString;
  contribution: MoneyString | null;
  provisional: number;
  recentOrders: { id: string; alias: string; status: ExecutionStatus; poRef: string | null }[];
}

export interface SaasDTO {
  tenantName: string;
  plan: { kind: PlanKind; version: string; label: string; amount: MoneyString };
  scheduledChange: { toKind: PlanKind; effectiveFrom: string } | null;
  usage: { id: string; alias: string; status: UsageStatus; amount: MoneyString; note: string }[];
  periodCharge: MoneyString;
  comparison: { volume: number; subscription: MoneyString; success: MoneyString }[];
  invoicePreview: { number: string; issuer: string; lines: { label: string; amount: MoneyString }[]; total: MoneyString };
  expiredFixture: boolean;
}

export interface DelegationDTO {
  id: string;
  delegateId: string;
  delegateName: string;
  scopes: DelegationScope[];
  limit: MoneyString;
  effectiveAt: string;
  expiresAt: string;
  reason: string;
  status: 'active' | 'expired' | 'revoked' | 'scheduled';
  version: number;
}

export interface SupportGrantDTO {
  id: string;
  actorLabel: string;
  scopes: string[];
  reason: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface OutboxDTO {
  localId: string;
  label: string;
  commandType: string;
  aggregateId: string;
  eventAt: string;
  attempts: number;
  status: OutboxStatus;
  lastError: string | null;
}

export interface InboxDTO {
  id: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  read: boolean;
}

export interface ExportResult {
  template: string;
  fileName: string;
  mime: 'text/csv' | 'text/html';
  content: string;
  rows: number;
  generatedAt: string;
}

export interface MediaCaptureInput {
  requestId: string;
  orderId: string | null;
  stage: MediaStage;
  slot: string;
  captureOrigin: CaptureOrigin;
  eventAt: string | null;
  deviceCapturedAt: string | null;
  deviceRecordedAt: string;
  locationCapturedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  locationSource: LocationSource;
  note: string;
  originalUri: string;
  overlayUri: string | null;
  md5: string | null;
  byteSize: number | null;
  clientMediaId: string;
}
