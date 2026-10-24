# Laporan QA — Tovv mobile

Putaran terbaru di atas. Bukti mentah (screenshot) di `.impeccable/review/` (diabaikan Git).

## Putaran 5 — tampilan premium, mode driver, peta, lokasi ala ojek online, 2026-10-23

Pemicu: masukan pengguna setelah mencoba di iPhone dan Android lewat Expo Go — tampilan masih bisa lebih modern dan premium, peta kurang hidup, belum ada loader yang bagus, isian lokasi jemput/tujuan kurang fleksibel (patokan: Gojek/Grab/ShopeeFood), formulir "Pesan derek" membingungkan, mode owner dan mode driver belum terlihat beda, belum ada aset unit derek, animasi berlebihan dan kurang halus, bahasa masih kaku, dan kadang tersendat.

Keputusan pengguna (ditanyakan di awal putaran): mode driver = gelap + aksen kuning; pencarian alamat = layanan peta bawaan HP; formulir = bertahap 4 langkah.

### Yang berubah

- **Tampilan:** bayangan kartu berlapis, kolom isian dengan cincin fokus, kartu pilihan berikon, chip pilihan cepat, tab dengan warna mode, header dengan label mode.
- **Mode owner vs driver:** palet mode driver (header biru-arang, cahaya kuning, marka jalan samar; tombol dan pil kuning); kartu "Masuk mode driver" di beranda owner yang sudah memakai warna mode driver; transisi singkat saat berganti mode.
- **Peta:** posisi diperbarui tiap 2 detik hanya saat layar peta terbuka; truk tampak atas yang menghadap arah jalan dan meluncur terus-menerus (Android: animasi native peta); rute bertepi dengan ruas yang sudah ditempuh; label Jemput/Tujuan; tombol Lihat semua, Lokasi saya, Ikuti truk, satelit; kartu pekerjaan dengan perkiraan tiba, jam tiba, progres, dan sisa jarak garis lurus; peta mini di layar Perjalanan (menggantikan skema rute).
- **Loader:** kerangka berbentuk isi (kartu pekerjaan, tindakan, ringkasan, detail) dengan kilau lembut; loader unit derek saat menyiapkan peta; splash baru dengan unit derek yang meluncur masuk.
- **Lokasi:** pemilih lokasi layar penuh — cari alamat (layanan peta bawaan HP), lokasi saya, pilih di peta dengan pin tengah, terakhir dipakai, tempat tersimpan, patokan untuk sopir, tukar jemput/tujuan, dan alamat ketikan tanpa titik peta.
- **Formulir "Pesan derek":** 4 langkah (owner 5, mulai dari pelanggan) dengan garis langkah, satu pertanyaan per langkah, pilihan cepat jenis kendaraan/kondisi/waktu, detail tambahan yang disembunyikan, dan ringkasan yang bisa diubah per bagian.
- **Aset:** ilustrasi unit derek vektor (tampak samping, bermuatan/kosong, tampak atas) di splash, loader, keadaan kosong, beranda pelanggan, kartu mode driver, dan penanda peta.
- **Gerak:** tanpa pantulan, tanpa kemiringan 3D, tanpa scroll-trigger per kartu; durasi lebih pendek; transisi halaman dorong dari kanan dengan parallax di kedua OS.
- **Bahasa:** kalimat baru dan yang diubah ditulis seperti percakapan; ±170 entri bahasa Inggris baru; uji baru memastikan setiap teks `t()` di layar punya terjemahan.
- **Performa:** tab yang tidak terlihat dibekukan, peta berhenti memuat saat tidak dibuka, penanda/kartu/rute di-memo, cache query 60 detik, efek per-kartu yang dihitung saat menggulir dihapus.

### Pemeriksaan otomatis

| Pemeriksaan | Hasil |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 error, 0 warning) |
| `npm test` | PASS — 1.490 uji / 8 suite (baru: buku tempat + patokan, jarak/arah, kontras palet mode driver, kelengkapan terjemahan) |
| `npx expo-doctor` | PASS — 20/20 |
| `npx expo export --platform android --platform ios` | PASS — bundel Hermes iOS dan Android terbentuk |

### Review desain

Review akhir Impeccable dijalankan dari kode (tanpa tangkapan layar), hasil **recapture**: belum bisa memberi putusan visual sampai ada tangkapan layar dari HP. Lima belas cacat kode yang ditemukan sudah diperbaiki di putaran ini: bingkai awal peta (padding ganda), izin lokasi Android sebelum pencarian alamat, pita DEMO di dalam pemilih lokasi, Modal jemput→tujuan yang bisa gagal tampil di iOS (kini satu Modal), keyboard menutupi kolom patokan di Android, peta tetap memuat saat tab dibekukan (kini lewat listener fokus), panggilan layanan alamat yang terlalu banyak (cache + berurutan + jeda 700 ms), nama langkah terpotong di teks besar, kolom berat/ukuran tidak sejajar, transisi halaman yang mengabaikan "kurangi gerakan", garis rute yang mendahului truk, transisi ganti mode yang menutupi pita DEMO dan tidak diumumkan di iOS, teks koordinat mentah, splash yang meneruskan ketukan, dan hex mentah di latar header. Tangkapan yang diminta reviewer: beranda owner/driver, transisi mode, pemilih lokasi (cari + pin dengan keyboard), langkah 1 dan Periksa pada teks 1,3x, peta owner, serta versi tema gelap untuk pemilih dan peta.

### Perangkat

**Belum diuji di perangkat pada putaran ini dan belum ada tangkapan layar.** Pengguna menguji sendiri lewat Expo Go SDK 58 di iPhone dan Android. Yang perlu dicek:

1. Owner → kartu "Masuk mode driver": transisi muncul, header berubah biru-arang + kuning; "Kembali ke mode owner" mengembalikan warna biru.
2. Owner → Peta: truk U2 (A06) menghadap selatan dan bergerak terus; "Ikuti truk", "Lihat semua", satelit; pindah tab lalu kembali tidak tersendat.
3. Pelanggan → "Jemput di mana?": cari alamat (perlu sinyal), "Lokasi saya" (minta izin lokasi), "Pilih di peta" (pin terangkat saat peta digeser), isi patokan, lalu tujuan → kendaraan → waktu → Periksa → Kirim.
4. Tema gelap, bahasa Inggris, dan ukuran teks besar pada formulir dan peta.
5. Rasa animasi: splash, pindah halaman, tab, kerangka muat.

Risiko yang diketahui: hasil pencarian alamat bergantung layanan peta HP (bisa kosong tanpa sinyal atau di sebagian HP Android); di build rilis Android, Google Maps tetap butuh API key (DEC-08).

## Putaran 4 — naik ke Expo SDK 58, 2026-10-23

Pemicu: Expo Go di iPhone dan Android pengguna diperbarui ke versi SDK 58 dan menolak membuka proyek SDK 57 ("Project is incompatible with this version of Expo Go"). Di iPhone, Expo Go versi lama tidak bisa dipasang, jadi proyek dinaikkan ke SDK 58 (React Native 0.88, React 19.3, Reanimated 4.7.1, react-native-maps 1.29.11).

Penyesuaian kode: tipe ref ke `ViewInstance`/`ScrollViewInstance`/`TextInputInstance`, tipe `makeStyles` tanpa `StyleSheet.NamedStyles`, `await File.write()`, alias bertipe untuk `MarkerAnimated`, dan solusi sementara mock Reanimated di Jest. Opsi Expo Router yang dihapus di SDK 58 (`initialRouteName`, `initialParams`, `freezeOnBlur`, objek navigasi bersarang) tidak dipakai.

| Pemeriksaan | Hasil |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 error, 0 warning) |
| `npm test` | PASS — 1.292 uji / 7 suite |
| `npx expo-doctor` | PASS — 20/20 |
| `npx expo export --platform ios --platform android` | PASS — bundel Hermes iOS dan Android terbentuk |

Perangkat: pengguna melaporkan aplikasi sudah berjalan di iPhone dan Android lewat Expo Go SDK 58 (23 Okt 2026; laporan pengguna, tanpa tangkapan layar di repository). Review desain independen belum dijalankan.

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
