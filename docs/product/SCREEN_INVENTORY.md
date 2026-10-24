# Inventaris layar dan cakupan requirement — tahap frontend

Diperbarui 23 Oktober 2026 (putaran 5). Label status:

- **Tersedia (frontend)** — layar interaktif selesai; data dan aturan disimulasikan adapter demo bertipe. *Bukan* bukti backend.
- **Disimulasikan** — pengalaman tersedia, tetapi kemampuan inti (perangkat/provider/server) diganti simulasi berlabel.
- **Belum** — belum dikerjakan pada tahap ini.

Semua requirement di bawah tetap **NOT_RUN/BLOCKED** untuk gate PRD (G7-A/G7-B) karena backend, database, otorisasi server, dan bukti perangkat lengkap belum ada.

Aplikasi hanya membuka tiga peran: **owner** (termasuk pekerjaan dispatcher dan finance), **driver**, dan **pelanggan** (keputusan pengguna 22 Oktober 2026). Peran `admin` masih ada di model data dan uji kebijakan adapter, tetapi tidak bisa dipilih di aplikasi. Semua teks layar tersedia dalam bahasa Indonesia dan Inggris.

## Layar

| Layar (route) | Peran | Requirement utama | Status |
|---|---|---|---|
| Splash beranimasi (lapisan di atas `_layout`) | semua | PRO-01 | Tersedia — unit derek meluncur masuk, ±1,2 detik |
| Transisi ganti mode owner ↔ driver (lapisan di atas `_layout`) | owner | TEN-07 (konteks eksplisit) | Tersedia |
| Masuk (`/auth/login`), Daftar (`/auth/register`), Lupa kata sandi (`/auth/forgot-password`) | semua / pelanggan baru | TEN-04 (tampilan), PRO-01 | **Disimulasikan** — login lokal dengan kata sandi demo; daftar menyimpan akun pelanggan di HP; lupa kata sandi tidak mengirim email. Bukan TEN-04 |
| Pilih akun demo (`/demo`) | semua | PRO-01, TEN-07 (konteks eksplisit) | Tersedia — hanya mode demo |
| Beranda owner (`/owner`) | owner | FIN-05, ANA-02, TEN-07 | Tersedia — label "Mode owner" dan kartu pindah ke mode driver |
| Beranda driver (`/driver`) | driver, owner dalam mode driver | OPS-01, OPS-05, MOB-03 | Tersedia — palet mode driver (biru-arang + kuning), tombol langkah berikutnya, navigasi, ringkasan hari ini |
| Beranda pelanggan (`/customer`) | pelanggan | ORD-01, BIZ-02 | Tersedia — isian "Jemput di mana?" langsung membuka pemilih lokasi |
| Pekerjaan & permintaan (`/owner/jobs`, `/customer/orders`) | owner, pelanggan | ORD, MOB-01 | Tersedia |
| Peta langsung (`/owner/map`, `/driver/map`, `/customer/map`) | semua (isi per peran) | OPS-02, OPS-06, FLT-01, NFR-04 | **Disimulasikan** — peta HP (Google Maps/Apple Maps via react-native-maps), posisi truk dari replay sintetis F-06 diperbarui tiap 2 detik selama layar terbuka; truk tampak atas menghadap arah jalan dan meluncur terus-menerus; ikuti truk, lihat semua, satelit, lokasi saya. Tracking latar belakang/realtime server **Belum** |
| Keuangan/laporan (`/owner/finance`, `/reports`) | owner | ANA-01–04, FIN-06, BIZ-08, RPT-02 | Tersedia (CSV lewat share sheet); PDF REP-01–04 **Belum** (server T-30) |
| Jadwal & armada (`/fleet`) | owner | FLT-01, FLT-04 | Tersedia (baca; CRUD unit **Belum**) |
| Antrean keuangan (`/finance/queue`) | owner | PAY-02, PAY-11 | Tersedia |
| Biaya & uang jalan (`/finance/expenses`, `/driver/expenses`) | owner, driver | FIN-01, QTE-08 | Tersedia |
| Permintaan baru (`/request/new`) | owner, pelanggan | ORD-01–05 | Tersedia — formulir bertahap (Lokasi → Kendaraan → Waktu → Periksa; owner mulai dari Pelanggan) dengan pemilih lokasi: cari alamat lewat peta bawaan HP, lokasi saya, geser pin, tersimpan/terakhir dipakai, patokan sopir. Alamat asli hanya tersimpan lokal (mode demo) |
| Detail permintaan (`/request/[id]`) | owner, pelanggan | ORD-02, BIZ-03, QTE-04 | Tersedia |
| Susun penawaran (`/request/[id]/quote`) | owner | QTE-01–07, FLT-02/03/06/09 | Tersedia |
| Hitung harga (`/pricing`) | owner | QTE-01–03 (F-01/F-02) | Tersedia |
| Penawaran pelanggan (`/quote/[id]`) | pelanggan/penyetuju | QTE-04/05, BIZ-02/05 | Tersedia |
| Detail pekerjaan (`/order/[id]`) | semua (isi per peran) | OPS-01/05, QTE-06, FLT-05, ORD-06, TEN-03 | Tersedia |
| Penugasan (`/order/[id]/assign`) | owner | FLT-05 | Tersedia |
| Perjalanan (`/order/[id]/tracking`) | owner, pelanggan | OPS-02/06, NFR-04 | **Disimulasikan** (replay F-06, peta mini dengan rute dan truk; tombol ke peta langsung) |
| Kamera GPS (`/camera`) | driver, pelanggan, owner | CAM-01–05 | Tersedia memakai kamera & lokasi HP bila diizinkan; upload server **Disimulasikan** |
| Bukti & perbandingan (`/order/[id]/evidence`) | semua yang berhak | OPS-04, CAM-02/03/06 | Tersedia (foto contoh berlabel SIMULASI) |
| Serah-terima (`/order/[id]/handover`) | driver | OPS-04, SUB-02 | Tersedia |
| Invoice (`/invoice/[id]`) | owner, pembayar | PAY-01/05/09/10, PAY-12 | Tersedia (QR internal `tovv-demo://`, bukan QRIS) |
| Kirim bukti (`/invoice/[id]/proof`) | pelanggan / dibantu owner | PAY-02/12 | Tersedia |
| Pemeriksaan bukti (`/proof/[id]`) | owner | PAY-11, PAY-05 | Tersedia |
| Permintaan pembayaran (`/payment-request/[id]`, deep link) | pembayar, owner | PAY-10, MOB-02 | Tersedia (skema `tovv-demo`) |
| Tagihan pelanggan (`/customer/invoices`) | pelanggan, keuangan B2B | BIZ-06, PAY-02 | Tersedia |
| Delegasi (`/delegations`) | owner | FIN-04 | Tersedia di route, tidak ditautkan dari menu (penerima delegasi adalah admin, yang tidak dibuka aplikasi) |
| Pelanggan bisnis (`/business`) | owner, B2B | BIZ-01–06, BIZ-08 | Tersedia (baca; edit tarif **Belum**) |
| Paket langganan (`/saas`) | owner | SUB-01–06 | Tersedia (pratinjau DEMO, tanpa checkout) |
| Akses dukungan (`/support-access`) | owner | TEN-05, ADM-01 | **Disimulasikan** (Solveit Admin aktual BLOCKED) |
| Kotak masuk (`/inbox`) | semua | MOB-05 | **Disimulasikan** (push HP Belum) |
| Kirim ulang (`/sync`, `/driver/sync`) | semua | OPS-03, MOB-03, NFR-06 | Tersedia (outbox lokal persisten; server **Disimulasikan**) |
| Lainnya (`/owner/more`, `/driver/more`, `/customer/more`) | semua | PRO-01 | Tersedia: pindah peran, bahasa (ID/EN), tema (sistem/terang/gelap), keluar |
| Mode demo & tentang (`/about`) | semua | PRO-01, NFR-08 | Tersedia |

## Alur terhubung

permintaan → penawaran → persetujuan → pemilihan unit → penugasan → perjalanan & dokumentasi → serah-terima → invoice → bukti menunggu dicek → penerimaan demo → ringkasan: **tersedia ujung ke ujung di adapter demo** dan diuji di `mobile/src/data/api/demo-api.test.ts`.

| Kasus penting | Di mana terlihat |
|---|---|
| Masuk dan coba tiap peran | Halaman Masuk → ketuk Owner/Driver/Pelanggan → Masuk (kata sandi `demo1234`) |
| Order telepon tanpa aplikasi pelanggan | Owner → tombol "Catat permintaan" (kanal telepon, persetujuan dicatat) |
| Owner merangkap driver | owner-A: kartu "Masuk mode driver" di beranda (A06 aktif); setelah transisi, tampilan berganti ke palet biru-arang + kuning dan hanya tugas sendiri |
| Pesan derek ala ojek online | Pelanggan → "Jemput di mana?" → cari alamat / Lokasi saya / Pilih di peta → isi patokan → tujuan → kendaraan → waktu → Periksa → Kirim |
| Truk bergerak di peta | owner-A → Peta: U2 menjalankan A06 bergerak dari Surabaya ke Sidoarjo; penyetuju Dealer Demo (ba2-appr) melihat truk yang sama di Lacak |
| Privasi lokasi pelanggan | Wulan (pelanggan) → Lacak: belum ada truk, karena lokasi baru dibagikan setelah sopir berangkat |
| Unit terdekat tidak layak | Susun penawaran: U1 1.500 kg < 1.800 kg, U3 tidak beroperasi; P1 posisi lama |
| Penawaran berubah | Riwayat versi; v1 DIGANTI; A13 kedaluwarsa di C0 |
| Penugasan ditolak/diganti | A07: driver-A1 menolak, driver-A2 ditawari |
| Penerima belum siap | A06: kendala terbuka |
| Biaya tambahan belum disetujui | A06: Rp 200.000 menunggu; tidak masuk invoice sampai disetujui |
| Kamera vs galeri, GPS ditolak/lama, upload tertunda | Kamera: label impor galeri, lokasi tidak tersedia/lama/manual, antrean kirim ulang |
| Dibayar sebagian, kelebihan bayar, bukti ditolak, tagihan belum lunas | A02 sebagian, A03 kelebihan Rp 200.000, A04 ditolak, B03 perlu dicek |
| Kontribusi sementara | A04 (biaya belum final), B03 (ada keberatan) tampil sementara, bukan nol |

## Belum dikerjakan pada tahap ini (tetap scope PROTO)

Backend Laravel/MySQL dan seluruh otorisasi server (TEN-01/02, NFR-01/05), login perangkat sungguhan (TEN-04), transaksi atomik dan race test MySQL (FLT-04, PAY-11), tracking HP di latar belakang dan realtime Reverb (OPS-02, NFR-03), push notification (MOB-02/05), PDF server (RPT-01), upload media ke storage privat (CAM-04/06 sisi server), Solveit Admin aktual (ADM-01–04), backup/restore (NFR-07), observability (NFR-10), pengukuran performa release (NFR-12), CRUD armada dan tarif, API key Google Maps untuk build Android produksi (DEC-08).
