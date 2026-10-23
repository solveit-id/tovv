---
version: 1
slug: "mobile-src-app"
primary_target: "mobile/src/app"
related_targets: []
---

Scope: aplikasi mobile Tovv (Expo Router, mobile/src/app) — seluruh shell tiga peran yang dibuka aplikasi (owner, driver, pelanggan), termasuk splash, akun demo, dan peta langsung. Visitor mode: Operate.

Audience/job: owner (sering merangkap driver; juga mengerjakan tugas dispatcher/finance), driver lapangan, customer pribadi/B2B; menyelesaikan pekerjaan towing dari permintaan sampai receipt demo. Konten nyata: fixture F-09 PRD §8 (sintetis, DEMO). Constraint: satu bahasa Tovv di Android+iOS, tema terang + gelap mengikuti sistem (keputusan pengguna 2026-10-22), dua bahasa (Indonesia sumber, Inggris), NFR-11, performa 60 fps di Android menengah.

Riwayat: arah "Nota Rangkap" (seed 212c89b6) ditolak pengguna setelah uji Expo Go 2026-10-22 (jelek, tidak modern, membingungkan). Diganti standar kategori atas pilihan pengguna.

## Direction contract

THESIS: Tovv memakai standar super-app/fintech Indonesia yang sudah dikenal pengguna, dieksekusi setara Gojek/GoPay, Grab/Tokopedia, Bank Jago/Jenius; menolak layar formulir abu-abu dan kosakata internal yang membingungkan.

OWN-WORLD: biru merek Solveit sebagai header gradien #0D2EC2→#1766D1 (ujung dibatasi agar teks putih ≥4,5:1) dengan cahaya langit #19B8F2 di sudut kanan atas, dan tint aksi #1136D6; latar #F4F6FA terang / #0B1018 gelap, permukaan putih / #151C27, kartu membulat 16–20 dengan bayangan lembut berarah ke bawah, chip status membulat dengan ikon + teks + garis (utuh/putus-putus/coret), angka uang besar tebal tabular, font sistem, satu keluarga ikon MaterialCommunityIcons dalam tile ikon membulat.

STORY: pengguna langsung melihat ringkasan miliknya (uang/tugas), pintasan tugas utamanya, lalu daftar "Perlu tindakan" dengan alasan yang ditulis dalam bahasa sehari-hari, dan membuka satu kartu untuk menyelesaikannya.

FIRST VIEWPORT: header gradien biru penuh-lebar dengan sapaan, nama usaha, tanggal dan tombol notifikasi; pita DEMO kuning di atasnya; kartu ringkasan putih melayang menimpa tepi bawah header (angka utama + dua sub-angka); grid 4 pintasan ikon; lalu bagian "Perlu tindakan" berupa kartu membulat; tab bar bawah dengan indikator pil aktif. Aksi utama: owner = extended FAB "Catat permintaan" di atas tab bar (menyusut jadi ikon saat menggulir turun); pelanggan = tombol penuh "Minta derek" di dalam kartu ringkasan karena itu satu-satunya tugas utamanya; driver = tombol langkah berikutnya di kartu tugas terdekat (tanpa tugas, kartu menjadi keadaan kosong).

FORM: standar kategori (canon), dipilih pengguna; tidak ada posisi daftar; seed:99bfc5b6111de108. Gerakan khas: header parallax yang bergerak setengah kecepatan, memudar dan menyerahkan judul ke bar ringkas saat digulir; kartu masuk bertahap; tekan kartu = turun skala dengan kemiringan 3D halus; angka ringkasan menghitung naik sekali; indikator pil tab meluncur. Semua di UI thread (Reanimated), "kurangi gerakan" = tanpa gerak.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
