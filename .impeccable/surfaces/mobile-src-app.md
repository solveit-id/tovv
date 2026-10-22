---
version: 1
slug: "mobile-src-app"
primary_target: "mobile/src/app"
related_targets: []
---

Scope: aplikasi mobile Tovv (Expo Router, mobile/src/app) — seluruh shell empat peran. Visitor mode: Operate.

Audience/job: owner (sering merangkap driver), admin dispatcher/finance, driver lapangan, customer pribadi/B2B; menyelesaikan pekerjaan towing dari permintaan sampai receipt demo. Konten nyata: fixture F-09 PRD §8 (sintetis, DEMO). Constraint: satu bahasa Tovv di Android+iOS, light theme untuk terik siang, Bahasa Indonesia, NFR-11.

## Direction contract

THESIS: Tovv adalah buku nota rangkap yang jujur. Setiap pekerjaan adalah dokumen berversi dengan nomor seri; menolak dasbor kartu-ikon-angka seragam yang memisahkan angka dari transaksi.

OWN-WORLD: latar putih dingin #F6F8FB, lembar #FFFFFF, garis sel formulir #D5DDE8, tinta karbon #1136D6 untuk aksi/seleksi, navy #082A56 untuk shell/header, slate #5C7392 untuk teks sekunder, nomor seri merah #C42032 hanya untuk nomor dokumen, tepi lembar rangkap merah muda #F6D5DE dan kuning #F7E6A1. Font sistem, angka tabular, label sel huruf kecil-kapital, nomor/ref monospace karena data.

STORY: pengguna melihat apa yang tertahan, membuka dokumennya, memahami versi dan status yang sebenarnya, lalu melakukan satu tindakan berikutnya.

FIRST VIEWPORT: header navy dengan wordmark Tovv dan pita DEMO; di bawahnya daftar tindakan harian (alasan, PIC, tenggat) memimpin, lalu ringkasan uang dalam sel nota dengan angka sejajar kanan; aksi utama di bawah, terjangkau ibu jari; tab bar native di bawah.

FORM: nota karbon rangkap/surat jalan, kandidat ke-3 dari daftar resonansi; seed key 212c89b6. Gerakan khas: LEMBAR RANGKAP — versi lama quote/invoice mengintip sebagai lembar bertumpuk berwarna di belakang versi aktif dan membuka riwayat; CAP DIPERIKSA/DITOLAK/DIGANTI muncul dengan tekanan hanya saat status tercapai. Raise (emission rail): status dibawa bentuk garis — utuh=final, putus-putus=pending/provisional, coret=batal — plus teks/ikon. Raise (transit diagram): garis tahap perjalanan dengan penanda stasiun berjarak tetap. Raise (botanical folio): foto pickup vs serah-terima dibandingkan pada skala dan baseline sama. Raise (Crouwel): grid 4 pt, kolom angka sejajar. Raise (vertical feed): tugas aktif driver menguasai layar dengan satu aksi utama.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
