# Arah visual Tovv — "Nota Rangkap"

Status: dipakai pada tahap frontend (2026-10-21). Spesifikasi turunan kode yang lengkap akan dicatat di `docs/DESIGN.md` setelah review akhir.

## Keputusan

- **Satu bahasa desain Tovv** di Android dan iOS (keputusan pengguna). Jaminan OS tetap: Back Android/predictive back, swipe-back iOS (native stack), safe area, keyboard, ukuran teks sistem, pengurangan gerakan.
- **Dunia visual:** buku nota/surat jalan karbon rangkap — benda yang dipegang operator towing setiap hari. Dunia ini hanya menyumbang tipografi, palet, kepadatan, dan satu gerakan khas; navigasi dan kontrol tetap standar aplikasi.
- **Terang** (bukan gelap): pengguna utama berdiri di samping truk di bawah matahari siang. Mode gelap belum dibangun.
- **Font sistem** (Roboto/SF) untuk keterbacaan dan performa; angka tabular untuk uang; nomor dokumen monospace karena data.

## Token warna (dari SVG logo Solveit)

Warna aktual pada `mobile/assets/brand/solveit-logo-*.svg`: gradien biru `#1136D6` `#124EDC` `#134EE1` `#1452ED` `#145EF6` `#167DFF` `#178BFF` `#1A7FFF` `#18A9F2` `#19B8F2`, navy `#082A56`, slate `#5C7392`.

| Token | Hex | Peran | Asal |
|---|---|---|---|
| `carbon` | `#1136D6` | Aksi utama, seleksi, garis tahap — "tinta karbon" | ujung gelap gradien logo |
| `navy` | `#082A56` | Shell/header, teks wordmark | navy logo |
| `sky` | `#19B8F2` | Aksen di atas navy (vv kedua wordmark) | ujung terang gradien |
| `inkSecondary` | `#5C7392` | Teks sekunder (4,86:1 di putih) | slate logo |
| `ink` | `#0D1B2E` | Teks utama | navy digelapkan |
| `ground` / `sheet` | `#F6F8FB` / `#FFFFFF` | Latar dingin / lembar nota | turunan netral |
| `rule` / `ruleStrong` | `#D5DDE8` / `#AEBBCD` | Garis sel formulir | turunan navy |
| `serial` | `#C42032` | Nomor dokumen saja (nomor seri merah nota) | dunia nota |
| `plyPink` `plyYellow` `plyBlue` | `#F6D5DE` `#F7E6A1` `#D6E4FA` | Tepi lembar rangkap versi lama | dunia nota |
| status ok/warn/danger/neutral | ink `#1A6B3C` `#8A5300` `#B42318` `#43566F` di atas wash masing-masing | Status (selalu dengan teks/ikon/garis) | fungsional |
| `demoWash` | `#F7E6A1` | Pita "DEMO — SIMULASI FRONTEND" | ply kuning |

Semua pasangan teks diuji ≥ 4,5:1 di `mobile/src/core/design/tokens.test.ts`.

## Gerakan khas dan raise

- **Lembar rangkap** (`components/nota/document-stack.tsx`): penawaran berversi dan invoice dengan nota kredit tampil sebagai lembar aktif dengan tepi lembar lama mengintip di belakang; ketuk untuk membuka riwayat. Jumlah lembar = jumlah versi, tidak dekoratif.
- **Cap status** (`components/nota/stamp.tsx`): DISETUJUI, DITOLAK, DIGANTI, DIPERIKSA, DITERIMA (DEMO) — dirender hanya ketika status tercapai di sumber data; animasi tekan sekali, dilewati bila "kurangi gerakan" aktif.
- Raise dari emission rail: **status dibawa bentuk garis** — utuh = final, putus-putus = menunggu/provisional, coret = batal — plus teks dan ikon (`components/ui/status-tag.tsx`).
- Raise dari diagram transit: **garis tahap perjalanan** dengan stasiun berjarak tetap; ruas utuh hanya untuk tahap yang sudah terjadi di server, putus-putus untuk belum/menunggu sinkron (`components/nota/stage-line.tsx`).
- Raise dari folio botani: **perbandingan foto sebelum/sesudah pada skala dan baseline sama** (`features/trips/evidence-screen.tsx`).
- Raise dari spesimen grid: grid 4 pt dan kolom angka rata kanan (tabel kontribusi).
- Raise dari feed vertikal: **tugas aktif driver menguasai layar** dengan satu aksi utama besar di bawah, terjangkau ibu jari.

## Komponen

`components/ui`: `Txt`, `Icon` (satu keluarga MaterialCommunityIcons), `Button` (primary/secondary/quiet/danger/onNavy; min 48 dp; feedback tekan), `StatusTag`, `Sheet`, `Cell`/`CellGrid` (sel nota), `Money` (rata kanan, tabular; `null` = "—" + keterangan), `Serial`, `LineItem`, `Field`/`MoneyField`/`Choice`/`Toggle`/`Segmented`, `BottomSheet`, state `Loading/Error/Empty/QueryView`.
`components/nota`: `DocumentStack`, `Stamp`, `StageLine`/`StageTicks`, `ActionItem`, `RouteSchematic` (skema rute berlabel simulasi, bukan peta), `PhotoTile` (fixture berlabel SIMULASI), `InternalQr` (QR internal `tovv-demo://`, bukan QRIS).
`components/layout`: `DemoStrip` (pita permanen), `RootHeader`/`DetailHeader`, `Screen` (scroll native, pull-to-refresh, footer aksi, keyboard), `RoleTabs`.

## Motion

Durasi `fast 140 / base 220 / slow 320 / stamp 260 ms`, easing ease-out eksponensial (`core/design/motion.ts`). Dipakai untuk: transisi native stack/tab, feedback tekan, kemunculan snackbar, buka riwayat lembar rangkap (layout transition), cap status, kemunculan baris di layar mulai. Tidak ada loop dekoratif, tidak ada pengambilalihan scroll. Animasi layout Reanimated mengikuti pengaturan "kurangi gerakan" sistem.

## Identitas

- **Tovv** adalah identitas utama (splash, header akar, ikon aplikasi). Logo Tovv resmi belum ada: wordmark "tovv" **SEMENTARA** dibangun dari bentuk geometris (`components/brand/wordmark.tsx`); ikon aplikasi memakai tanda "vv" dan dirender deterministik oleh `mobile/scripts/generate-brand-assets.mjs` (provenance: dibuat skrip ini, bukan aset pihak ketiga). Ganti keduanya saat logo resmi tersedia.
- **Solveit Indonesia** tampil di layar Mulai (teks kecil) dan Mode demo & tentang (logo resmi), bukan sebagai judul layar.

## Referensi yang dipelajari

Galeri Dribbble/Behance tidak dapat dibuka oleh alat (bot challenge/403), sehingga referensi berikut adalah halaman yang benar-benar dibuka; polanya dibaca dari teks halaman, bukan dari gambar. Tidak ada klaim penghargaan atau aplikasi native di luar yang dinyatakan halaman.

| URL | Jenis | Pola | Adaptasi untuk Tovv |
|---|---|---|---|
| https://kb.samsara.com/hc/en-us/articles/43217017570829-View-or-Complete-a-DVIR-in-DVIR-2-0 | Dokumentasi fitur inspeksi kendaraan aplikasi driver yang dirilis | Slot foto per sisi, field wajib, kerja offline lalu sinkron | Slot bukti PU1/PU2/DO1 per tahap, antrean sinkronisasi |
| https://www.uber.com/us/en/blog/live-activity-on-ios/ | Tulisan engineering fitur yang dirilis | Prioritas sekilas: ETA → identitas kendaraan → progres | Layar Perjalanan: ETA dulu, lalu unit/petugas, lalu tahap |
| https://docs.stripe.com/invoicing/overview | Dokumentasi produk | Status invoice ketat dengan aksi yang diizinkan per status; jejak koreksi | Aksi invoice/bukti mengikuti `allowedActions`; nota kredit tidak menghapus histori |
| https://contra.com/p/LX66ZQoY-scalar-live-view-enhancement-for-fleet-management | Studi kasus dispatcher (penulis menyatakan V1 live) | Daftar pengecualian lebih dulu daripada peta; warna status semantik | Beranda = daftar tindakan harian; peta bukan layar utama |
| https://onix-systems.com/on-demand-towing-app-development-case-study | Studi kasus agensi (MVP React Native) | Layanan dulu, lalu kendaraan/lokasi/kendala/kontak | Formulir permintaan berurutan kendaraan → lokasi → waktu → pihak |
| https://folderit.net/proof-of-delivery-app-a-real-offline-first-build/ | Contoh offline-first (disebut belum production-ready) | Konfirmasi hanya setelah simpan lokal; file dulu, record kemudian | Foto disalin ke penyimpanan permanen sebelum "tersimpan"; status "tersimpan di ponsel, menunggu kirim" |

Tidak ada merek, aset berlisensi, atau desain lengkap yang disalin.

## Anti-pola yang sengaja dihindari

Kartu ikon-judul-teks seragam, angka hero dengan statistik palsu, gradien/neon/glass dekoratif, kartu bersarang, kicker di atas judul, emoji sebagai ikon, peta dekoratif besar di beranda, status yang hanya berupa warna.
