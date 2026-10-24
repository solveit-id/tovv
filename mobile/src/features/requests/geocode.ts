import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Place } from '@/domain/types';
import { t } from '@/core/i18n';

/**
 * Pencarian alamat lewat layanan peta bawaan HP (Apple di iOS, Geocoder Android) — gratis, tanpa API key.
 * Hasilnya alamat sungguhan yang hanya disimpan lokal di HP (mode demo). Tidak ada koordinat karangan:
 * titik berasal dari HP, GPS, atau pin yang digeser pengguna.
 *
 * Layanan Apple membatasi jumlah permintaan, jadi alamat dari titik yang sama disimpan sementara dan
 * pencarian membaca alamat satu per satu.
 */

/** Di Android, layanan alamat HP baru bisa dipakai setelah izin lokasi diberikan. iOS tidak memerlukannya. */
export async function ensureGeocoderAccess(ask: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const now = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (now?.granted) return true;
  if (!ask || now?.canAskAgain === false) return false;
  const res = await Location.requestForegroundPermissionsAsync().catch(() => null);
  return !!res?.granted;
}

function addressOf(a: Location.LocationGeocodedAddress): { label: string; address: string } {
  const street = [a.street, a.streetNumber].filter(Boolean).join(' ');
  const label = a.name && a.name !== a.streetNumber ? a.name : street || a.district || a.city || '';
  const address = a.formattedAddress || [street, a.district, a.subregion ?? a.city, a.region].filter(Boolean).join(', ');
  return { label: label || address, address: address || label };
}

const cache = new Map<string, { label: string; address: string } | null>();
const cacheKey = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

/** Titik yang alamatnya tidak terbaca tetap bisa dipakai; operator memastikan lokasinya lewat telepon. */
export function unnamedPoint(lat: number, lng: number): Place {
  return { label: t('Titik pilihan di peta'), address: t('Alamat belum terbaca. Operator akan memastikan lewat telepon.'), lat, lng };
}

/** Koordinat → tempat. Bila layanan peta HP tidak menjawab, tempat tetap dibuat dari titiknya. */
export async function placeFromPoint(lat: number, lng: number): Promise<Place> {
  const key = cacheKey(lat, lng);
  if (!cache.has(key)) {
    let found: { label: string; address: string } | null = null;
    try {
      if (await ensureGeocoderAccess(false)) {
        const [hit] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (hit) {
          const named = addressOf(hit);
          if (named.address) found = named;
        }
      }
    } catch {
      // Layanan alamat HP tidak tersedia: jatuh ke titik tanpa nama di bawah.
    }
    if (found) cache.set(key, found);
    else return unnamedPoint(lat, lng);
  }
  const hit = cache.get(key);
  return hit ? { ...hit, lat, lng } : unnamedPoint(lat, lng);
}

export type SearchState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; results: Place[] }
  | { status: 'denied' }
  | { status: 'unavailable' };

/** Cari alamat setelah pengguna berhenti mengetik 700 ms (minimal 4 huruf); maksimal 3 hasil. */
/** `nonce` dinaikkan untuk mencari ulang (mis. setelah izin lokasi diberikan). */
export function useAddressSearch(query: string, nonce = 0): SearchState {
  const q = query.trim();
  const [answer, setAnswer] = useState<{ q: string; nonce: number; state: SearchState } | null>(null);
  const seq = useRef(0);
  useEffect(() => {
    const id = ++seq.current;
    if (q.length < 4) return;
    const timer = setTimeout(async () => {
      try {
        if (!(await ensureGeocoderAccess(false))) {
          if (id === seq.current) setAnswer({ q, nonce, state: { status: 'denied' } });
          return;
        }
        const hits = (await Location.geocodeAsync(q)).slice(0, 3);
        const places: Place[] = [];
        for (const h of hits) {
          if (id !== seq.current) return;
          places.push(await placeFromPoint(h.latitude, h.longitude));
        }
        const unique = places.filter((p, i) => places.findIndex((x) => x.address === p.address) === i);
        if (id === seq.current) setAnswer({ q, nonce, state: { status: 'done', results: unique } });
      } catch {
        if (id === seq.current) setAnswer({ q, nonce, state: { status: 'unavailable' } });
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [q, nonce]);
  if (q.length < 4) return { status: 'idle' };
  return answer?.q === q && answer.nonce === nonce ? answer.state : { status: 'searching' };
}

/** Lokasi HP sekarang. Izin diminta lebih dulu oleh pemanggil (lewat dialog). `null` bila GPS tidak menjawab. */
export async function currentPoint(): Promise<{ lat: number; lng: number } | 'denied' | null> {
  const perm = await Location.getForegroundPermissionsAsync();
  if (!perm.granted) return 'denied';
  const fix =
    (await Location.getLastKnownPositionAsync({ maxAge: 60_000 }).catch(() => null)) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null));
  return fix ? { lat: fix.coords.latitude, lng: fix.coords.longitude } : null;
}
