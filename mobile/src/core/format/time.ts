/**
 * Waktu bisnis Tovv. Disimpan UTC; ditampilkan menurut zona IANA tenant.
 * Zona Indonesia tidak memakai DST, sehingga offset tetap cukup untuk tahap frontend.
 */
export const DEMO_CLOCK_C0 = '2026-10-21T05:00:00.000Z';
export const DATASET_GENERATION = 'tovv-2.1-f09';
export const DEFAULT_TZ = 'Asia/Jakarta';

const ZONES: Record<string, { offsetMin: number; abbr: string }> = {
  'Asia/Jakarta': { offsetMin: 7 * 60, abbr: 'WIB' },
  'Asia/Makassar': { offsetMin: 8 * 60, abbr: 'WITA' },
  'Asia/Jayapura': { offsetMin: 9 * 60, abbr: 'WIT' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function zone(tz: string) {
  return ZONES[tz] ?? ZONES[DEFAULT_TZ]!;
}

/** Day 1 = 22 September 2026 (PRD §8.1). Mengembalikan ISO UTC untuk jam lokal WIB pada hari itu. */
export function dayAt(day: number, hour: number, minute = 0): string {
  const base = Date.UTC(2026, 8, 21 + day, hour - 7, minute, 0, 0);
  return new Date(base).toISOString();
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}

export function addDays(iso: string, days: number): string {
  return addMinutes(iso, days * 24 * 60);
}

/** Tanggal lokal (YYYY-MM-DD) menurut zona bisnis. */
export function localDate(iso: string, tz = DEFAULT_TZ): string {
  const shifted = new Date(Date.parse(iso) + zone(tz).offsetMin * 60_000);
  return shifted.toISOString().slice(0, 10);
}

export function addLocalDays(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00.000Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Selisih hari kalender antara dua tanggal lokal (b − a). */
export function diffLocalDays(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

function parts(iso: string, tz: string) {
  const z = zone(tz);
  const d = new Date(Date.parse(iso) + z.offsetMin * 60_000);
  return {
    day: d.getUTCDate(),
    month: MONTHS[d.getUTCMonth()] ?? '',
    year: d.getUTCFullYear(),
    hh: String(d.getUTCHours()).padStart(2, '0'),
    mm: String(d.getUTCMinutes()).padStart(2, '0'),
    abbr: z.abbr,
  };
}

export function formatDate(iso: string | null, tz = DEFAULT_TZ): string {
  if (!iso) return '—';
  const p = parts(iso, tz);
  return `${p.day} ${p.month} ${p.year}`;
}

export function formatLocalDate(date: string | null): string {
  if (!date) return '—';
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function formatTime(iso: string | null, tz = DEFAULT_TZ): string {
  if (!iso) return '—';
  const p = parts(iso, tz);
  return `${p.hh}.${p.mm} ${p.abbr}`;
}

export function formatDateTime(iso: string | null, tz = DEFAULT_TZ): string {
  if (!iso) return '—';
  const p = parts(iso, tz);
  return `${p.day} ${p.month} ${p.year}, ${p.hh}.${p.mm} ${p.abbr}`;
}

export function formatShortDateTime(iso: string | null, tz = DEFAULT_TZ): string {
  if (!iso) return '—';
  const p = parts(iso, tz);
  return `${p.day} ${p.month}, ${p.hh}.${p.mm}`;
}

/** Umur dalam bahasa sehari-hari: "45 dtk lalu", "12 mnt lalu", "3 jam lalu", "2 hari lalu". */
export function formatAge(fromIso: string, nowIso: string): string {
  const s = Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(fromIso)) / 1000));
  if (s < 60) return `${s} dtk lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

/** Sisa waktu sampai `toIso`: "berakhir 3 jam lagi" / "lewat 2 jam". */
export function formatUntil(toIso: string, nowIso: string): string {
  const s = Math.round((Date.parse(toIso) - Date.parse(nowIso)) / 1000);
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const span = d >= 2 ? `${d} hari` : h >= 1 ? `${h} jam` : `${Math.max(1, m)} mnt`;
  return s >= 0 ? `${span} lagi` : `lewat ${span}`;
}

export function secondsBetween(aIso: string, bIso: string): number {
  return (Date.parse(bIso) - Date.parse(aIso)) / 1000;
}

export function zoneAbbr(tz = DEFAULT_TZ): string {
  return zone(tz).abbr;
}

/** Jam lokal WIB pada tanggal lokal tertentu → ISO UTC. */
export function localAt(date: string, hour: number, minute = 0): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, hour - 7, minute)).toISOString();
}

/** Preset waktu yang mudah dipilih di lapangan (tanpa pemilih tanggal kecil). */
export function timePresets(nowIso: string): { label: string; start: string }[] {
  const today = localDate(nowIso);
  const plus2 = new Date(Math.ceil((Date.parse(nowIso) + 2 * 3600_000) / 1_800_000) * 1_800_000).toISOString();
  return [
    { label: `Hari ini ${formatTime(plus2)}`, start: plus2 },
    { label: 'Besok 08.00 WIB', start: localAt(addLocalDays(today, 1), 8) },
    { label: 'Besok 13.00 WIB', start: localAt(addLocalDays(today, 1), 13) },
    { label: 'Lusa 08.00 WIB', start: localAt(addLocalDays(today, 2), 8) },
  ];
}
