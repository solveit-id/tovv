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

OWN-WORLD: biru merek Solveit sebagai header gradien #0D2EC2→#1766D1 (ujung dibatasi agar teks putih ≥4,5:1) dengan cahaya langit #19B8F2 di sudut kanan atas, dan tint aksi #1136D6; latar #F4F6FA terang / #0B1018 gelap, permukaan putih / #151C27, kartu membulat 16–20 dengan bayangan lembut berarah ke bawah, chip status membulat dengan ikon + teks + garis (utuh/putus-putus/coret), angka uang besar tebal tabular, font Plus Jakarta Sans (keputusan pengguna 25 Okt 2026, menggantikan font sistem), satu keluarga ikon MaterialCommunityIcons dalam tile ikon membulat.

STORY: pengguna langsung melihat ringkasan miliknya (uang/tugas), pintasan tugas utamanya, lalu daftar "Perlu tindakan" dengan alasan yang ditulis dalam bahasa sehari-hari, dan membuka satu kartu untuk menyelesaikannya.

FIRST VIEWPORT: header gradien biru penuh-lebar dengan sapaan, nama usaha, tanggal dan tombol notifikasi; pita DEMO kuning di atasnya; kartu ringkasan putih melayang menimpa tepi bawah header (angka utama + dua sub-angka); grid 4 pintasan ikon; lalu bagian "Perlu tindakan" berupa kartu membulat; tab bar bawah dengan indikator pil aktif. Aksi utama: owner = extended FAB "Catat permintaan" di atas tab bar (menyusut jadi ikon saat menggulir turun); pelanggan = tombol penuh "Minta derek" di dalam kartu ringkasan karena itu satu-satunya tugas utamanya; driver = tombol langkah berikutnya di kartu tugas terdekat (tanpa tugas, kartu menjadi keadaan kosong).

FORM: standar kategori (canon), dipilih pengguna; tidak ada posisi daftar; seed:99bfc5b6111de108. Gerakan khas (putaran 5, 23 Okt 2026, setelah pengguna menilai gerak sebelumnya berlebihan): tenang dan tanpa pantulan — header parallax ringan yang memudar dan menyerahkan judul ke bar ringkas; kartu daftar memudar masuk singkat; tekan = sedikit mengecil dan meredup (tanpa kemiringan 3D, tanpa scroll-trigger per kartu); angka ringkasan menghitung naik sekali; pil tab meluncur; momen bermerek = unit derek yang meluncur masuk di splash dan truk tampak atas yang meluncur terus-menerus di peta. Semua di UI thread (Reanimated), "kurangi gerakan" = tanpa gerak ruang.

MODE (keputusan pengguna 23 Okt 2026): owner punya dua mode yang harus terlihat beda. Mode owner/pelanggan = biru merek. Mode driver = palet `field`: header biru-arang #0E1522→#1C2A40 dengan cahaya kuning #F5A524 dan marka jalan samar, pil "Mode driver" dan tombol langkah berikutnya kuning dengan teks cokelat gelap, pil tab kuning; transisi singkat saat berganti mode.

BAHASA & PAKET (keputusan pengguna 25 Okt 2026): kata "derek" di aplikasi diganti "towing"; nama produk selalu "Tovv"; paket layanan Car Towing, Car Carrier, Storing Motor, Self Drive tampil dengan harga contoh "mulai dari" berlabel DEMO; setiap tindakan penting dan permintaan izin lewat dialog Tovv; tampilan driver dan pelanggan dibuat sesederhana mungkin dengan sorotan perkiraan tiba.

PEMESANAN (keputusan pengguna 23 Okt 2026): formulir "Pesan derek" bertahap 4 langkah; lokasi jemput/tujuan dipilih seperti aplikasi ojek online (cari alamat lewat layanan peta bawaan HP, lokasi saya, geser pin, tersimpan, terakhir dipakai, patokan untuk sopir).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
