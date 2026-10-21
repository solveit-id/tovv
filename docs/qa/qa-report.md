# Laporan QA — Tovv mobile

Putaran terbaru di atas. Bukti mentah (screenshot) di `.impeccable/review/` (diabaikan Git).

## Putaran 1 — tahap frontend, 2026-10-21

Commit dasar: branch `frontend`. Mode: adapter demo lokal (`frontend_demo`), dataset `tovv-2.1-f09`, jam bisnis C0.

### Pemeriksaan otomatis

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npm run typecheck` | PASS |
| Lint | `npm run lint` | PASS (0 error, 0 warning) |
| Unit & integrasi adapter | `npm test` | PASS — 59 uji / 6 suite |
| Konfigurasi Expo | `npx expo-doctor` | lihat bagian perangkat (diperbarui setelah patch) |
| Konfigurasi publik | `npx expo config --type public` | lihat bagian perangkat |

Cakupan uji: oracle F-09 PRD §8.3 (24/14/19, invoice net 10,7 jt, receipt 6,5 jt, refund 0,2 jt, alokasi 6,1 jt, piutang 4,6 jt, unapplied 0,2 jt, kontribusi final 3,03 jt pada 7/9, varians, M-12); F-01/F-02; koreksi A10; alur D-01 (U1 ditolak, idempotensi, delegasi ≤ Rp 100.000, eskalasi admin-A2, versi superseded, bentrok kapasitas), B2B (requester ditolak, PO wajib), isolasi tenant/organisasi/driver, owner mode driver tanpa izin owner, revoke delegasi, perjalanan offline → antrean → sinkron, tracking tersembunyi sebelum berangkat, replay stale > 90 detik, invoice → bukti pending → verifikasi sebagian → lebih bayar unapplied, referensi mirip dan self-approval, dependency guard reversal, dashboard berubah dari transaksi yang sama, daftar tindakan dari sumber, CSV escape formula, kontras token, ikon satu keluarga, label aksesibilitas status.

Semua uji di atas berjalan di Jest (Node) terhadap adapter demo — **bukan** bukti backend, MySQL, atau perangkat.

### Perangkat

Diisi setelah build terpasang.
