import type { BusinessAccount, Place, ServicePackage, Tenant, UnitAsset, User } from '@/domain/types';
import { dayAt, DEMO_CLOCK_C0, addMinutes } from '@/core/format/time';

/**
 * Fixture F-03, F-04, F-05 (PRD §8.1). Semua nama, kontak dan spesifikasi sintetis.
 * Email memakai domain example.invalid; nomor telepon bukan nomor nyata.
 */

export const TENANTS: Tenant[] = [
  {
    id: 'tenant-a',
    name: 'Operator Angkut Demo',
    shortName: 'Angkut Demo',
    timezone: 'Asia/Jakarta',
    plan: { kind: 'subscription', version: 'SUB-A-v1', amount: 500_000, label: 'Langganan 30 hari (DEMO)' },
    paymentInstruction: {
      id: 'instr_demo_A_v1',
      version: 1,
      operatorName: 'Operator Angkut Demo',
      payeeLabel: 'Penerima: Operator Angkut Demo (sintetis)',
      account: 'DEMO-NONPAYABLE-A',
    },
  },
  {
    id: 'tenant-b',
    name: 'Operator Mobilitas Demo',
    shortName: 'Mobilitas Demo',
    timezone: 'Asia/Jakarta',
    plan: { kind: 'success', version: 'SUC-B-v1', amount: 10_000, label: 'Bayar per layanan sukses (DEMO)' },
    paymentInstruction: {
      id: 'instr_demo_B_v1',
      version: 1,
      operatorName: 'Operator Mobilitas Demo',
      payeeLabel: 'Penerima: Operator Mobilitas Demo (sintetis)',
      account: 'DEMO-NONPAYABLE-B',
    },
  },
];

const phone = (n: number) => `+62 000-0000-${String(n).padStart(4, '0')} (DEMO)`;
const mail = (local: string) => `${local}@example.invalid`;

export const USERS: User[] = [
  { id: 'owner-a', tenantId: 'tenant-a', name: 'Raka Wijaya', email: mail('raka.owner-a'), staffRoles: ['owner', 'driver'], phoneLabel: phone(101) },
  { id: 'admin-a1', tenantId: 'tenant-a', name: 'Sinta Maharani', email: mail('sinta.admin-a1'), staffRoles: ['dispatcher'], phoneLabel: phone(102) },
  { id: 'admin-a2', tenantId: 'tenant-a', name: 'Dimas Saputra', email: mail('dimas.admin-a2'), staffRoles: ['dispatcher'], phoneLabel: phone(103) },
  { id: 'finance-a', tenantId: 'tenant-a', name: 'Lestari Putri', email: mail('lestari.finance-a'), staffRoles: ['finance'], phoneLabel: phone(104) },
  { id: 'driver-a1', tenantId: 'tenant-a', name: 'Agus Setiawan', email: mail('agus.driver-a1'), staffRoles: ['driver'], phoneLabel: phone(105) },
  { id: 'driver-a2', tenantId: 'tenant-a', name: 'Bayu Nugroho', email: mail('bayu.driver-a2'), staffRoles: ['driver'], phoneLabel: phone(106) },
  { id: 'partner-a', tenantId: 'tenant-a', name: 'Mitra Towing Demo', email: mail('mitra.partner-a'), staffRoles: ['partner'], phoneLabel: phone(107) },
  { id: 'customer-a1', tenantId: 'tenant-a', name: 'Wulan Sari', email: mail('wulan.customer-a1'), staffRoles: [], customerKind: 'personal', phoneLabel: phone(108) },
  { id: 'customer-a2', tenantId: 'tenant-a', name: 'Hendra Gunawan', email: mail('hendra.customer-a2'), staffRoles: [], customerKind: 'personal', phoneLabel: phone(109) },
  { id: 'ba1-req', tenantId: 'tenant-a', name: 'Fajar Ramadhan', email: mail('fajar.ba1'), staffRoles: [], customerKind: 'b2b', businessAccountId: 'ba1', b2bRoles: ['requester'], phoneLabel: phone(110) },
  { id: 'ba1-appr', tenantId: 'tenant-a', name: 'Nina Kartika', email: mail('nina.ba1'), staffRoles: [], customerKind: 'b2b', businessAccountId: 'ba1', b2bRoles: ['approver', 'finance'], phoneLabel: phone(111) },
  { id: 'ba2-req', tenantId: 'tenant-a', name: 'Yoga Pramudya', email: mail('yoga.ba2'), staffRoles: [], customerKind: 'b2b', businessAccountId: 'ba2', b2bRoles: ['requester'], phoneLabel: phone(112) },
  { id: 'ba2-appr', tenantId: 'tenant-a', name: 'Ratna Dewi', email: mail('ratna.ba2'), staffRoles: [], customerKind: 'b2b', businessAccountId: 'ba2', b2bRoles: ['approver', 'finance'], phoneLabel: phone(113) },
  { id: 'owner-b', tenantId: 'tenant-b', name: 'Andi Kurniawan', email: mail('andi.owner-b'), staffRoles: ['owner'], phoneLabel: phone(201) },
  { id: 'admin-b', tenantId: 'tenant-b', name: 'Maya Lestiani', email: mail('maya.admin-b'), staffRoles: ['dispatcher'], phoneLabel: phone(202) },
  { id: 'finance-b', tenantId: 'tenant-b', name: 'Rudi Hartono', email: mail('rudi.finance-b'), staffRoles: ['finance'], phoneLabel: phone(203) },
  { id: 'driver-b1', tenantId: 'tenant-b', name: 'Eko Prasetyo', email: mail('eko.driver-b1'), staffRoles: ['driver'], phoneLabel: phone(204) },
  { id: 'customer-b1', tenantId: 'tenant-b', name: 'Putri Anjani', email: mail('putri.customer-b1'), staffRoles: [], customerKind: 'personal', phoneLabel: phone(205) },
  { id: 'bb1-req', tenantId: 'tenant-b', name: 'Galih Saputro', email: mail('galih.bb1'), staffRoles: [], customerKind: 'b2b', businessAccountId: 'bb1', b2bRoles: ['requester'], phoneLabel: phone(206) },
  { id: 'bb1-appr', tenantId: 'tenant-b', name: 'Sari Handayani', email: mail('sari.bb1'), staffRoles: [], customerKind: 'b2b', businessAccountId: 'bb1', b2bRoles: ['approver', 'finance'], phoneLabel: phone(207) },
];

/** Titik replay F-06: Surabaya → Sidoarjo (koordinat sintetis). */
export const PLACES = {
  surabayaPool: { label: 'Pool operator (sintetis)', address: 'Jl. Contoh Pool No. 1, Surabaya', lat: -7.2575, lng: 112.7521 },
  surabayaA: { label: 'Bengkel asal (sintetis)', address: 'Jl. Contoh Darmo No. 12, Surabaya', lat: -7.2862, lng: 112.7389 },
  surabayaB: { label: 'Rumah pelanggan (sintetis)', address: 'Jl. Contoh Kertajaya No. 8, Surabaya', lat: -7.2797, lng: 112.7676 },
  sidoarjo: { label: 'Dealer tujuan (sintetis)', address: 'Jl. Contoh Raya Sidoarjo No. 45, Sidoarjo', lat: -7.4478, lng: 112.7183 },
  gresik: { label: 'Gudang tujuan (sintetis)', address: 'Jl. Contoh Industri No. 3, Gresik', lat: -7.1612, lng: 112.6534 },
} satisfies Record<string, Place>;

export const BUSINESS_ACCOUNTS: BusinessAccount[] = [
  {
    id: 'ba1',
    tenantId: 'tenant-a',
    alias: 'BA1',
    name: 'Bengkel Demo',
    poRequired: true,
    termsVersion: 'TA1',
    netDays: 7,
    rateCards: [{ id: 'rc-ba1-local', route: 'RC-LOCAL reguler', amount: 1_000_000, validFrom: dayAt(1, 0), validTo: dayAt(31, 0), version: 1 }],
    favoriteRoutes: [{ id: 'fav-ba1-1', label: 'Bengkel → Dealer Sidoarjo', pickup: PLACES.surabayaA, dropoff: PLACES.sidoarjo }],
  },
  {
    id: 'ba2',
    tenantId: 'tenant-a',
    alias: 'BA2',
    name: 'Dealer Demo',
    poRequired: false,
    termsVersion: 'TA1',
    netDays: 7,
    rateCards: [{ id: 'rc-ba2-old', route: 'RC-LOCAL reguler', amount: 950_000, validFrom: dayAt(-60, 0), validTo: dayAt(0, 0), version: 1 }],
    favoriteRoutes: [{ id: 'fav-ba2-1', label: 'Dealer → Gudang Gresik', pickup: PLACES.surabayaB, dropoff: PLACES.gresik }],
  },
  {
    id: 'bb1',
    tenantId: 'tenant-b',
    alias: 'BB1',
    name: 'Bengkel B Demo',
    poRequired: true,
    termsVersion: 'TB1',
    netDays: 7,
    rateCards: [{ id: 'rc-bb1-local', route: 'RC-LOCAL reguler', amount: 1_000_000, validFrom: dayAt(1, 0), validTo: dayAt(31, 0), version: 1 }],
    favoriteRoutes: [{ id: 'fav-bb1-1', label: 'Bengkel B → Rumah pelanggan', pickup: PLACES.surabayaA, dropoff: PLACES.surabayaB }],
  },
];

/** Tarif standar tenant (dipakai bila tarif akun tidak berlaku). */
export const STANDARD_RATE: Record<'tenant-a' | 'tenant-b', number> = { 'tenant-a': 1_200_000, 'tenant-b': 1_100_000 };

export const UNITS: UnitAsset[] = [
  {
    id: 'A-U1', tenantId: 'tenant-a', code: 'U1', label: 'Flatbed ringan U1', ownership: 'own',
    capacityKg: 1500, deckLengthMm: 4500, deckWidthMm: 1900, equipment: ['winch', 'strap roda'], status: 'active',
    specSource: 'synthetic', costTemplateVersion: 'CT-A-1', ratePerKm: 9_000, baseCost: 350_000,
    lastPosition: { lat: -7.2602, lng: 112.7498, capturedAt: addMinutes(DEMO_CLOCK_C0, -1), source: 'simulated', accuracyM: 12 },
  },
  {
    id: 'A-U2', tenantId: 'tenant-a', code: 'U2', label: 'Flatbed sedang U2', ownership: 'own',
    capacityKg: 3000, deckLengthMm: 6000, deckWidthMm: 2200, equipment: ['winch', 'strap roda', 'dolly'], status: 'active',
    specSource: 'synthetic', costTemplateVersion: 'CT-A-1', ratePerKm: 11_000, baseCost: 450_000,
    lastPosition: { lat: -7.3104, lng: 112.7342, capturedAt: addMinutes(DEMO_CLOCK_C0, -1), source: 'simulated', accuracyM: 15 },
  },
  {
    id: 'A-U3', tenantId: 'tenant-a', code: 'U3', label: 'Flatbed sedang U3', ownership: 'own',
    capacityKg: 3000, deckLengthMm: 6000, deckWidthMm: 2200, equipment: ['winch'], status: 'out_of_service',
    specSource: 'synthetic', costTemplateVersion: 'CT-A-1', ratePerKm: 11_000, baseCost: 450_000,
    lastPosition: { lat: -7.2575, lng: 112.7521, capturedAt: addMinutes(DEMO_CLOCK_C0, -60 * 26), source: 'simulated', accuracyM: null },
  },
  {
    id: 'A-P1', tenantId: 'tenant-a', code: 'P1', label: 'Flatbed mitra P1', ownership: 'partner', partnerName: 'Mitra Towing Demo',
    capacityKg: 3500, deckLengthMm: 6500, deckWidthMm: 2300, equipment: ['winch', 'strap roda', 'dolly'], status: 'active',
    specSource: 'synthetic', costTemplateVersion: 'CT-A-1', ratePerKm: 0, baseCost: 1_150_000,
    lastPosition: { lat: -7.3311, lng: 112.7702, capturedAt: addMinutes(DEMO_CLOCK_C0, -38), source: 'simulated', accuracyM: 30 },
  },
  {
    id: 'B-U1', tenantId: 'tenant-b', code: 'U1', label: 'Flatbed sedang B-U1', ownership: 'own',
    capacityKg: 3000, deckLengthMm: 6000, deckWidthMm: 2200, equipment: ['winch', 'strap roda'], status: 'active',
    specSource: 'synthetic', costTemplateVersion: 'CT-B-1', ratePerKm: 10_000, baseCost: 420_000,
    lastPosition: { lat: -7.2711, lng: 112.7440, capturedAt: addMinutes(DEMO_CLOCK_C0, -2), source: 'simulated', accuracyM: 14 },
  },
];

/**
 * Paket layanan towing (keputusan pengguna 25 Okt 2026). Nama paket umum di industri towing; deskripsi
 * ditulis sendiri. Harga "mulai dari" sintetis berlabel DEMO, bukan tarif operator nyata; harga pasti
 * tetap datang dari penawaran operator.
 */
export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    kind: 'car_towing',
    name: 'Car Towing',
    tagline: 'Satu mobil, langsung diangkut truk towing',
    description: 'Mobil Anda dinaikkan ke truk towing ukuran sedang. Truknya cukup lincah untuk masuk ke jalan kecil, jadi cepat sampai di lokasi jemput dan tujuan.',
    bestFor: ['Mobil mogok atau habis kecelakaan', 'Lokasi di gang atau daerah pelosok', 'Butuh cepat sampai'],
    speed: 'fastest',
    cost: 'standard',
    capacity: '1 mobil',
    vehicleClass: 'car',
    startFrom: 850_000,
    priceUnit: 'per mobil',
  },
  {
    kind: 'car_carrier',
    name: 'Car Carrier',
    tagline: 'Kirim banyak mobil sekaligus, lebih hemat',
    description: 'Mobil diangkut truk panjang yang memuat hingga 6 mobil sekaligus. Biaya per mobil lebih hemat bila mengirim beberapa mobil, tetapi waktu tempuhnya sedikit lebih lama dibanding towing.',
    bestFor: ['Pindah kota tanpa terburu-buru', 'Dealer atau kantor yang kirim beberapa mobil', 'Mobil dalam kondisi baik'],
    speed: 'slower',
    cost: 'saver',
    capacity: 'Hingga 6 mobil',
    vehicleClass: 'car',
    startFrom: 750_000,
    priceUnit: 'per mobil',
  },
  {
    kind: 'motor_storing',
    name: 'Storing Motor',
    tagline: 'Angkut motor dan moge dengan aman',
    description: 'Truk khusus motor dengan rel atau tangga, jadi motor besar bisa naik dengan mudah dan diikat dengan aman sampai tujuan.',
    bestFor: ['Moge dan motor sport', 'Motor mogok atau bannya rusak', 'Kirim motor ke luar kota'],
    speed: 'fast',
    cost: 'saver',
    capacity: 'Hingga 4 motor',
    vehicleClass: 'motorcycle',
    startFrom: 450_000,
    priceUnit: 'per motor',
  },
  {
    kind: 'self_drive',
    name: 'Self Drive',
    tagline: 'Mobil Anda dikemudikan sopir berpengalaman',
    description: 'Sopir berpengalaman mengemudikan mobil Anda lewat darat sampai tujuan. Tarifnya lebih terjangkau, asalkan mobil dalam kondisi layak jalan.',
    bestFor: ['Mobil sehat dan siap jalan', 'Pindah kota dengan biaya ringan', 'Tidak ada truk yang bisa masuk'],
    speed: 'fast',
    cost: 'saver',
    capacity: '1 mobil',
    vehicleClass: 'car',
    startFrom: 500_000,
    priceUnit: 'per mobil',
  },
];

/** Kendaraan demo PRD F-04 untuk alur D-01: 1.800 kg, 4500×1800 mm. */
export const DEMO_VEHICLE_SPEC = { weightKg: 1800, lengthMm: 4500, widthMm: 1800 };
