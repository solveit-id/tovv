import type { DemoDb } from './db';
import { viewsFor } from './policy';
import { ApiError } from '@/data/api/contract';
import { APP_VIEWS, type User, type ViewGroup } from '@/domain/types';
import { t } from '@/core/i18n';

/**
 * Login demo lokal. Bukan autentikasi produksi (TEN-04 tetap tugas backend): tidak ada server,
 * token, atau email sungguhan. Semua akun fixture memakai satu kata sandi demo yang ditampilkan di layar.
 */
export const DEMO_PASSWORD = 'demo1234';

/** Hash ringan agar kata sandi akun yang didaftarkan di HP tidak tersimpan apa adanya. Bukan kriptografi. */
function weakHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `d${(h >>> 0).toString(36)}`;
}

const normEmail = (e: string) => e.trim().toLowerCase();

export function appViewsFor(user: User): ViewGroup[] {
  return viewsFor(user).filter((v) => APP_VIEWS.includes(v));
}

export function login(db: DemoDb, email: string, password: string): { userId: string; view: ViewGroup } {
  const user = db.users.find((u) => normEmail(u.email) === normEmail(email));
  const stored = user ? db.credentials?.[user.id] : undefined;
  const ok = user && (stored ? stored === weakHash(password) : password === DEMO_PASSWORD);
  const views = user ? appViewsFor(user) : [];
  if (!user || !ok) throw new ApiError('VALIDATION', t('Email atau kata sandi salah.'));
  if (!views.length) throw new ApiError('FORBIDDEN', t('Akun ini belum bisa dipakai di aplikasi. Gunakan akun owner, driver, atau pelanggan.'));
  return { userId: user.id, view: views[0]! };
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

/** Daftar sebagai pelanggan pribadi di operator demo pertama. Akun hanya tersimpan di HP ini. */
export function register(db: DemoDb, input: RegisterInput): { userId: string; view: ViewGroup } {
  const name = input.name.trim();
  const email = normEmail(input.email);
  if (name.length < 2) throw new ApiError('VALIDATION', t('Tulis nama lengkap Anda.'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('VALIDATION', t('Format email belum benar.'));
  if (input.password.length < 8) throw new ApiError('VALIDATION', t('Kata sandi minimal 8 karakter.'));
  if (db.users.some((u) => normEmail(u.email) === email)) throw new ApiError('VALIDATION', t('Email ini sudah terdaftar. Silakan masuk.'));
  const tenantId = db.tenants[0]!.id;
  db.sequences.idCounter += 1;
  const id = `customer-local-${db.sequences.idCounter}`;
  db.users.push({ id, tenantId, name, email, staffRoles: [], customerKind: 'personal', phoneLabel: input.phone.trim() || '—' });
  db.credentials = { ...(db.credentials ?? {}), [id]: weakHash(input.password) };
  return { userId: id, view: 'customer' };
}

/** Selalu berhasil dan tidak membocorkan apakah email terdaftar; tidak ada email yang dikirim. */
export function requestPasswordReset(email: string): { maskedEmail: string } {
  const e = normEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new ApiError('VALIDATION', t('Format email belum benar.'));
  const [local = '', domain = ''] = e.split('@');
  return { maskedEmail: `${local.slice(0, 2)}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}` };
}
