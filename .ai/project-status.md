# Status proyek — Tovv

Diperbarui 23 Oktober 2026. Hanya fakta yang sudah diperiksa. Aturan: `../AGENTS.md`; fakta produk: `../docs/spec/PRD.md`, `../docs/PRODUCT.md`; status per task: `../docs/spec/IMPLEMENTATION_PLAN.md` §0.

## Alur kerja

1. Baca `AGENTS.md`, lalu file ini. Cek `git status`, branch (`frontend` untuk pekerjaan mobile), dan `git fetch`.
2. Persiapan: `cd mobile && npm ci`. Build Android butuh `JAVA_HOME` (JBR Android Studio) dan `ANDROID_HOME`.
3. Perubahan: layar memakai adapter bertipe (`mobile/src/data/api`); aturan bisnis di `mobile/src/domain` dengan tes; warna hanya lewat `useColors()` / `makeStyles()`; teks baru wajib diberi entri bahasa Inggris di `mobile/src/core/i18n/en.ts`.
4. Verifikasi sebelum menyatakan selesai: `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor`; untuk tampilan, ambil screenshot emulator/HP ke `.impeccable/review/` dan rangkum di `docs/QA_REPORT.md` (perangkat, OS, jenis build, mode, tema, bahasa).
5. Rilis: commit `(type) short description` dalam bahasa Inggris tanpa co-author/atribusi AI → push `frontend` → PR ke `staging` → PR `staging` → `main`. Tanpa force-push atau melewati proteksi.

## Sudah di-merge

- PR #1/#2 (22 Okt 2026): tahap frontend pertama.
- PR #3/#4 (22 Okt 2026): desain ulang gaya super-app/fintech, tema terang + gelap, gerak, perapian dokumen.
- Putaran 23 Okt 2026: tiga peran, peta langsung, splash + akun demo, dua bahasa, penulisan ulang teks, penamaan bahasa Inggris. Lihat `git log` dan PR berikutnya.

## Tahap frontend (`mobile/`)

- Expo SDK 58 (`expo` ~58.0.17), RN 0.88.0, React 19.3.0, Expo Router 58, TanStack Query 5, Reanimated 4.7.1, react-native-maps 1.29.11, TypeScript strict. Dinaikkan dari SDK 57 pada 23 Okt 2026 karena Expo Go di store kini hanya membuka SDK 58. npm + `package-lock.json`.
- Tiga peran di aplikasi (owner, driver, pelanggan). Peran `admin` tetap di model data dan uji kebijakan adapter.
- Desain: `docs/DESIGN.md`. Dua palet, splash beranimasi, header parallax, scroll-trigger, tekan 3D, peta langsung.
- Dua bahasa (Indonesia sumber, Inggris di `core/i18n/en.ts`), mengikuti bahasa HP dan bisa diganti.
- Adapter demo bertipe (`mobile/src/data/api/demo-api.ts`) di atas fixture F-09: kebijakan server simulasi, daftar tindakan harian, ledger, analytics, login demo, peta per peran.
- Tes: 1.292 uji Jest lulus; typecheck dan lint bersih; expo-doctor 20/20 (jumlah cek SDK 58).
- Bukti perangkat putaran 23 Okt: belum ada (lihat `docs/QA_REPORT.md`); pengguna menguji sendiri lewat Expo Go.

## Belum dikerjakan (tetap scope PROTO)

Backend (Laravel/MySQL/Redis/Reverb), otorisasi server dan transaksi atomik, login perangkat sungguhan (TEN-04), tracking latar belakang + realtime, push, PDF server, upload media ke storage privat, Solveit Admin, backup/restore, observability, pengukuran performa rilis, CRUD armada/tarif, API key Google Maps untuk build Android. iOS development build: terblokir (tanpa macOS/Xcode).

## Fakta repository

- Remote `solveit-id/tovv` publik; belum ada proteksi branch atau workflow CI, jadi pemeriksaan lokal adalah gerbang merge.
- `npm audit`: temuan transitif di toolchain Expo; satu-satunya perbaikan otomatis menurunkan Expo, jadi tidak diterapkan.
- Port 8081/8083/8090 di laptop pengembang dipakai `wslrelay` (WSL); pakai port lain untuk Metro bila bentrok.

## Keputusan terbuka / langkah berikutnya

1. Hasil uji pengguna di HP (peta, akun, bahasa, tema) → perbaikan bila ada, lalu review desain independen dengan tangkapan layar.
2. Branch `backend`: scaffold Laravel 13 sesuai ARCHITECTURE, lalu ganti `createDemoApi` dengan adapter HTTP bertipe `TovvApi` yang sama.
3. Logo resmi Tovv untuk mengganti wordmark sementara (`mobile/src/components/brand/wordmark.tsx`, `mobile/scripts/generate-brand-assets.mjs`).
4. Provider peta dan biayanya (DEC-08), termasuk API key Google Maps untuk build Android.
