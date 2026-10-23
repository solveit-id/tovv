import { useSyncExternalStore } from 'react';
import { EN } from './en';

/**
 * Dua bahasa: Indonesia (sumber) dan Inggris. Teks sumber ditulis dalam bahasa Indonesia langsung di kode;
 * `en.ts` memetakan teks yang sama ke bahasa Inggris. Bila belum ada terjemahan, teks Indonesia yang tampil.
 * Placeholder posisi: `{0}`, `{1}`, … diisi dari argumen.
 */
export type Locale = 'id' | 'en';

const KEY = 'tovv.locale';

type KV = { getItemSync: (k: string) => string | null; setItemSync: (k: string, v: string) => void };
function kv(): KV | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('expo-sqlite/kv-store') as { default: KV }).default;
  } catch {
    return null;
  }
}

function deviceLocale(): Locale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return tag.startsWith('id') || tag.startsWith('in') ? 'id' : 'en';
  } catch {
    return 'id';
  }
}

function initial(): Locale {
  // Uji otomatis selalu memakai teks sumber (Indonesia) agar hasilnya tidak bergantung bahasa mesin.
  if (process.env.NODE_ENV === 'test') return 'id';
  try {
    const saved = kv()?.getItemSync(KEY);
    if (saved === 'id' || saved === 'en') return saved;
  } catch {
    // abaikan
  }
  return deviceLocale();
}

let current: Locale = initial();
const listeners = new Set<() => void>();

export const getLocale = () => current;

export function setLocale(l: Locale) {
  if (l === current) return;
  current = l;
  try {
    kv()?.setItemSync(KEY, l);
  } catch {
    // abaikan: pilihan bahasa bukan data penting
  }
  listeners.forEach((f) => f());
}

function subscribe(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** Bahasa aktif sebagai state React; komponen yang memakainya digambar ulang saat bahasa berganti. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}

function fill(s: string, args?: readonly (string | number | null | undefined)[]) {
  return args ? s.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)] ?? '')) : s;
}

/** Terjemahkan teks sumber (Indonesia) ke bahasa aktif, lalu isi placeholder. */
export function t(text: string, args?: readonly (string | number | null | undefined)[]): string {
  return fill(current === 'en' ? (EN[text] ?? text) : text, args);
}

/** Untuk komponen teks: terjemahkan hanya bila teks persis ada di kamus (aman dipanggil dua kali). */
export function tr(text: string): string {
  return current === 'en' ? (EN[text] ?? text) : text;
}
