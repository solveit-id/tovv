/** Koordinat sederhana (derajat). */
export interface LatLng {
  lat: number;
  lng: number;
}

const rad = (d: number) => (d * Math.PI) / 180;

/** Jarak garis lurus (km). Selalu ditampilkan dengan label "garis lurus", bukan jarak jalan. */
export function straightKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

/** Arah dari a ke b dalam derajat (0 = utara, searah jarum jam). */
export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** "1,4 km" / "850 m" untuk jarak garis lurus. */
export function formatKm(km: number, locale: 'id' | 'en' = 'id'): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  const v = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `${locale === 'id' ? v.replace('.', ',') : v} km`;
}
