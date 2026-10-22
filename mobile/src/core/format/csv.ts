/**
 * Sel CSV aman: awalan = + - @ tab CR diberi apostrof agar tidak dieksekusi sebagai formula spreadsheet
 * (PRD §7, RPT-02), lalu di-quote bila perlu.
 */
export function csvCell(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v) && !/^-?\d+$/.test(v)) v = `'${v}`;
  if (/[",\n\r]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}
