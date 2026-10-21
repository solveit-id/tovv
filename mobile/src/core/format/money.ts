import type { MoneyString, Rupiah } from '@/domain/types';

/** Uang adalah integer rupiah. Fungsi ini menolak nilai pecahan agar float tidak bocor ke tampilan. */
export function assertRupiah(value: number): Rupiah {
  if (!Number.isSafeInteger(value)) throw new Error(`Nominal bukan integer rupiah: ${value}`);
  return value;
}

export function toMoneyString(value: Rupiah): MoneyString {
  return String(assertRupiah(value));
}

export function parseMoneyString(value: MoneyString): Rupiah {
  if (!/^-?\d+$/.test(value)) throw new Error(`Format uang tidak valid: ${value}`);
  return assertRupiah(Number(value));
}

function group(n: number): string {
  return String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "Rp 1.250.000". `null` berarti belum diketahui dan ditulis "—", bukan nol. */
export function formatRupiah(value: Rupiah | MoneyString | null | undefined, opts: { sign?: boolean } = {}): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? parseMoneyString(value) : assertRupiah(value);
  const sign = n < 0 ? '−' : opts.sign && n > 0 ? '+' : '';
  return `${sign}Rp ${group(n)}`;
}

/** Versi ringkas untuk ruang sempit: "Rp 1,25 jt". Tidak dipakai untuk dokumen. */
export function formatRupiahShort(value: Rupiah | null): string {
  if (value === null) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000) {
    const jt = (abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 2).replace('.', ',');
    return `${sign}Rp ${jt} jt`;
  }
  if (abs >= 1_000) return `${sign}Rp ${Math.round(abs / 1000)} rb`;
  return `${sign}Rp ${abs}`;
}

/** Parse input pengguna "1.250.000" / "1250000" menjadi integer; null jika kosong/tidak valid. */
export function parseRupiahInput(text: string): Rupiah | null {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

export function formatInputRupiah(value: Rupiah | null): string {
  return value === null ? '' : group(value);
}

/** Basis point → "1,00%". */
export function formatBps(bps: number | null): string {
  if (bps === null) return '—';
  return `${(bps / 100).toFixed(2).replace('.', ',')}%`;
}

export function formatPercent(ratio: number | null, digits = 2): string {
  if (ratio === null || !Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(digits).replace('.', ',')}%`;
}

/** Angka dengan pemisah ribuan titik: 1.800. */
export function formatNumber(n: number): string {
  return group(n);
}
