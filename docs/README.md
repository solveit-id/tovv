# Dokumentasi Tovv

Dokumen dikelompokkan per kebutuhan pembaca. Nama file memakai huruf kapital dengan garis bawah, sama seperti paket spesifikasi; isi dokumen berbahasa Indonesia.

```text
docs/
  README.md                  peta dokumentasi (file ini)
  spec/                      paket spesifikasi 2.1 — sumber kebenaran scope dan aturan bisnis
  product/                   fakta produk untuk keputusan desain dan cakupan layar
  design/                    sistem desain yang terkirim
  engineering/               cara menjalankan, versi, struktur kode
  qa/                        hasil pemeriksaan per putaran
```

| Kelompok | Dokumen | Isi |
|---|---|---|
| Spesifikasi | [`spec/PRD.md`](spec/PRD.md), [`ARCHITECTURE`](spec/ARCHITECTURE.md), [`INTEGRATION_PLAN`](spec/INTEGRATION_PLAN.md), [`IMPLEMENTATION_PLAN`](spec/IMPLEMENTATION_PLAN.md), [`TEST_PLAN`](spec/TEST_PLAN.md), [`VALIDATION_PLAN`](spec/VALIDATION_PLAN.md) | Urutan baca resmi. Status dan progres implementasi terbaru ada di IMPLEMENTATION_PLAN §0 |
| Produk | [`product/PRODUCT.md`](product/PRODUCT.md) | Pengguna, batasan, komitmen merek, paket layanan |
| Produk | [`product/SCREEN_INVENTORY.md`](product/SCREEN_INVENTORY.md) | Daftar layar per peran vs requirement: tersedia / disimulasikan / belum |
| Desain | [`design/DESIGN.md`](design/DESIGN.md) | Token terang/gelap + mode driver, font Plus Jakarta Sans, komponen, gerak, aset towing |
| Pengembangan | [`engineering/DEVELOPMENT.md`](engineering/DEVELOPMENT.md) | Versi, cara menjalankan di HP/emulator, mode demo, dua bahasa, peta, performa, struktur kode |
| QA | [`qa/QA_REPORT.md`](qa/QA_REPORT.md) | Hasil pemeriksaan per putaran: otomatis, perangkat, review desain, blocker |

Dokumen di luar `spec/` hanya melengkapi tahap implementasi dan tidak menyalin PRD. Status kerja dan serah terima antar-sesi ada di [`../.ai/project-status.md`](../.ai/project-status.md).

Nama produk tampil adalah **Tovv** (T kapital; riwayat nama di PRD §10). Solveit Indonesia tampil sebagai pemilik/pengembang di halaman Tentang.
