# Laporan QA — Tovv mobile

Putaran terbaru di atas. Bukti mentah (screenshot) di `.impeccable/review/` (diabaikan Git).

## Putaran 1 — tahap frontend, 2026-10-21

Commit dasar: branch `frontend`. Mode: adapter demo lokal (`frontend_demo`), dataset `tovv-2.1-f09`, jam bisnis C0.

### Pemeriksaan otomatis

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Typecheck | `npm run typecheck` | PASS |
| Lint | `npm run lint` | PASS (0 error, 0 warning) |
| Unit & integrasi adapter | `npm test` | PASS — 62 uji / 6 suite |
| Konfigurasi Expo | `npx expo-doctor` | PASS — 21/21 (setelah `expo install --fix`, modul native tak terpakai dihapus) |
| Konfigurasi publik | `npx expo config --type public` | PASS — nama Tovv, scheme `tovv-demo`, package/bundle `id.solveit.tovv`, SDK 57 |
| Audit dependensi | `npm audit --omit=dev` | 17 temuan (3 moderate, 14 high) transitif di toolchain Expo (`node-forge` via code-signing, `decode-uri-component` via `query-string`/expo-router). Perbaikan hanya lewat `--force` yang menurunkan ke Expo 44 — tidak diterapkan; pantau rilis patch Expo. |

Cakupan uji: oracle F-09 PRD §8.3 (24/14/19, invoice net 10,7 jt, receipt 6,5 jt, refund 0,2 jt, alokasi 6,1 jt, piutang 4,6 jt, unapplied 0,2 jt, kontribusi final 3,03 jt pada 7/9, varians, M-12); F-01/F-02; koreksi A10; alur D-01 (U1 ditolak, idempotensi, delegasi ≤ Rp 100.000, eskalasi admin-A2, versi superseded, bentrok kapasitas), B2B (requester ditolak, PO wajib), isolasi tenant/organisasi/driver, owner mode driver tanpa izin owner, revoke delegasi, perjalanan offline → antrean → sinkron, tracking tersembunyi sebelum berangkat, replay stale > 90 detik, invoice → bukti pending → verifikasi sebagian → lebih bayar unapplied, referensi mirip dan self-approval, dependency guard reversal, dashboard berubah dari transaksi yang sama, daftar tindakan dari sumber, CSV escape formula, kontras token, ikon satu keluarga, label aksesibilitas status.

Semua uji di atas berjalan di Jest (Node) terhadap adapter demo — **bukan** bukti backend, MySQL, atau perangkat.

### Perangkat

| Target | Status | Catatan |
|---|---|---|
| Emulator Android (sdk_gphone64_x86_64, Android 16 / API 36, 1080×2400 @420dpi) | PASS — development build (`expo run:android`, x86_64) + Metro | Semua alur di bawah diperiksa dengan screenshot nyata |
| Android ukuran kecil (720×1280 @320dpi ≈ 360×640 dp) | PASS | Beranda driver, detail tugas; footer aksi tetap terlihat |
| Tablet (1600×2560 @320dpi ≈ 800 dp) | PASS setelah perbaikan | Lebar baca dibatasi 720 dp; header tetap penuh |
| Skala font 1,3 | PASS | Tracking pelanggan, daftar tindakan (nominal pindah ke bawah judul) |
| Android fisik via USB | BELUM — tidak ada perangkat terhubung saat sesi | `adb devices` hanya menampilkan emulator |
| iPhone (Expo Go SDK 57) | BELUM — butuh pengguna memindai QR | `npm run start:go -- --tunnel`; fitur native di luar Expo Go (overlay kamera `captureRef`) mungkin terbatas |
| iOS development build | BLOCKED | Tidak ada macOS/Xcode |

Keterbatasan emulator: kamera virtual menghasilkan frame hitam (HAL emulator), sehingga isi foto tidak bisa dinilai; alur izin, capture, salin ke penyimpanan permanen, overlay turunan, dan outbox tetap terbukti.

### Alur lintas peran yang diperiksa di perangkat

1. Owner beranda → daftar tindakan dari sumber, pekerjaan berjalan, angka dari transaksi yang sama.
2. Driver A06 → status perjalanan, kamera (izin ditolak → layar pemulihan; diizinkan → capture → preview overlay → simpan; original 19.204 B = file cache, overlay 44.679 B) → outbox bertahan setelah force-stop → sinkron → serah-terima tercatat.
3. Pelanggan → tracking (ETA, kesegaran posisi, skema rute; bukan peta).
4. Finance → terbitkan invoice A05 (INV/A/2026/0006) → permintaan pembayaran + QR internal (berlabel BUKAN QRIS) → pelanggan kirim bukti (sisa tidak berubah) → finance verifikasi → cap DIPERIKSA, sisa Rp 0, permintaan Terpenuhi → pelanggan melihat cap DITERIMA (DEMO).
5. Admin → R-A14 perlu ditinjau → lengkapi data → susun penawaran (U1 ditolak dek < panjang, U3 out of service; tanpa unit → galat; diskon Rp 190.000 > delegasi Rp 100.000 → ditolak, eskalasi owner; Rp 1.300.000 dalam delegasi → terkirim) → pelanggan melihat penawaran tanpa blok internal → setuju → O-A14 Terkonfirmasi.
6. Laporan owner berubah mengikuti transaksi sesi (konversi 10/13 → 11/14).
7. Mode demo: Offline → badge Offline; terbitkan invoice ditolak dengan pesan "hanya saat online"; Offline dimatikan kembali.

### Temuan yang diperbaiki dalam putaran ini

- Driver melihat harga/biaya tambahan → DTO driver disaring (+ uji).
- Header akar memakan ±23% layar → header ikut tergulir.
- Toast menutupi tombol utama → dipindah ke atas.
- Finance ditawari "Tutup order"/penugasan → aksi disaring per scope (+ uji).
- Scrim bottom sheet hilang di bawah keyboard → backdrop dipindah ke luar `KeyboardAvoidingView`.
- Galat "Pilih unit" dan "melebihi delegasi" tetap tampil setelah input diperbaiki → dibersihkan saat input berubah.
- Pesan "versi sebelumnya diganti" muncul pada v1 / permintaan pertama → kondisional.
- Tombol kembali perangkat menutup aplikasi setelah tautan demo → beranda peran ditumpuk di bawah tujuan.
- Driver membaca "Menunggu <namanya sendiri> menerima tugas" → "Terima atau tolak tawaran tugas" (+ uji).
- Order lunas tetap "Menunggu penerimaan pembayaran" → "Tagihan tercatat lunas (demo)".
- Penawaran kedaluwarsa pada permintaan berstatus Ditawarkan kurang jelas → baris diberi "perlu penawaran ulang".

### Gate yang tidak diklaim

Tahap ini **tidak** meluluskan gate prototype penuh PRD (backend, otorisasi server, transaksi atomik, perangkat nyata untuk semua peran, performa rilis). Hasil di atas hanya bukti frontend dengan adapter demo.
