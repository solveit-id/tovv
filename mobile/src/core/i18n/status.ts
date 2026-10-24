import type {
  AssignmentStatus,
  Channel,
  CollectionStatus,
  ExecutionStatus,
  InvoiceStatus,
  LocationSource,
  MediaPacketStatus,
  MediaStage,
  OutboxStatus,
  PaymentRequestStatus,
  ProofStatus,
  QuoteStatus,
  RequestStatus,
  UsageStatus,
  ExpenseStatus,
  ChangeOrderStatus,
  EvidenceCompleteness,
  CostCompleteness,
  ServiceKind,
} from '@/domain/types';

/**
 * Presentasi status: teks + ikon + bentuk garis (utuh = final, putus-putus = menunggu/provisional,
 * coret = batal). Warna hanya penguat, tidak pernah satu-satunya pembawa arti (NFR-11).
 */
export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';
export type Line = 'solid' | 'dashed' | 'struck';

export interface StatusLook {
  label: string;
  tone: Tone;
  line: Line;
  icon: string;
}

const L = (label: string, tone: Tone, line: Line, icon: string): StatusLook => ({ label, tone, line, icon });

export const requestStatus: Record<RequestStatus, StatusLook> = {
  draft: L('Draf', 'neutral', 'dashed', 'file-document-edit-outline'),
  needs_review: L('Perlu dicek', 'warn', 'dashed', 'alert-circle-outline'),
  ready_to_quote: L('Siap diberi harga', 'info', 'dashed', 'clipboard-check-outline'),
  quoted: L('Ditawarkan', 'info', 'dashed', 'file-send-outline'),
  converted: L('Menjadi order', 'ok', 'solid', 'check-circle-outline'),
  lost: L('Tidak dilanjutkan', 'neutral', 'struck', 'close-circle-outline'),
  canceled: L('Dibatalkan', 'neutral', 'struck', 'cancel'),
};

export const quoteStatus: Record<QuoteStatus, StatusLook> = {
  draft: L('Draf', 'neutral', 'dashed', 'file-document-edit-outline'),
  sent: L('Menunggu persetujuan', 'warn', 'dashed', 'clock-outline'),
  accepted: L('Disetujui', 'ok', 'solid', 'check-decagram-outline'),
  rejected: L('Ditolak', 'danger', 'struck', 'close-circle-outline'),
  expired: L('Kedaluwarsa', 'neutral', 'struck', 'timer-off-outline'),
  superseded: L('Diganti versi baru', 'neutral', 'struck', 'file-replace-outline'),
};

export const executionStatus: Record<ExecutionStatus, StatusLook> = {
  confirmed: L('Terkonfirmasi', 'info', 'dashed', 'calendar-check-outline'),
  assigned: L('Sopir ditugaskan', 'info', 'solid', 'account-check-outline'),
  en_route_pickup: L('Menuju lokasi jemput', 'info', 'solid', 'tow-truck'),
  arrived_pickup: L('Tiba di lokasi jemput', 'info', 'solid', 'map-marker-check-outline'),
  loading: L('Memuat kendaraan', 'info', 'solid', 'arrow-collapse-up'),
  in_transit: L('Dalam perjalanan', 'info', 'solid', 'truck-fast-outline'),
  arrived_delivery: L('Tiba di tujuan', 'info', 'solid', 'map-marker-radius-outline'),
  handed_over: L('Diserahkan', 'ok', 'solid', 'handshake-outline'),
  closed: L('Ditutup', 'ok', 'solid', 'archive-check-outline'),
  canceled: L('Dibatalkan', 'neutral', 'struck', 'cancel'),
  aborted: L('Dihentikan', 'danger', 'struck', 'alert-octagon-outline'),
};

export const assignmentStatus: Record<AssignmentStatus, StatusLook> = {
  offered: L('Ditawarkan, belum diterima', 'warn', 'dashed', 'account-clock-outline'),
  accepted: L('Diterima', 'ok', 'solid', 'account-check-outline'),
  rejected: L('Ditolak petugas', 'danger', 'struck', 'account-cancel-outline'),
  revoked: L('Dicabut', 'neutral', 'struck', 'account-off-outline'),
  completed: L('Selesai', 'ok', 'solid', 'check-all'),
};

export const invoiceStatus: Record<InvoiceStatus, StatusLook> = {
  draft: L('Draf', 'neutral', 'dashed', 'file-document-edit-outline'),
  issued: L('Terbit', 'info', 'solid', 'file-document-outline'),
  void: L('Dibatalkan', 'neutral', 'struck', 'file-cancel-outline'),
  corrected: L('Dikoreksi', 'warn', 'solid', 'file-replace-outline'),
};

export const collectionStatus: Record<CollectionStatus, StatusLook> = {
  unpaid: L('Belum ada pembayaran', 'warn', 'dashed', 'cash-clock'),
  partially_paid: L('Dibayar sebagian', 'warn', 'dashed', 'cash-minus'),
  settled: L('Lunas tercatat (demo)', 'ok', 'solid', 'cash-check'),
};

export const paymentRequestStatus: Record<PaymentRequestStatus, StatusLook> = {
  active: L('Aktif', 'info', 'dashed', 'qrcode'),
  expired: L('Kedaluwarsa', 'neutral', 'struck', 'timer-off-outline'),
  superseded: L('Diganti', 'neutral', 'struck', 'file-replace-outline'),
  canceled: L('Dibatalkan', 'neutral', 'struck', 'cancel'),
  fulfilled: L('Terpenuhi', 'ok', 'solid', 'check-circle-outline'),
};

export const proofStatus: Record<ProofStatus, StatusLook> = {
  pending_review: L('Menunggu dicek', 'warn', 'dashed', 'file-clock-outline'),
  flagged_review: L('Perlu dicek khusus', 'warn', 'dashed', 'flag-outline'),
  rejected: L('Ditolak', 'danger', 'struck', 'close-circle-outline'),
  verified: L('Dicek & diterima', 'ok', 'solid', 'stamper'),
  verification_reversed: L('Verifikasi dibatalkan', 'danger', 'struck', 'undo-variant'),
};

export const usageStatus: Record<UsageStatus, StatusLook> = {
  not_eligible: L('Belum memenuhi syarat', 'neutral', 'dashed', 'minus-circle-outline'),
  eligible_pending_review: L('Menunggu dicek ulang', 'warn', 'dashed', 'clock-outline'),
  billable: L('Tertagih (demo)', 'info', 'solid', 'receipt'),
  billed_demo: L('Ditagih (demo)', 'ok', 'solid', 'receipt'),
  credited: L('Dikreditkan', 'neutral', 'struck', 'undo'),
};

export const outboxStatus: Record<OutboxStatus, StatusLook> = {
  pending: L('Tersimpan di HP, menunggu dikirim', 'warn', 'dashed', 'cloud-upload-outline'),
  sending: L('Mengirim…', 'info', 'dashed', 'cloud-sync-outline'),
  synced: L('Diterima server (simulasi)', 'ok', 'solid', 'cloud-check-outline'),
  needs_review: L('Perlu dicek', 'danger', 'dashed', 'cloud-alert'),
  permanently_failed: L('Gagal permanen', 'danger', 'struck', 'cloud-off-outline'),
};

export const mediaStatus: Record<MediaPacketStatus, StatusLook> = {
  pending_upload: L('Tersimpan di HP, belum terkirim', 'warn', 'dashed', 'cloud-upload-outline'),
  processing: L('Diproses', 'info', 'dashed', 'progress-clock'),
  ready: L('Siap dipakai', 'ok', 'solid', 'image-check-outline'),
  failed: L('Gagal', 'danger', 'struck', 'image-broken-variant'),
  needs_review: L('Perlu dicek', 'warn', 'dashed', 'image-search-outline'),
};

export const expenseStatus: Record<ExpenseStatus, StatusLook> = {
  submitted: L('Menunggu persetujuan', 'warn', 'dashed', 'clock-outline'),
  approved: L('Disetujui', 'ok', 'solid', 'check'),
  rejected: L('Ditolak', 'danger', 'struck', 'close'),
};

export const changeOrderStatus: Record<ChangeOrderStatus, StatusLook> = {
  pending: L('Belum disetujui pelanggan', 'warn', 'dashed', 'clock-outline'),
  approved: L('Disetujui', 'ok', 'solid', 'check'),
  rejected: L('Ditolak', 'neutral', 'struck', 'close'),
};

export const evidenceLook: Record<EvidenceCompleteness, StatusLook> = {
  incomplete: L('Bukti belum lengkap', 'warn', 'dashed', 'image-off-outline'),
  complete: L('Bukti lengkap', 'ok', 'solid', 'image-multiple-outline'),
  disputed: L('Ada keberatan', 'danger', 'dashed', 'image-remove'),
};

export const costLook: Record<CostCompleteness, StatusLook> = {
  final: L('Biaya final', 'ok', 'solid', 'calculator-variant-outline'),
  provisional: L('Biaya sementara', 'warn', 'dashed', 'calculator-variant-outline'),
  na: L('Tidak berlaku', 'neutral', 'dashed', 'minus'),
};

export const locationSourceLabel: Record<LocationSource, string> = {
  device: 'HP',
  stale: 'Lokasi lama',
  manual: 'Titik manual',
  simulated: 'Simulasi (rekaman)',
  unknown: 'Tidak tersedia',
};

export const stageLabel: Record<MediaStage, string> = {
  request_condition: 'Kondisi saat permintaan',
  pickup_before_loading: 'Saat jemput, sebelum dimuat',
  incident: 'Kendala',
  delivery_handover: 'Serah-terima',
};

export const channelLabel: Record<Channel, string> = {
  phone: 'Telepon (dicatat petugas)',
  mobile: 'Aplikasi pelanggan',
  b2b: 'Pelanggan bisnis',
  chat: 'Chat (dicatat petugas)',
  manual: 'Manual',
};

/** Nama paket layanan (nama produk, sama di kedua bahasa) dan ikonnya. */
export const serviceLook: Record<ServiceKind, { label: string; icon: string }> = {
  car_towing: { label: 'Car Towing', icon: 'tow-truck' },
  car_carrier: { label: 'Car Carrier', icon: 'truck-trailer' },
  motor_storing: { label: 'Storing Motor', icon: 'motorbike' },
  self_drive: { label: 'Self Drive', icon: 'steering' },
};

export const timingLabel = { immediate: 'Segera', scheduled: 'Terjadwal', flexible: 'Fleksibel (rentang waktu)' } as const;

export const EXECUTION_FLOW: ExecutionStatus[] = [
  'confirmed', 'assigned', 'en_route_pickup', 'arrived_pickup', 'loading', 'in_transit', 'arrived_delivery', 'handed_over', 'closed',
];
