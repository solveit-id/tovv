# Product

<!-- impeccable:product-schema 1 -->

Ringkasan kerja untuk desain. Sumber kebenaran scope, requirement, aturan bisnis dan fixture tetap [`spec/PRD.md`](../spec/PRD.md); bila berbeda, PRD yang berlaku.

## Platform

adaptive

Satu bahasa desain Tovv untuk Android dan iOS (keputusan pengguna 2026-10-21). Komponen dan tampilan sama di kedua OS; jaminan OS tetap dihormati: tombol/gesture Back Android, swipe-back iOS, safe area, keyboard, pengurangan gerakan, ukuran teks sistem.

## Stack

Ditetapkan dokumen paket 2.1 (`ARCHITECTURE.md` ADR-002): React Native + TypeScript strict, Expo development builds + Expo Router, TanStack Query, SQLite/SecureStore. Exact version tahap frontend: Expo SDK 58 (React Native 0.88, React 19.3), Node 22. Backend Laravel/MySQL/Redis/Reverb adalah target integrasi berikutnya.

## Users

PRD mendefinisikan empat kelompok tampilan. Atas keputusan pengguna (22 Oktober 2026), aplikasi saat ini hanya membuka **tiga peran**: owner, driver, dan pelanggan. Pekerjaan admin (dispatcher dan finance) dikerjakan owner; peran admin tetap ada di model data dan uji kebijakan untuk tahap backend.

- **Owner** perusahaan towing kecil–menengah; sering merangkap driver. Membuka aplikasi di sela pekerjaan, sering di luar ruangan, untuk mencatat permintaan, memberi harga, menugaskan sopir, mengecek pembayaran, dan melihat apa yang tertahan hari ini.
- **Operator/driver**: menjalankan tugas di lapangan, mencatat tahap perjalanan, foto bukti, kendala dan biaya, hanya saat kendaraan berhenti.
- **User/customer**: pribadi atau organisasi B2B (requester, approver, finance, penerima). Membuat permintaan, menyetujui penawaran, memantau progres, menerima invoice dan mengajukan bukti bayar.

## Product Purpose

Satu referensi pekerjaan towing dari permintaan sampai penerimaan pembayaran: harga yang dapat dijelaskan, unit yang layak, perjalanan dengan bukti, dan saldo yang dapat ditelusuri. Tahap saat ini adalah prototype untuk presentasi, demonstrasi alur dan uji kegunaan; semua data sintetis dan berlabel DEMO.

## Positioning

Tovv mengelola operasi satu operator (unit sendiri dan mitra kelolaan), bukan marketplace atau jaringan bantuan nasional. Kekhasannya: kontribusi per pekerjaan dengan biaya yang tidak lengkap ditandai provisional, kelayakan unit sebelum ranking, bukti foto dengan sumber waktu/lokasi yang jujur, dan pembayaran manual yang tidak pernah dianggap lunas sebelum diperiksa petugas.

## Operating Context

- Kanal masuk: telepon/chat dicatat owner (dibantu petugas), aplikasi pelanggan, dan pelanggan B2B berulang.
- Lapangan: cahaya matahari terik, satu tangan, sinyal putus-putus, ponsel Android menengah; input hanya saat berhenti.
- Dokumen: quote berversi, invoice bernomor, permintaan pembayaran internal, bukti transfer/tunai, receipt demo, PDF/CSV.
- Zona waktu bisnis default Asia/Jakarta; uang integer rupiah.

## Paket layanan

Keputusan pengguna 25 Okt 2026: operator towing menawarkan paket layanan, dan aplikasi menampilkannya.

| Paket | Isi | Ciri |
|---|---|---|
| Car Towing | Satu mobil diangkut truk towing sedang (flatbed) | Paling cepat, menjangkau jalan kecil/pelosok |
| Car Carrier | Truk panjang mengangkut lebih dari 5 mobil sekaligus | Paling hemat per mobil, waktu tempuh lebih lama |
| Storing Motor | Truk khusus motor/moge dengan rel atau tangga | Untuk moge dan motor mogok |
| Self Drive | Kendaraan dikemudikan sopir berpengalaman lewat darat | Terjangkau dan cepat, hanya untuk mobil layak jalan |

Harga "mulai dari" di aplikasi adalah contoh sintetis berlabel DEMO; harga pasti tetap lewat penawaran operator. Nama perusahaan nyata yang dipakai sebagai contoh paket tidak menjadi data seed.

## Capabilities and Constraints

- Status kanonik mengikuti PRD §5 (request, quote, execution, assignment, invoice, payment proof, outbox, dll.). Jangan membuat status tunggal "paid".
- Tidak ada uang nyata, gateway, QRIS live, rekening numerik nyata; instruksi hanya DEMO-NONPAYABLE-A/B. QR internal `tovv-demo://` bukan QRIS.
- Lokasi: last updated, akurasi dan sumber selalu terlihat; >90 detik = stale; tidak ada koordinat karangan. Peta langsung memakai peta bawaan HP (react-native-maps); posisi truk di demo berasal dari replay sintetis F-06 dan diberi label simulasi.
- Pemilihan lokasi jemput/tujuan (keputusan pengguna 23 Okt 2026): pencarian alamat lewat layanan peta bawaan HP (Apple/Android, tanpa API key), lokasi HP, pin yang digeser pengguna, tempat tersimpan dan terakhir dipakai, plus patokan untuk sopir. Alamat ketikan tanpa titik peta tetap diterima dan dipastikan operator. Alamat asli hanya tersimpan lokal di HP pada mode demo.
- Foto: capture_origin kamera vs galeri, original vs overlay, pending upload tidak boleh tampil "terkirim".
- Kontribusi bukan laba bersih; biaya hilang adalah null, bukan nol.
- Tahap frontend ini memakai adapter demo deterministik; backend/otorisasi server/transaksi atomik belum ada dan tidak boleh diklaim.

## Brand Commitments

- Nama produk tampil: **Tovv**. Pemilik, pengembang dan penerbit: **Solveit Indonesia** (identitas pendukung, misalnya halaman Tentang).
- Belum ada logo Tovv; wordmark sementara dibuat dan ditandai SEMENTARA sampai logo resmi tersedia.
- Logo Solveit (`mobile/assets/brand/`) memakai biru #1136D6–#19B8F2 dan navy #082A56; palet Tovv diturunkan dari sini.
- Nama produk selalu ditulis **Tovv** (T kapital). Di antarmuka, layanan disebut "towing", bukan "derek" (keputusan pengguna 25 Okt 2026). Font antarmuka: Plus Jakarta Sans.
- Antarmuka dua bahasa: Indonesia (sumber) dan Inggris, mengikuti bahasa HP dan bisa diganti di Lainnya → Bahasa. Teks ditulis seperti orang berbicara, bukan istilah teknis. Label "DEMO — SIMULASI FRONTEND" wajib terlihat.
- Masuk, daftar, dan lupa kata sandi pada tahap ini adalah simulasi lokal berlabel demo, bukan autentikasi produksi (TEN-04).
- Gaya visual: standar super-app/fintech Indonesia yang akrab bagi pengguna, dengan patokan kualitas Gojek/GoPay, Grab/Tokopedia dan Bank Jago/Jenius (keputusan pengguna 2026-10-22, menggantikan arah "Nota Rangkap"). Tema terang dan gelap mengikuti pengaturan sistem.
- Mode owner dan mode driver dibedakan jelas: mode driver memakai header biru-arang dengan aksen kuning jalan (keputusan pengguna 2026-10-23). Unit derek tampil sebagai ilustrasi vektor milik Tovv sendiri.

## Evidence on Hand

- Paket dokumen 2.1 di `docs/spec/`; fixture F-01–F-13 dan oracle F-09 (PRD §8).
- Tidak ada operator nyata, testimoni, harga jual atau metrik penggunaan. Nama perusahaan nyata (mis. Surabaya Towing) tidak boleh menjadi data seed.

## Product Principles

1. Jujur tentang status: pending, stale, provisional, simulasi dan DEMO selalu terlihat dan tidak bergantung warna saja.
2. Tindakan berikutnya lebih penting dari angka: setiap layar menjawab "apa yang harus saya lakukan sekarang".
3. Angka keuangan dapat ditelusuri ke baris sumber; tidak ada dashboard yang terpisah dari transaksi.
4. Lapangan dulu: terbaca di bawah matahari, target sentuh besar, satu tangan, tahan sinyal buruk.
5. Peran menentukan isi: driver dan customer tidak pernah melihat margin atau biaya internal.

## Accessibility & Inclusion

NFR-11: target sentuh utama ≥44 pt (Android 48 dp), font scaling 1,3x tidak memotong aksi utama, status memakai teks/ikon selain warna, state loading/kosong/gagal/offline tersedia. Hormati pengurangan gerakan.
