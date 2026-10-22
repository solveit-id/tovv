# Pengembangan aplikasi mobile Tovv

## Versi terkunci (T-01, tahap frontend)

| Komponen | Versi | Alasan |
|---|---|---|
| Node | 22.23.1 (minimum 22.13) | Persyaratan Expo SDK 57 (docs.expo.dev/versions, dibaca 2026-10-21) |
| npm | 10.9.8, `package-lock.json` | Satu package manager |
| Expo SDK | 57.0.30 | SDK 58 baru terbit 15 Okt 2026 dan changelog-nya menyatakan Expo Go SDK 58 baru masuk store "dalam beberapa minggu"; SDK 57 matang dan dapat dibuka Expo Go store di iPhone tanpa Mac |
| React Native / React | 0.86.3 / 19.2.3 | Kombinasi bawaan SDK 57 |
| Expo Router | 57.0.28 | Bawaan SDK 57 |
| Reanimated / Worklets | 4.5.1 / 0.10.1 | `expo install` |
| TanStack Query | 5.104.5 | JS murni |
| TypeScript | 6.0.x, strict + `noUncheckedIndexedAccess` | Template SDK 57 |

Semua paket native dipasang dengan `npx expo install` sehingga versinya mengikuti `bundledNativeModules.json` SDK 57; tidak ada paket yang dinaikkan sendiri ke versi terbaru. `qrcode` 1.5.4 (JS murni) dipakai untuk QR internal.

## Menjalankan

```bash
cd mobile
npm ci
npm test && npm run typecheck && npm run lint
```

### Android — development build (emulator atau perangkat USB)

Prasyarat Windows: JDK (JBR Android Studio), `ANDROID_HOME` ke Android SDK, platform-tools di PATH, NDK 27.1 (diunduh otomatis oleh Gradle bila belum ada).

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
npm run android          # expo run:android: prebuild, build debug, install, buka Metro
```

Perangkat fisik: aktifkan USB debugging, cek `adb devices`, lalu `npm run android -- --device`.

### iPhone tanpa Mac — Expo Go

Development build iOS memerlukan Xcode (macOS) atau layanan build berbayar/akun Apple Developer; keduanya di luar batas tahap ini. Pilihan yang tersedia: Expo Go SDK 57 dari App Store.

```bash
npm run start:go -- --tunnel   # atau tanpa --tunnel bila iPhone dan komputer satu jaringan
```

Pindai QR dengan kamera iPhone. Semua modul yang dipakai (kamera, lokasi, galeri, file system, SQLite, Reanimated, SVG, view-shot) termasuk dalam Expo Go. Bukti dari Expo Go dicatat sebagai "Expo Go", bukan development build iOS.

## Mode demo

- Layar **Mulai → Pilih akun demo**: akun fixture F-05 (tenant A "Operator Angkut Demo", tenant B "Operator Mobilitas Demo"). Akun dengan beberapa kemampuan (owner-A juga driver) memilih konteks secara eksplisit.
- **Lainnya → Mode demo & tentang**: simulasi offline, gagal baca sekali, penyimpanan penuh, jeda replay lokasi (menjadi "posisi lama" setelah 90 detik), paket SaaS kedaluwarsa, reset ke F-09.
- Jam bisnis demo = C0 `2026-10-21T05:00Z` (12.00 WIB) + waktu nyata sejak reset. Penawaran A13 kedaluwarsa tepat di C0 sesuai PRD §8.1.
- State demo (transaksi, antrean sinkronisasi, sesi demo) disimpan di SQLite key-value perangkat; foto disalin ke `Paths.document/tovv-media/`.

## Struktur kode

```text
mobile/src/
  app/                 Route Expo Router (tipis; re-export layar fitur)
  features/<domain>/   Layar per domain: owner, admin, driver, customer, orders, trips, camera,
                       requests, quotes, pricing, finance, reports, more, work, home, identity
  components/          ui (primitif), nota (komponen khas), layout, brand, feedback
  core/                design (token, motion), format (uang, waktu, CSV), i18n (label status), hooks
  domain/              Tipe kanonik, rumus harga, ledger, analytics M-01–M-12 (+ uji oracle)
  data/api/            Kontrak DTO, adapter demo, provider, hook query/mutation
  data/demo/           Store demo, simulasi kebijakan server, proyeksi, operasi per domain
  data/fixtures/       F-03/F-04/F-05 (referensi) dan builder F-09
```

Mengganti sumber data: implementasikan objek dengan tipe `TovvApi` (`data/api/demo-api.ts`) yang memanggil Tovv API (`/api/v1`, INTEGRATION_PLAN §3), lalu pasang di `data/api/provider.tsx`. Layar tidak perlu diubah karena hanya bergantung pada DTO di `data/api/contract.ts`.

## Ikon dan splash

`node scripts/generate-brand-assets.mjs` membuat `assets/icon.png`, ikon adaptif Android, monochrome, favicon, dan splash dari geometri wordmark sementara (deterministik, tanpa dependensi gambar).
