# Dokumentasi Tovv

Paket spesifikasi 2.1 berada di root repository dan tetap menjadi sumber kebenaran: [PRD](../PRD.md), [ARCHITECTURE](../ARCHITECTURE.md), [INTEGRATION_PLAN](../INTEGRATION_PLAN.md), [IMPLEMENTATION_PLAN](../IMPLEMENTATION_PLAN.md), [TEST_PLAN](../TEST_PLAN.md), [VALIDATION_PLAN](../VALIDATION_PLAN.md). Dokumen di folder ini hanya melengkapi tahap implementasi dan tidak menyalin PRD.

| Dokumen | Isi |
|---|---|
| [`PRODUCT.md`](PRODUCT.md) | Ringkasan produk untuk keputusan desain (merujuk PRD) |
| [`design/visual-direction.md`](design/visual-direction.md) | Arah visual "Nota Rangkap", token, komponen, motion, referensi |
| [`DESIGN.md`](DESIGN.md) | Sistem desain yang terkirim (token, tipografi, komponen, aturan) — diturunkan dari kode |
| [`product/screen-inventory.md`](product/screen-inventory.md) | Inventaris layar vs requirement PROTO: tersedia / disimulasikan / belum |
| [`development/mobile-development.md`](development/mobile-development.md) | Versi, cara menjalankan Android/iOS, mode demo, struktur kode |
| [`qa/qa-report.md`](qa/qa-report.md) | Hasil pemeriksaan per putaran (perangkat, mode, bukti, blocker) |
| [`project-structure.md`](project-structure.md) | Aturan struktur repository Solveit (disalin dari standar) |

## Catatan penamaan

Nama produk tampil adalah **Tovv**; riwayat nama sebelumnya (Solveit Tow / Solveit Trow) tercatat di PRD §10. Paket dokumen 2.1 sudah konsisten memakai Tovv sejak diterima, sehingga tahap frontend tidak mengubah requirement ID, aturan bisnis, atau scope. Solveit Indonesia tampil sebagai pemilik/pengembang (halaman Tentang), bukan judul layar.

## Penyesuaian terhadap `project-structure.md`

`project-structure.md` ditulis untuk repository website (frontend React + Vite, admin, backend Laravel). Untuk Tovv diadaptasi sebagai berikut:

- Aplikasi mobile berada di `mobile/` sesuai ARCHITECTURE §2, bukan `frontend/`. Route Expo Router di `mobile/src/app/` (konvensi Expo SDK 57), fitur di `mobile/src/features/`, utilitas inti di `mobile/src/core/`, adapter data di `mobile/src/data/`.
- Aset merek berada sekali di `mobile/assets/brand/` (tidak ada `frontend/public/brand/`).
- `backend/`, `contracts/`, `tools/admin-harness/`, `infra/`, dan `.github/workflows/` belum dibuat karena belum ada isinya; folder kosong tidak dibuat.
- Format commit mengikuti instruksi pengguna terbaru: `(jenis) deskripsi` dalam Bahasa Indonesia (dokumen struktur menyebut bahasa Inggris).
- Bukti mentah (screenshot) disimpan di `.impeccable/review/` yang diabaikan Git dan dirangkum di `qa/qa-report.md`.
