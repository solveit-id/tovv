---
name: Tovv
description: Buku nota rangkap yang jujur untuk operator towing — satu bahasa desain native di Android dan iOS, tema terang.
colors:
  carbon: "#1136D6"
  carbon-pressed: "#0C29A8"
  carbon-tint: "#E8EDFD"
  navy: "#082A56"
  navy-raised: "#0F3769"
  on-navy: "#FFFFFF"
  on-navy-secondary: "#B9C8E3"
  sky: "#19B8F2"
  serial: "#C42032"
  ply-pink: "#F6D5DE"
  ply-yellow: "#F7E6A1"
  ply-blue: "#D6E4FA"
  ground: "#F6F8FB"
  sheet: "#FFFFFF"
  sheet-sunk: "#EEF2F7"
  rule: "#D5DDE8"
  rule-strong: "#AEBBCD"
  ink: "#0D1B2E"
  ink-secondary: "#5C7392"
  ink-disabled: "#98A6BA"
  ok-ink: "#1A6B3C"
  ok-wash: "#E3F3E8"
  warn-ink: "#8A5300"
  warn-wash: "#FFF0CC"
  danger-ink: "#B42318"
  danger-wash: "#FDE8E6"
  neutral-ink: "#43566F"
  neutral-wash: "#EBEFF5"
  demo-wash: "#F7E6A1"
  demo-rule: "#E3CE73"
typography:
  title: { fontFamily: "system (Roboto / SF Pro)", fontSize: "24px", fontWeight: 700, lineHeight: "30px" }
  headline: { fontFamily: "system (Roboto / SF Pro)", fontSize: "20px", fontWeight: 700, lineHeight: "26px" }
  titleSm: { fontFamily: "system (Roboto / SF Pro)", fontSize: "17px", fontWeight: 600, lineHeight: "22px" }
  body: { fontFamily: "system (Roboto / SF Pro)", fontSize: "16px", fontWeight: 400, lineHeight: "22px" }
  bodyStrong: { fontFamily: "system (Roboto / SF Pro)", fontSize: "16px", fontWeight: 600, lineHeight: "22px" }
  bodySm: { fontFamily: "system (Roboto / SF Pro)", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }
  label: { fontFamily: "system (Roboto / SF Pro)", fontSize: "12px", fontWeight: 700, lineHeight: "16px", letterSpacing: "0.6px" }
  caption: { fontFamily: "system (Roboto / SF Pro)", fontSize: "12px", fontWeight: 400, lineHeight: "16px" }
  figure: { fontFamily: "system (Roboto / SF Pro)", fontSize: "17px", fontWeight: 600, lineHeight: "22px", fontFeature: "tnum" }
  figureLg: { fontFamily: "system (Roboto / SF Pro)", fontSize: "26px", fontWeight: 700, lineHeight: "32px", fontFeature: "tnum" }
  serial: { fontFamily: "Menlo (iOS), monospace (Android)", fontSize: "13px", fontWeight: 700, lineHeight: "18px", letterSpacing: "0.4px" }
  mono: { fontFamily: "Menlo (iOS), monospace (Android)", fontSize: "13px", fontWeight: 400, lineHeight: "18px" }
rounded:
  cell: "4px"
  sheet: "6px"
  control: "8px"
  pill: "999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  xxxl: "32px"
  huge: "40px"
components:
  button-primary: { backgroundColor: "{colors.carbon}", textColor: "{colors.on-navy}", typography: "{typography.bodyStrong}", rounded: "{rounded.control}", padding: "8px 16px", height: "48px" }
  button-primary-pressed: { backgroundColor: "{colors.carbon-pressed}" }
  button-primary-lg: { typography: "{typography.titleSm}", height: "56px" }
  button-primary-disabled: { backgroundColor: "{colors.ink-disabled}" }
  button-secondary: { backgroundColor: "{colors.sheet}", textColor: "{colors.carbon}", rounded: "{rounded.control}", height: "48px" }
  button-secondary-pressed: { backgroundColor: "{colors.carbon-tint}" }
  button-danger: { backgroundColor: "{colors.sheet}", textColor: "{colors.danger-ink}", rounded: "{rounded.control}" }
  button-on-navy: { backgroundColor: "{colors.navy-raised}", textColor: "{colors.on-navy}", rounded: "{rounded.control}" }
  field: { backgroundColor: "{colors.sheet}", textColor: "{colors.ink}", typography: "{typography.body}", rounded: "{rounded.control}", padding: "0 12px", height: "48px" }
  field-readonly: { backgroundColor: "{colors.sheet-sunk}" }
  sheet: { backgroundColor: "{colors.sheet}", rounded: "{rounded.sheet}", padding: "16px" }
  cell: { backgroundColor: "{colors.sheet}", padding: "12px", height: "72px" }
  status-tag-info: { backgroundColor: "{colors.carbon-tint}", textColor: "{colors.carbon}", typography: "{typography.bodySm}", rounded: "{rounded.cell}", padding: "3px 8px" }
  segmented-on: { backgroundColor: "{colors.navy}", textColor: "{colors.on-navy}", height: "42px" }
  root-header: { backgroundColor: "{colors.navy}", textColor: "{colors.on-navy}", typography: "{typography.title}", padding: "12px 16px 16px" }
  demo-strip: { backgroundColor: "{colors.demo-wash}", textColor: "{colors.navy}", typography: "{typography.caption}", height: "40px" }
---

# Design System: Tovv

Sistem ini dicatat dari build yang dikirim (`mobile/src/core/design/tokens.ts`, `motion.ts`, `core/i18n/status.ts`, `components/**`) dan tangkapan emulator di `.impeccable/review/`. Alasan dan asal-usul keputusan ada di [visual-direction.md](design/visual-direction.md); kontrak permukaan di `.impeccable/surfaces/mobile-src-app.md` (arah "Nota Rangkap", seed 212c89b6). Frontmatter bersifat normatif; satuan px di atas berarti dp/pt di React Native.

## Overview

**Creative North Star: "Nota Rangkap"**

Tovv adalah buku nota karbon rangkap / surat jalan yang dipegang operator towing: setiap pekerjaan adalah dokumen bernomor seri dan berversi. Dunia itu hanya menyumbang palet, tipografi sel, kepadatan, dan dua gerakan khas (lembar rangkap, cap status); navigasi, tab, back gesture, safe area, keyboard dan ukuran teks tetap native. Satu bahasa desain dipakai di Android dan iOS, tema terang saja (dibaca di bawah matahari siang), font sistem, satu keluarga ikon (MaterialCommunityIcons), salinan UI Bahasa Indonesia.

Mode Operate: layar dibuka dengan apa yang tertahan (daftar tindakan harian), lalu dokumen, lalu satu aksi berikutnya di area ibu jari. Uang selalu duduk di sel nota dengan angka tabular sejajar kanan; nilai yang belum diketahui ditulis "—" plus keterangan, tidak pernah nol.

**Key Characteristics:**
- Latar dingin, lembar putih bergaris rambut, shell navy, tinta karbon untuk aksi.
- Status = teks + ikon + bentuk garis (utuh/putus-putus/coret); warna hanya penguat.
- Nomor dokumen monospace merah, satu-satunya pemakaian merah seri.
- Datar; kedalaman berasal dari garis dan tumpukan lembar, bukan bayangan.
- Pita "DEMO — SIMULASI FRONTEND" kuning permanen di atas semua layar.

## Colors

Palet diturunkan dari logo Solveit (gradien biru, navy, slate) ditambah warna kertas nota rangkap.

### Primary
- **Tinta Karbon** (`carbon`): aksi utama, seleksi, tab aktif, garis tahap yang sudah terjadi, status `info`. `carbonPressed` untuk tekan, `carbonTint` untuk wash tekan/seleksi pada lembar putih.

### Secondary
- **Navy Sampul** (`navy`): header akar, segmen aktif, snackbar, QR internal. `navyRaised` untuk tombol di atas navy; `onNavy` / `onNavySecondary` untuk teks di atasnya.
- **Biru Langit** (`sky`): hanya "v" kedua wordmark di atas navy.

### Tertiary
- **Merah Nomor Seri** (`serial`): nomor dokumen (`Serial`, judul DetailHeader) dan badge hitungan. Bukan warna bahaya.
- **Lembar Rangkap** (`plyPink`, `plyYellow`, `plyBlue`): tepi versi lama di `DocumentStack`, urutan merah muda → kuning → biru. `demoWash`/`demoRule` memakai kuning yang sama untuk pita DEMO.

### Neutral
- **Latar Dingin** (`ground`) untuk layar; **Lembar** (`sheet`) untuk permukaan; **Lembar Cekung** (`sheetSunk`) untuk field read-only, segmented track, skema rute.
- **Garis Sel** (`rule`) untuk garis rambut sel dan pembatas; **Garis Tegas** (`ruleStrong`) untuk border field, ply, total.
- **Tinta** (`ink`), **Slate** (`inkSecondary`, teks sekunder dan label sel), `inkDisabled`.
- **Pasangan status** `okInk/okWash`, `warnInk/warnWash`, `dangerInk/dangerWash`, `neutralInk/neutralWash`: ink di atas wash-nya sendiri.

### Named Rules
**The Red Serial Rule.** `serial` hanya untuk nomor dokumen dan badge hitungan; bahaya memakai `dangerInk`.
**The No Raw Hex Rule.** Layar tidak menulis hex; semua warna lewat token `color` (pasangan teks diuji ≥ 4,5:1 di `tokens.test.ts` dengan `contrast.ts`).

## Typography

**Display/Body Font:** font sistem (Roboto di Android, SF Pro di iOS).
**Data Font:** Menlo (iOS) / monospace (Android) untuk `serial` dan `mono`.

**Character:** sans sistem yang lugas untuk keterbacaan lapangan; monospace hanya karena nomor dan ref adalah data.

### Hierarchy
- **Title** (700, 24/30): judul header akar navy.
- **Headline** (700, 20/26): judul bottom sheet.
- **TitleSm** (600, 17/22): judul DetailHeader, SectionTitle, label tombol `lg`.
- **Body / BodyStrong** (400/600, 16/22): isi, baris LineItem, label tombol `md`.
- **BodySm** (400, 14/20): alasan, status tag, segmen, keterangan.
- **Label** (700, 12/16, +0.6, UPPERCASE): label sel nota dan field (`Cell`, `Field`, `Choice`, kepala kolom tabel). Selalu menamai nilai di bawahnya.
- **Caption** (400, 12/16): metadata, waktu, helper.
- **Figure / FigureLg** (600/700, 17/22 dan 26/32, tabular): nominal rupiah lewat `Money`.
- **Serial / Mono** (700/400, 13/18): nomor dokumen, URI, ref.

### Named Rules
**The Cell Label Rule.** Huruf kapital kecil `label` hanya menamai sel/field/kolom berisi nilai; tidak dipakai sebagai kicker di atas judul.
**The Unlocked Size Rule.** Ukuran teks mengikuti pengaturan sistem; `maxFontSizeMultiplier` (1,2–1,4) hanya untuk pita DEMO, cap, badge, legenda dan pita QR yang sempit.

## Layout

- Ritme 4 dp (`space`); padding layar horizontal `lg` (16), lembar `lg`, sel `md` (12), jarak SectionTitle `xxl` (24) di atas.
- `Screen`: header di atas (header akar bisa ikut tergulir, pita DEMO tetap terpaku), isi bergulir native tanpa scroll-jacking, pull-to-refresh, footer aksi putih bergaris atas yang naik bersama keyboard dan tetap di area ibu jari.
- Lebar baca maksimal 720 dp di tablet/lanskap, isi dan footer terpusat; header tetap selebar layar (`72b`).
- `CellGrid` 2 kolom yang menjadi 1 kolom saat teks diperbesar (`75c`, skala font 1,3).
- Target sentuh minimum `touch.min` 48 dp di kedua OS; tombol `lg` 56 dp untuk aksi utama lapangan.
- Tab bawah native per peran (`RoleTabs`), ikon 24 dp outline → terisi saat aktif.

## Elevation & Depth

Datar secara default. Kedalaman dibawa garis rambut (`rule`, 2× hairline), lembar putih di atas latar dingin, dan tumpukan ply berwarna. Bayangan hanya dua, keduanya ambient dengan warna `shadow` (navy): lembar depan `DocumentStack` (opacity 0,06, radius 3, y 1, elevation 1) dan snackbar (0,18, radius 8, y 3, elevation 4). Scrim bottom sheet `scrim` navy 48%.

**The One Sheet Rule.** Satu tingkat lembar: tidak ada lembar di dalam lembar, tidak ada kartu bersarang.

## Shapes

Sudut kecil seperti kertas: `cell` 4 untuk grid sel dan status tag, `sheet` 6 untuk lembar, ply, skema rute, QR; `control` 8 untuk tombol, field, pilihan, segmen, snackbar; bottom sheet atas 12. Border tombol/field 1,5; fokus field 2 `carbon`. Garis status: utuh = final, putus-putus = menunggu/provisional, coret (line-through) = batal/tidak berlaku. Cap memakai bingkai ganda (2 + 1) diputar −6°.

## Components

### Buttons
- **Shape:** `control` (8), border 1,5, min 48 dp; `lg` 56 dp; `compact` 40 dp + hitSlop 6.
- **Primary:** `carbon` terisi, teks `onNavy`; tekan `carbonPressed` + skala 0,985; `lg` primary memberi haptic ringan.
- **Secondary / Quiet / Danger / OnNavy:** lembar putih bergaris karbon; transparan; garis `dangerInk`; `navyRaised` di header. Tekan = wash `carbonTint` (atau `navy`).
- **Disabled/Loading:** primary `inkDisabled`; lainnya teks `inkDisabled`, garis `rule`; loading menampilkan spinner dan `busy`.

### Status Tag
Ikon + teks + garis dari `status.ts`; wash dan ink per tone, border 1,25 utuh/putus-putus, teks dicoret untuk `struck`. Label aksesibilitas menambahkan "belum final" / "tidak berlaku".

### Cards / Containers (Sheet, Cell, LineItem)
- `Sheet`: putih, `sheet` 6, garis `rule`, padding 16.
- `Cell`: label `label` di atas nilai, min 72 dp, garis sel kanan/bawah; bila dapat diketuk, chevron dan wash `carbonTint`.
- `LineItem`: label kiri, nilai kanan (≤ 55%); total dipisah `Rule strong`.
- `Money`: tabular, rata kanan; `null` → "—" + caption `warnInk`.

### Inputs / Fields
Label sel di atas, kotak putih border `ruleStrong` 1,5, `control` 8, min 48 dp; fokus border `carbon` 2; galat border `dangerInk` + ikon dan caption yang diumumkan; read-only `sheetSunk`. `MoneyField` berawalan "Rp", kosong = `null`. `Choice` = baris radio 48 dp, aktif `carbon` + `carbonTint`. `Segmented` untuk filter: track `sheetSunk`, aktif `navy`.

### Navigation
`RootHeader` navy dengan wordmark atau judul `title` dan tombol ikon 48 dp; `DetailHeader` putih dengan tombol kembali, `serial` di atas judul; gesture back OS tetap aktif. Tab bawah putih, aktif `carbon`, badge `serial`. `BottomSheet` untuk tugas fokus yang dapat dibatalkan.

### Lembar Rangkap (`DocumentStack`)
Dokumen berversi (penawaran, invoice dengan nota kredit) tampil sebagai lembar depan; maksimal 3 ply versi lama mengintip (offset 5 dp vertikal / 4 dp horizontal). Jumlah ply = jumlah versi sebelumnya, tidak pernah dekoratif. Tombol karbon "N versi sebelumnya" membuka riwayat (layout transition 220, fade 200/140) (`74`, `74b`).

### Cap Status (`Stamp`)
DISETUJUI, DITOLAK, DIGANTI, DIPERIKSA, DITERIMA (DEMO) dalam ink tone (`okInk`, `dangerInk`, `neutralInk`, `carbon`); dirender hanya saat status tercapai di sumber data; masuk dengan tekanan sekali (skala 1,28 → 1, `duration.stamp` 260) (`48`, `74b`).

### Garis Tahap (`StageLine`, `StageTicks`)
Stasiun berjarak tetap pada rel 28 dp: selesai = lingkaran karbon bercentang, sekarang = cincin karbon 3, menunggu sinkron = putus-putus `warnInk` di atas `warnWash`, belum = cincin `ruleStrong`. Ruas utuh hanya antara tahap yang sudah terjadi; sisanya putus-putus. Versi ringkas: ruas 6 dp per tahap.

### Lainnya
- `ActionItem`: baris tindakan harian (ikon keparahan, judul, nominal, alasan, PIC, tenggat, chevron), tanpa tombol "selesai" (`73c`).
- `RouteSchematic`: skema rute di atas grid 24 dp `sheetSunk`, jalur sisa putus-putus, tempuh karbon; legenda "SKEMA SIMULASI · bukan peta jalan".
- `InternalQr`: QR navy di bingkai putus-putus, pita "QR INTERNAL TOVV · BUKAN QRIS" dan "TIDAK DAPAT DIBAYAR · DEMO".
- `DemoStrip`: pita kuning permanen, tinggi 40 + hitSlop = 48 dp, membuka pemilih akun demo lokal.
- Snackbar: navy/`okInk`/`dangerInk`, di bawah pita DEMO (bukan di area ibu jari), diumumkan ke pembaca layar.

### Motion
Durasi `fast` 140, `base` 220, `slow` 320, `stamp` 260 ms; easing ease-out eksponensial (`easeOut`), `easeInOut` kubik. Hanya Reanimated/native; `useMotionDuration` mengembalikan 0 saat "kurangi gerakan". Tidak ada loop dekoratif.

### Identitas
Wordmark "tovv" **SEMENTARA** (`components/brand/wordmark.tsx`, grid 2 px, "v" kedua `sky` di navy / `carbon` di terang) karena logo resmi belum tersedia; ganti komponen ini saat logo diterima. Logo Solveit Indonesia hanya di layar Tentang (`about-screen`); layar Mulai memuat satu baris teks kredit.

## Do's and Don'ts

### Do:
- **Do** bawa setiap status sebagai teks + ikon MaterialCommunityIcons + bentuk garis dari `core/i18n/status.ts`.
- **Do** tampilkan uang dengan `Money` (tabular, rata kanan) dan tulis nilai belum diketahui sebagai "—" + keterangan.
- **Do** tulis nomor dokumen dengan `Serial` (monospace, `serial`).
- **Do** taruh aksi utama di footer `Screen`, 48 dp minimum, `lg` 56 dp untuk tugas lapangan.
- **Do** tampilkan ply `DocumentStack` hanya sebanyak versi sebelumnya yang nyata, dan `Stamp` hanya saat status tercapai.
- **Do** biarkan teks mengikuti ukuran sistem dan biarkan grid sel turun ke satu kolom.

### Don't:
- **Don't** menulis hex mentah di layar atau memakai keluarga ikon lain / emoji sebagai ikon.
- **Don't** memakai kartu ikon-judul-angka seragam, angka hero tanpa transaksi, kartu bersarang, gradien/glass dekoratif.
- **Don't** menaruh kicker/eyebrow huruf kapital di atas judul; `label` hanya untuk sel/field/kolom.
- **Don't** memakai `serial` sebagai warna bahaya atau dekorasi.
- **Don't** menyembunyikan atau mengecilkan pita "DEMO — SIMULASI FRONTEND".
- **Don't** menambah bayangan di luar lembar depan `DocumentStack` dan snackbar, atau gerakan yang mengabaikan "kurangi gerakan".
