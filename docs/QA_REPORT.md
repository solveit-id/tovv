# Laporan QA — Tovv mobile

Putaran terbaru di atas. Bukti mentah (screenshot) di `.impeccable/review/` (diabaikan Git).

## Putaran 3 — peran, peta, akun, dua bahasa, 2026-10-23

Pemicu: masukan pengguna setelah mencoba di HP — hanya tiga peran (owner, driver, pelanggan), belum ada peta real-time, belum ada splash/masuk/daftar/lupa kata sandi, belum dua bahasa, teks masih kaku, dan penamaan belum konsisten berbahasa Inggris.

### Yang berubah

- Peran admin tidak lagi dibuka aplikasi; tugasnya dikerjakan owner. Route tab berganti nama ke bahasa Inggris (`jobs`, `finance`, `more`, `orders`, `invoices`, `expenses`, `sync`, `auth/*`).
- Peta langsung per peran (react-native-maps), diperbarui tiap 3 detik dengan penanda truk yang bergerak halus.
- Splash beranimasi; masuk/daftar/lupa kata sandi (simulasi lokal, kata sandi demo `demo1234`); keluar.
- Dua bahasa (Indonesia/Inggris); 374 kalimat ditulis ulang supaya natural; kamus Inggris ±1.180 entri.
- Efek scroll-trigger pada kartu, kartu akun yang naik dengan kemiringan 3D.

### Pemeriksaan otomatis

| Pemeriksaan | Hasil |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 error, 0 warning) |
| `npm test` | PASS — 1.292 uji / 7 suite (termasuk login demo, peta per peran, dan placeholder setiap entri terjemahan) |
| `npx expo-doctor` | PASS — 21/21 |

### Perangkat

**Belum diuji di perangkat pada putaran ini.** Expo Go di emulator menolak memuat proyek ("Failed to download remote update"; kemungkinan karena Expo Go di emulator belum login akun Expo), dan development build di emulator dibuat sebelum react-native-maps ditambahkan (build Android dengan Google Maps juga butuh API key). Atas keputusan pengguna, uji dilakukan sendiri oleh pengguna lewat Expo Go di iPhone dan Android. Review desain independen (finish review) belum dijalankan karena tidak ada tangkapan layar putaran ini.

Hal yang perlu dicek pengguna di HP: peta muncul dan truk A06 bergerak (owner-A → Peta), Lacak pelanggan (akun penyetuju Dealer Demo), ganti bahasa di Lainnya → Bahasa, masuk/daftar/lupa kata sandi, dan tema gelap.

## Putaran 2 — redesign tampilan, 2026-10-22

Pemicu: uji pengguna lewat Expo Go di iPhone dan Android ("tidak modern, membingungkan"). Arah baru dipilih pengguna: standar super-app/fintech (patokan Gojek/GoPay, Grab/Tokopedia, Jago/Jenius), tema terang + gelap, gerak seimbang.

### Pemeriksaan otomatis

| Pemeriksaan | Hasil |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 error, 0 warning) |
| `npm test` | PASS — 85 uji / 6 suite (termasuk kontras AA kedua palet, 19 pasangan × 2) |
| `npx expo-doctor` | PASS — 21/21 |

### Perangkat

Android emulator API 36 (1080×2400), development build + Metro. Tema terang dan gelap; owner, admin, driver, pelanggan; beranda, daftar pekerjaan, detail pekerjaan, susun penawaran, invoice, keuangan, menu, keadaan error. Diperiksa: header parallax + bar ringkas saat digulir, kartu ringkasan menimpa header, FAB menyusut saat menggulir, pil tab, segmen, pemilih tema. iPhone dan Android fisik: dijalankan pengguna lewat Expo Go (tidak ada bukti tangkapan dari sesi ini). iOS development build: BLOCKED (tanpa macOS).

Temuan yang diperbaiki dalam putaran: latar gradien SVG tidak mengisi header di Android (diukur eksplisit), bar ringkas samar terlihat pada header pendek, bayangan kartu bersudut persegi di Android (diganti `boxShadow`), kosong ganda di beranda driver, label teknis (F-09, ledger, SaaS, Bruto/Net, custody) diganti bahasa sehari-hari, langkah pasif tidak lagi tampil sebagai tombol.

Review akhir desain (reviewer independen, tanpa riwayat sesi): putaran pertama `fix` dengan 8 perbaikan material (aksi utama/FAB, bayangan kartu, kicker di atas judul, teks ambigu, layout Keuangan, keadaan error, animasi angka di UI thread, verifikasi seed). Putaran perbaikan memunculkan 3 regresi (FAB tidak menyempit, satuan ganda, bar tahap); semuanya diperbaiki. Verdict akhir: **ship** untuk 8 perbaikan dan 3 regresi tersebut (bukan review ulang seluruh aplikasi). Bukti: 16 tangkapan di `.impeccable/review/final/` (Android, terang + gelap).

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

### Review akhir desain (Impeccable finish reviewer)

Disposisi awal: *fix* — delapan perbaikan material, semuanya diterapkan lalu diperiksa ulang di emulator (ponsel normal, ponsel kecil + font 1,3):

1. Beranda owner: tiga tindakan pertama → buku operasi (uang) → pekerjaan berjalan; "Catat permintaan" di footer, terjangkau ibu jari ("Hitung harga" tetap di tab Lainnya).
2. Tombol henti perjalanan driver sudah di luar baris ibu jari (di akhir konten, membuka formulir wajib); label tanpa istilah Inggris.
3. Pita DEMO: target sentuh 48 dp; peran tidak lagi terpotong pada layar sempit/font besar.
4. Salinan berbahasa Inggris (custody, receipt, reversal, unapplied, provisional, as of, abort) diganti bahasa Indonesia.
5. Label keparahan dipindah dari atas judul ke baris PIC/tenggat (tetap teks + ikon).
6. Nominal tidak lagi diulang di judul tindakan tagihan.
7. Grup pilihan jadwal/filter akun memakai SectionTitle, bukan label huruf kapital.
8. Serial dokumen tidak lagi tampil ganda di header invoice/penawaran/bukti.

Lembar rangkap (DocumentStack) diperiksa pada invoice A10 dengan nota kredit: tepi lembar terlihat, riwayat dapat dibuka.

### Gate yang tidak diklaim

Tahap ini **tidak** meluluskan gate prototype penuh PRD (backend, otorisasi server, transaksi atomik, perangkat nyata untuk semua peran, performa rilis). Hasil di atas hanya bukti frontend dengan adapter demo.
