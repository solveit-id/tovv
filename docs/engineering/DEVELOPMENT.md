# Pengembangan aplikasi mobile Tovv

Diperbarui 23 Oktober 2026.

## Versi terkunci (T-01, tahap frontend)

| Komponen | Versi | Alasan |
|---|---|---|
| Node | 22.23.1 (minimum 22.13; 23 dan 25 tidak didukung) | Persyaratan Expo SDK 58 |
| npm | 10.9.8, `package-lock.json` | Satu package manager |
| Expo SDK | ~58.0.19 | Expo Go di App Store/Play Store sekarang hanya membuka SDK 58; iPhone tidak bisa memasang Expo Go versi lama |
| React Native / React | 0.88.0 / 19.3.0 | Kombinasi bawaan SDK 58 |
| Expo Router | ~58.0.26 | Bawaan SDK 58 |
| Plus Jakarta Sans | `@expo-google-fonts/plus-jakarta-sans` 0.4.2 | Font antarmuka (OFL); dimuat lewat expo-font, termasuk di Expo Go |
| Reanimated / Worklets | 4.7.1 / 0.13.0 | `expo install` |
| react-native-maps | 1.29.11 | `expo install`; termasuk di Expo Go |
| TanStack Query | 5.104.5 | JS murni |
| TypeScript | 6.0.x, strict + `noUncheckedIndexedAccess` | Template SDK 58 |

Semua paket native dipasang dengan `npx expo install` sehingga versinya mengikuti SDK 58. `qrcode` 1.5.4 (JS murni) dipakai untuk QR internal.

## Menjalankan

```bash
cd mobile
npm ci
npm test && npm run typecheck && npm run lint
```

### Di HP lewat Expo Go (iPhone dan Android) — cara yang disarankan

1. Pasang/perbarui **Expo Go** (versi SDK 58) dari App Store/Play Store, lalu masuk dengan akun Expo.
2. Di komputer: `npx expo login` dengan akun yang sama (sekali saja).
3. `npm run start:go` — laptop dan HP harus di Wi-Fi yang sama. Bila tidak bisa, `npm run start:go -- --tunnel`.
4. iPhone: pindai QR dengan Kamera. Android: pindai dari dalam Expo Go.

Semua modul yang dipakai (kamera, lokasi, galeri, file system, SQLite, Reanimated, SVG, view-shot, peta) termasuk dalam Expo Go. `npm start` (tanpa `:go`) hanya untuk development build; QR-nya tidak bisa dibuka Expo Go.

### Android — development build (emulator atau USB)

Prasyarat Windows: JDK (JBR Android Studio), `ANDROID_HOME`, platform-tools di PATH, NDK 27.1.

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
npm run android
```

Catatan peta: di development build/rilis Android, Google Maps butuh API key di `app.json` (`android.config.googleMaps.apiKey`). Tanpa key, tab Peta tidak bisa dipakai di build tersebut; di Expo Go tidak perlu key. Keputusan provider dan biayanya masih DEC-08. Development build yang terpasang di emulator saat ini dibuat sebelum react-native-maps ditambahkan, jadi harus dibangun ulang.

iOS development build memerlukan macOS/Xcode dan belum dibuat.

### Naik versi SDK

Expo Go di store hanya membuka SDK terbaru, jadi saat Expo merilis SDK baru dan Expo Go di HP diperbarui, proyek harus ikut naik:

```bash
npx expo install expo@^<versi> --fix
npx expo-doctor
npm run typecheck && npm run lint && npm test
npx expo export --platform ios --platform android --output-dir <folder sementara>
```

Catatan SDK 58: tipe TypeScript React Native 0.88 lebih ketat (ref memakai `ViewInstance`/`ScrollViewInstance`/`TextInputInstance`; `StyleSheet.NamedStyles` dihapus sehingga `makeStyles` memakai tipe sendiri), `File.write()` kini async, dan mock Jest Reanimated 4.7.1 perlu `setCSSEventHandler` dibuat no-op (lihat `components.test.tsx`).

## Mode demo

- **Masuk** (`/auth/login`): ketuk akun Owner/Driver/Pelanggan untuk mengisi email, lalu Masuk. Kata sandi semua akun fixture: `demo1234`. **Daftar** membuat akun pelanggan yang hanya tersimpan di HP; **Lupa kata sandi** hanya simulasi (tidak ada email). Ini bukan autentikasi produksi (TEN-04).
- **Pilih akun demo** (`/demo`, juga lewat tombol "Ganti" di pita DEMO): semua akun fixture F-05 untuk tiga peran.
- **Lainnya**: pindah peran (owner-A juga driver), Bahasa (Indonesia/English), Tampilan (ikut sistem/terang/gelap), Mode demo & tentang (simulasi offline, gagal muat, penyimpanan penuh, jeda posisi, langganan kedaluwarsa, reset data), Keluar.
- Jam bisnis demo = C0 `2026-10-21T05:00Z` (12.00 WIB) + waktu nyata sejak reset.
- State demo (transaksi, antrean kirim ulang, sesi, akun yang didaftarkan, preferensi bahasa/tema) disimpan di SQLite key-value HP; foto disalin ke `Paths.document/tovv-media/`.

## Struktur kode

```text
mobile/src/
  app/                 Route Expo Router (tipis; re-export layar fitur)
    auth/              login, register, forgot-password
    owner/ driver/ customer/   tab per peran: index, jobs/orders, map, finance/invoices, expenses, sync, more
  features/<domain>/   Layar per domain: auth, owner, driver, customer, map, orders, trips, camera,
                       requests, services, quotes, pricing, finance, reports, more, work, home, identity
  components/          ui (teks, tombol, kartu, form, ringkasan, kerangka muat), business (tindakan
                       harian, tahap perjalanan, rute ringkas, riwayat versi, QR internal), layout
                       (layar, header parallax, tab), brand (wordmark, unit derek + loader),
                       feedback (toast, splash, transisi ganti mode)
  core/                design (token terang/gelap + mode driver, tema, motion), format (uang, waktu,
                       CSV, jarak/arah garis lurus),
                       i18n (bahasa, kamus Inggris, label status), hooks
  domain/              Tipe kanonik, rumus harga, ledger, analytics M-01–M-12 (+ uji oracle)
  data/api/            Kontrak DTO, adapter demo, provider, hook query/mutation
  data/demo/           Store demo, simulasi kebijakan server, login demo, peta langsung, operasi per domain
  data/fixtures/       F-03/F-04/F-05 (referensi) dan builder F-09
```

Mengganti sumber data: buat objek bertipe `TovvApi` (`data/api/demo-api.ts`) yang memanggil Tovv API (`/api/v1`, INTEGRATION_PLAN §3), lalu pasang di `data/api/provider.tsx`. Layar tidak perlu diubah karena hanya bergantung pada DTO di `data/api/contract.ts`.

## Dua bahasa

- Teks sumber ditulis dalam bahasa Indonesia langsung di kode. `core/i18n/en.ts` memetakan teks yang sama ke bahasa Inggris; placeholder memakai `{0}`, `{1}`.
- `Txt` menerjemahkan anak berupa teks secara otomatis. Teks dinamis memakai `t('Halo, {0}', [nama])`; label aksesibilitas memakai `tr()`.
- Bahasa awal mengikuti HP; pilihan pengguna disimpan. Saat bahasa diganti, layar dibangun ulang dan data dimuat ulang.
- Uji `core/i18n/i18n.test.ts` memeriksa setiap entri kamus punya placeholder yang sama, dan setiap teks `t('…')` di `features/` dan `components/` punya entri bahasa Inggris (uji gagal bila terlewat).

## Peta langsung

`features/map/live-map-screen.tsx` dipakai ketiga peran. Data dari `api.getLiveMap()` (`data/demo/live-map.ts`) diperbarui tiap 2 detik **hanya selama layar peta terbuka** (`useIsFocused`). Penanda truk (`map-markers.tsx`) adalah truk tampak atas yang menghadap arah geraknya dan meluncur linier selama jeda pembaruan: Android memakai `animateMarkerToCoordinate` (native), iOS memakai `AnimatedRegion`. Penanda, rute, dan kartu di-memo dengan callback stabil supaya pembaruan posisi tidak menggambar ulang semuanya; gambar penanda hanya digambar ulang saat isinya berubah. Owner melihat semua unit, driver hanya tugasnya, pelanggan hanya truk yang menuju kendaraannya setelah sopir berangkat. Layar Perjalanan memakai `mini-track-map.tsx`.

## Pemilih lokasi

`features/requests/place-picker.tsx` + `geocode.ts`: pencarian alamat memakai `Location.geocodeAsync`/`reverseGeocodeAsync` dari expo-location (layanan peta bawaan iOS/Android, tanpa API key; tersedia di Expo Go), lokasi HP dengan izin "saat aplikasi dipakai", dan konfirmasi pin di peta. Tempat tersimpan dan terakhir dipakai datang dari `api.getPlaceBook()`. Titik selalu berasal dari HP, GPS, atau pin yang digeser pengguna — tidak ada koordinat karangan. Bila layanan alamat HP tidak menjawab, tempat tetap dibuat dari koordinat pin, dan alamat ketikan tanpa titik peta tetap bisa dipakai.

## Tema dan gerak

- Dua palet (terang/gelap) dengan kunci sama di `core/design/tokens.ts`, plus palet mode driver lewat `paletteFor(scheme, 'field')`. Sesi peran driver otomatis dibungkus `ThemeModeScope mode="field"` (`app/_layout.tsx`). Gaya dibuat lewat `makeStyles((c, scheme, mode) => …)` dan di-cache per skema + mode.
- Semua animasi memakai Reanimated di UI thread dan tidak memantul: splash unit derek, transisi ganti mode, header parallax ringan, bar ringkas, kartu masuk singkat (6 item pertama), tekan = sedikit mengecil, angka menghitung naik, FAB yang menyusut, pil tab dan segmen, kilau kerangka muat, loader unit derek, langkah formulir. "Kurangi gerakan" mematikan gerak ruang.

## Font

Plus Jakarta Sans dimuat di `app/_layout.tsx` (`useFonts(FONT_ASSETS)` dari `core/design/fonts.ts`, lima berat diimpor per file supaya bundel kecil). Splash native ditahan sampai font siap. `Txt` dan `fontStyle()` (untuk TextInput dan label tab) memetakan berat huruf ke nama keluarga; jangan menulis `fontFamily` per layar.

## Dialog, izin, dan toast

- `useDialog()` (`components/feedback/dialog.tsx`): `confirm({...})` → `Promise<boolean>` dan `inform({...})`. Pakai untuk tindakan penting/tak bisa dibatalkan.
- `usePermission()` (`components/feedback/permissions.ts`): `await ask('camera' | 'location' | 'photos')` menjelaskan dulu, lalu memanggil dialog sistem; bila ditolak permanen menawarkan pengaturan HP.
- `useModeSwitch()` (`features/home/use-mode-switch.ts`): pindah owner ↔ driver selalu lewat konfirmasi.
- Di dalam `Modal` (mis. pemilih lokasi) bungkus isi dengan `ToastProvider` + `DialogProvider` sendiri: Modal adalah jendela terpisah, dialog dari akar tidak terlihat di atasnya (iOS).

## Paket layanan

`api.listServicePackages()` membaca `SERVICE_PACKAGES` (`data/fixtures/reference.ts`, harga contoh DEMO). Permintaan menyimpan `service` (`ServiceKind`); data lama tanpa nilai dianggap `car_towing`. Ilustrasi per paket di `components/brand/service-art.tsx`.

## Performa

- Tab yang tidak terlihat dibekukan (`freezeOnBlur`) dan dimuat saat pertama dibuka (`lazy`).
- Query memakai `staleTime` 60 detik; data demo tetap segar karena setiap perubahan store memicu baca ulang (`store.subscribe`).
- Peta hanya memuat posisi selama layar terbuka; penanda dan kartu di-memo.
- Tidak ada animasi yang dihitung per kartu dari posisi gulir.
- Bagian bawah beranda (tindakan, daftar pekerjaan, riwayat, paket) dirender setelah JS lengang lewat `useDeferred()` + `QueryView ready={…}`, sehingga transisi halaman tidak tersendat.
- Ikon diimpor dari `@expo/vector-icons/MaterialCommunityIcons` saja, jadi hanya satu font ikon yang ikut bundel (hemat ±1,5 MB).
- Muat ulang berkala memakai `useFocusInterval()`: berhenti saat layar tidak terlihat walau tab dibekukan.

## Ikon dan splash

`node scripts/generate-brand-assets.mjs` membuat ikon dan splash native dari wordmark sementara. Splash beranimasi di dalam aplikasi ada di `components/feedback/splash-overlay.tsx`. Ilustrasi unit derek (tampak samping, tampak atas, loader) ada di `components/brand/tow-truck.tsx` sebagai SVG dengan warna token, jadi tidak ada file gambar raster tambahan.

## Aturan repository

- Aplikasi mobile di `mobile/`; paket spesifikasi 2.1 di `docs/spec/`; root hanya berisi `README.md`, `AGENTS.md`, `CLAUDE.md`.
- Nama file, folder, route, commit, dan PR dalam bahasa Inggris; isi dokumentasi dalam bahasa Indonesia.
- Commit `(type) short description` tanpa baris co-author/atribusi AI. Promosi `frontend` → `staging` → `main` lewat PR.
- `backend/`, `contracts/`, `tools/admin-harness/`, `infra/`, `.github/workflows/` belum dibuat.
- Screenshot mentah di `.impeccable/review/` (diabaikan Git), dirangkum di [`QA_REPORT.md`](../qa/QA_REPORT.md).
