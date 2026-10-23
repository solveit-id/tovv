# Tovv

Aplikasi Android dan iOS untuk usaha derek/pengangkutan kendaraan: permintaan lewat telepon atau aplikasi, harga yang bisa dijelaskan, unit yang cocok, perjalanan yang bisa dipantau di peta dengan bukti foto, dan pembayaran manual yang dicek petugas. Satu aplikasi multi-tenant; saat ini membuka tiga peran: **owner**, **driver**, dan **pelanggan**. Tersedia dalam bahasa Indonesia dan Inggris, tema terang dan gelap.

Dimiliki, dikembangkan, dan diterbitkan oleh **Solveit Indonesia**.

> **Status: prototype tahap frontend.** Semua data sintetis dan berlabel *DEMO — SIMULASI FRONTEND*. Login, posisi truk di peta, dan pembayaran masih simulasi; pencarian alamat memakai layanan peta bawaan HP dan alamatnya hanya tersimpan di HP. Backend Laravel, otorisasi server, transaksi atomik, realtime, dan integrasi nyata belum dibangun. Tidak ada uang nyata, gateway, atau QRIS live.

## Isi repository

| Path | Isi |
|---|---|
| `mobile/` | Aplikasi React Native + TypeScript (Expo SDK 58, Expo Router) |
| `docs/` | Dokumentasi; peta isinya di [`docs/README.md`](docs/README.md) |
| `docs/spec/` | Paket spesifikasi 2.1 (sumber kebenaran scope dan aturan bisnis) |
| `.ai/` | Status proyek dan serah terima antar-sesi |

## Mulai cepat

Prasyarat: Node 22 (lihat `.nvmrc`), npm.

```bash
cd mobile
npm ci
npm test              # uji domain, oracle F-09, alur adapter demo, terjemahan
npm run start:go      # buka di HP lewat Expo Go (iPhone dan Android)
```

Masuk dengan akun demo (ketuk Owner/Driver/Pelanggan di halaman Masuk; kata sandi `demo1234`). Owner bisa berpindah ke mode driver dari kartu "Masuk mode driver" di beranda; pelanggan memesan lewat "Jemput di mana?". Rincian, termasuk development build Android: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Alur Git

`frontend` → PR ke `staging` → PR ke `main`. Nama file, folder, commit, dan PR dalam bahasa Inggris dengan format commit `(type) short description`, tanpa baris co-author. Aturan agent: [`AGENTS.md`](AGENTS.md).
