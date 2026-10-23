# AGENTS.md — Tovv

Instruksi bersama untuk setiap coding agent di repository ini. Claude Code memuat file ini lewat `CLAUDE.md`.

## Proyek

Tovv adalah SaaS multi-tenant untuk operator derek/pengangkutan kendaraan: satu aplikasi Android + iOS. PRD mendefinisikan empat kelompok tampilan (Owner, Admin, Operator/driver, User/customer); aplikasi saat ini hanya membuka tiga — **owner** (termasuk pekerjaan dispatcher dan finance), **driver**, dan **pelanggan** (keputusan pengguna 23 Oktober 2026). Pemilik, pengembang, dan penerbit: **Solveit Indonesia**. Nama tampil: **Tovv**.

Sumber kebenaran, urutan baca: `PRD.md` → `ARCHITECTURE.md` → `INTEGRATION_PLAN.md` → `IMPLEMENTATION_PLAN.md` → `TEST_PLAN.md` → `VALIDATION_PLAN.md` (paket 2.1, di `docs/spec/`). PRD menang untuk scope dan aturan bisnis; pesan pengguna terbaru mengungguli baseline dan dicatat di IMPLEMENTATION_PLAN §0. Jangan menyalin PRD ke dokumen lain; tautkan saja.

Status dan serah terima: `.ai/project-status.md`. Sistem desain (gaya super-app/fintech, terang + gelap): `docs/DESIGN.md` (sidecar `.impeccable/design.json`). Cakupan layar vs requirement: `docs/SCREEN_INVENTORY.md`. Peta dokumentasi: `docs/README.md`.

## Struktur repository

| Path | Isi |
|---|---|
| `mobile/` | Aplikasi React Native + TypeScript strict + Expo SDK 57 + Expo Router (tahap frontend) |
| `docs/` | Fakta produk, sistem desain, pengembangan, laporan QA; `docs/spec/` berisi paket spesifikasi 2.1 |
| `.ai/` | Serah terima antar-sesi agent |
| `.impeccable/surfaces/` | Kontrak desain Impeccable untuk permukaan aplikasi |

`backend/`, `contracts/`, `tools/admin-harness/`, `infra/` (ARCHITECTURE §2) belum dibuat; jangan menambah folder kosong.

## Batas tahap saat ini

- Hanya frontend. Data dari adapter demo bertipe `mobile/src/data/api/demo-api.ts` (fixture deterministik F-09). Layar tidak pernah mengimpor fixture atau store demo langsung; selalu lewat `useTovvQuery`/`useTovvMutation`/`useApi`.
- Label "DEMO — SIMULASI FRONTEND" harus selalu terlihat. Login, daftar, lupa kata sandi, dan pemilih akun demo hanya mode demo lokal, bukan autentikasi produksi.
- Peta memakai react-native-maps; posisi truk dari replay sintetis F-06 berlabel simulasi. Jangan mengarang koordinat baru.
- Jangan menandai backend/otorisasi server/transaksi atomik/realtime/integrasi selesai hanya karena layarnya ada.
- Tidak ada uang nyata, gateway, QRIS live, rekening asli (hanya `DEMO-NONPAYABLE-A/B`), publikasi store, atau layanan berbayar.
- Requirement NEXT/OUT tidak wajib.

## Perintah (dijalankan dari `mobile/`)

```bash
npm ci
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npm test               # jest (oracle F-09, alur adapter, login demo, peta per peran, token, terjemahan)
npx expo-doctor        # cek dependensi/konfigurasi
npx expo install <pkg> # selalu dipakai untuk paket SDK
npm run start:go       # server untuk Expo Go (SDK 57) — cara utama mencoba di HP
npm start              # server untuk development build
npm run android        # build + pasang development build Android (JDK 17+, Android SDK, NDK 27.1)
```

Jalankan typecheck, lint, dan tes sebelum menyatakan pekerjaan selesai.

## Aturan kode

- TypeScript strict, `noUncheckedIndexedAccess`. Uang dalam rupiah bulat (`number` di dalam, `string` di DTO); persen dalam basis poin; jangan float untuk uang.
- Pakai enum status kanonik PRD §5 (`mobile/src/domain/types.ts`). Tidak ada status tunggal "lunas".
- Biaya yang belum ada adalah `null`, bukan `0`. Kontribusi bukan laba bersih.
- Status selalu tampil dengan teks + ikon + bentuk garis (utuh/putus-putus/coret), bukan warna saja (`mobile/src/core/i18n/status.ts`).
- Token desain di `mobile/src/core/design/tokens.ts` (palet terang dan gelap berkunci sama). Layar membaca warna lewat `useColors()` / `makeStyles()` dari `core/design/theme.tsx`, tidak pernah hex mentah. Satu keluarga ikon: MaterialCommunityIcons.
- Dua bahasa: teks sumber bahasa Indonesia di kode; terjemahan Inggris di `mobile/src/core/i18n/en.ts`. Teks dinamis pakai `t('… {0}', [nilai])`; label aksesibilitas pakai `tr()`. Setiap teks baru wajib diberi entri bahasa Inggris. Logika tidak boleh bergantung pada isi teks yang diterjemahkan.
- Teks antarmuka ditulis seperti orang berbicara: singkat, jelas, tanpa istilah teknis internal.
- Route di `mobile/src/app/` tetap tipis dan meneruskan layar dari `mobile/src/features/`.
- Folder native `mobile/android` dan `mobile/ios` dihasilkan (CNG); jangan diedit atau di-commit.
- Animasi hanya Reanimated/native (tanpa GSAP, Framer Motion, smooth-scroll DOM). Hormati "kurangi gerakan".

## Git

- Branch: `main`, `staging`, dan satu per aplikasi (`frontend` untuk tahap ini, `backend` nanti). Promosi `frontend` → `staging` → `main` lewat PR.
- Nama file, folder, route, branch, commit, dan PR dalam bahasa Inggris. Isi dokumentasi dalam bahasa Indonesia.
- Format commit: `(type) short description in English`, type huruf kecil (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `update`, `release`). Tidak ada baris co-author atau atribusi AI di commit, judul/deskripsi PR, maupun pesan merge.
- Jangan force-push, melewati proteksi branch, atau meng-commit rahasia, `.env`, artefak build, folder native, atau pengaturan agent lokal.
