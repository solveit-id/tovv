# Tovv

Aplikasi Android dan iOS untuk perusahaan towing/pengangkutan kendaraan: permintaan lintas kanal, harga yang dapat dijelaskan, unit yang layak, perjalanan dengan bukti foto, dan pembayaran manual yang diperiksa petugas. Satu aplikasi multi-tenant dengan empat kelompok tampilan: Owner, Admin, Operator/driver, dan Pelanggan.

Dimiliki, dikembangkan, dan diterbitkan oleh **Solveit Indonesia**.

> **Status: prototype tahap frontend.** Semua data sintetis dan berlabel *DEMO — SIMULASI FRONTEND*. Backend Laravel, otorisasi server, transaksi atomik, realtime, dan integrasi nyata belum dibangun. Tidak ada uang nyata, gateway, atau QRIS live.

## Isi repository

| Path | Isi |
|---|---|
| `docs/spec/` | Paket spesifikasi 2.1: PRD … VALIDATION_PLAN (sumber kebenaran scope dan aturan bisnis) |
| `mobile/` | Aplikasi React Native + TypeScript (Expo SDK 57, Expo Router) |
| `docs/` | Peta dokumentasi: [`docs/README.md`](docs/README.md) |
| `.ai/` | Status proyek dan serah terima antar-sesi |

## Mulai cepat

Prasyarat: Node 22 (lihat `.nvmrc`), npm. Untuk development build Android: JDK 17+ (JBR Android Studio cukup), Android SDK, NDK 27.1.

```bash
cd mobile
npm ci
npm test            # uji domain, oracle F-09, alur adapter demo
npm run android     # build + pasang development build ke emulator/perangkat Android
npm start           # server Metro untuk development build
```

Tanpa Mac, iPhone dapat menjalankan proyek lewat Expo Go SDK 57: `npm run start:go`, lalu pindai QR dengan kamera iPhone. Rincian: [`docs/development.md`](docs/development.md).

## Mode demo

Buka aplikasi → **Pilih akun demo** → pilih akun fixture (tenant A/B, owner/admin/driver/pelanggan). Pemilih akun hanya ada pada mode demo lokal, bukan login produksi. **Lainnya → Mode demo & tentang** menyediakan simulasi offline, gagal baca, penyimpanan penuh, jeda replay lokasi, paket kedaluwarsa, dan reset data ke F-09.

## Alur Git

`frontend` → PR ke `staging` → PR ke `main`. Format commit `(jenis) deskripsi` dalam Bahasa Indonesia. Aturan agent: [`AGENTS.md`](AGENTS.md).
