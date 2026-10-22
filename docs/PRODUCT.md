# Product

<!-- impeccable:product-schema 1 -->

Ringkasan kerja untuk desain. Sumber kebenaran scope, requirement, aturan bisnis dan fixture tetap [`spec/PRD.md`](spec/PRD.md); bila berbeda, PRD yang berlaku.

## Platform

adaptive

Satu bahasa desain Tovv untuk Android dan iOS (keputusan pengguna 2026-10-21). Komponen dan tampilan sama di kedua OS; jaminan OS tetap dihormati: tombol/gesture Back Android, swipe-back iOS, safe area, keyboard, pengurangan gerakan, ukuran teks sistem.

## Stack

Ditetapkan dokumen paket 2.1 (`ARCHITECTURE.md` ADR-002): React Native + TypeScript strict, Expo development builds + Expo Router, TanStack Query, SQLite/SecureStore. Exact version tahap frontend: Expo SDK 57 (React Native 0.86, React 19.2.3), Node 22. Backend Laravel/MySQL/Redis/Reverb adalah target integrasi berikutnya.

## Users

Empat kelompok tampilan dalam satu aplikasi multi-tenant, izin tindakan lebih rinci dari tampilan:

- **Owner** perusahaan towing kecil–menengah; sering merangkap driver dan admin. Membuka aplikasi di sela pekerjaan, sering di luar ruangan, untuk memutuskan harga, delegasi dan melihat apa yang tertahan hari ini.
- **Admin**: dispatcher (request lintas kanal, penawaran, jadwal, penugasan) dan finance (invoice, pemeriksaan bukti, piutang). Peran berbeda kecuali diberi gabungan.
- **Operator/driver**: menjalankan tugas di lapangan, mencatat tahap perjalanan, foto bukti, kendala dan biaya, hanya saat kendaraan berhenti.
- **User/customer**: pribadi atau organisasi B2B (requester, approver, finance, penerima). Membuat permintaan, menyetujui penawaran, memantau progres, menerima invoice dan mengajukan bukti bayar.

## Product Purpose

Satu referensi pekerjaan towing dari permintaan sampai penerimaan pembayaran: harga yang dapat dijelaskan, unit yang layak, perjalanan dengan bukti, dan saldo yang dapat ditelusuri. Tahap saat ini adalah prototype untuk presentasi, demonstrasi alur dan uji kegunaan; semua data sintetis dan berlabel DEMO.

## Positioning

Tovv mengelola operasi satu operator (unit sendiri dan mitra kelolaan), bukan marketplace atau jaringan bantuan nasional. Kekhasannya: kontribusi per pekerjaan dengan biaya yang tidak lengkap ditandai provisional, kelayakan unit sebelum ranking, bukti foto dengan sumber waktu/lokasi yang jujur, dan pembayaran manual yang tidak pernah dianggap lunas sebelum diperiksa petugas.

## Operating Context

- Kanal masuk: telepon/chat dicatat admin (assisted), aplikasi customer, dan pelanggan B2B berulang.
- Lapangan: cahaya matahari terik, satu tangan, sinyal putus-putus, ponsel Android menengah; input hanya saat berhenti.
- Dokumen: quote berversi, invoice bernomor, permintaan pembayaran internal, bukti transfer/tunai, receipt demo, PDF/CSV.
- Zona waktu bisnis default Asia/Jakarta; uang integer rupiah.

## Capabilities and Constraints

- Status kanonik mengikuti PRD §5 (request, quote, execution, assignment, invoice, payment proof, outbox, dll.). Jangan membuat status tunggal "paid".
- Tidak ada uang nyata, gateway, QRIS live, rekening numerik nyata; instruksi hanya DEMO-NONPAYABLE-A/B. QR internal `tovv-demo://` bukan QRIS.
- Lokasi: last updated, akurasi dan sumber selalu terlihat; >90 detik = stale; tidak ada koordinat karangan.
- Foto: capture_origin kamera vs galeri, original vs overlay, pending upload tidak boleh tampil "terkirim".
- Kontribusi bukan laba bersih; biaya hilang adalah null, bukan nol.
- Tahap frontend ini memakai adapter demo deterministik; backend/otorisasi server/transaksi atomik belum ada dan tidak boleh diklaim.

## Brand Commitments

- Nama produk tampil: **Tovv**. Pemilik, pengembang dan penerbit: **Solveit Indonesia** (identitas pendukung, misalnya halaman Tentang).
- Belum ada logo Tovv; wordmark sementara dibuat dan ditandai SEMENTARA sampai logo resmi tersedia.
- Logo Solveit (`mobile/assets/brand/`) memakai biru #1136D6–#19B8F2 dan navy #082A56; palet Tovv diturunkan dari sini.
- Bahasa antarmuka Indonesia. Label "DEMO — SIMULASI FRONTEND" wajib terlihat.
- Gaya visual: standar super-app/fintech Indonesia yang akrab bagi pengguna, dengan patokan kualitas Gojek/GoPay, Grab/Tokopedia dan Bank Jago/Jenius (keputusan pengguna 2026-10-22, menggantikan arah "Nota Rangkap"). Tema terang dan gelap mengikuti pengaturan sistem.

## Evidence on Hand

- Paket dokumen 2.1 di root; fixture F-01–F-13 dan oracle F-09 (PRD §8).
- Tidak ada operator nyata, testimoni, harga jual atau metrik penggunaan. Nama perusahaan nyata (mis. Surabaya Towing) tidak boleh menjadi data seed.

## Product Principles

1. Jujur tentang status: pending, stale, provisional, simulasi dan DEMO selalu terlihat dan tidak bergantung warna saja.
2. Tindakan berikutnya lebih penting dari angka: setiap layar menjawab "apa yang harus saya lakukan sekarang".
3. Angka keuangan dapat ditelusuri ke baris sumber; tidak ada dashboard yang terpisah dari transaksi.
4. Lapangan dulu: terbaca di bawah matahari, target sentuh besar, satu tangan, tahan sinyal buruk.
5. Peran menentukan isi: driver dan customer tidak pernah melihat margin atau biaya internal.

## Accessibility & Inclusion

NFR-11: target sentuh utama ≥44 pt (Android 48 dp), font scaling 1,3x tidak memotong aksi utama, status memakai teks/ikon selain warna, state loading/kosong/gagal/offline tersedia. Hormati pengurangan gerakan.
