---
name: Tovv
description: Super-app operasional towing dengan standar fintech Indonesia — header gradien biru merek, kartu membulat, angka uang tebal; satu bahasa desain native di Android dan iOS, tema terang dan gelap.
colors:
  # Palet terang (kunci sama dengan palet gelap di bawah; sumber: mobile/src/core/design/tokens.ts)
  accent: "#1136D6"
  accent-pressed: "#0C29A8"
  accent-soft: "#E8EEFF"
  accent-ink: "#1136D6"
  on-accent: "#FFFFFF"
  hero-from: "#0D2EC2"
  hero-to: "#1766D1"
  hero-glow: "#19B8F2"
  on-hero: "#FFFFFF"
  on-hero-secondary: "#E3ECFF"
  hero-chip: "rgba(255, 255, 255, 0.16)"
  brand-sky: "#19B8F2"
  bg: "#F4F6FA"
  surface: "#FFFFFF"
  surface-alt: "#EEF2F8"
  surface-pressed: "#E8EEFB"
  line: "#E3E8F0"
  line-strong: "#C3CDDB"
  ink: "#0E1726"
  ink-secondary: "#56657B"
  ink-muted: "#8D99AC"
  inverse: "#111A2B"
  on-inverse: "#FFFFFF"
  ok-ink: "#146C38"
  ok-wash: "#E2F5E9"
  warn-ink: "#8A5300"
  warn-wash: "#FFF1D6"
  danger-ink: "#B42318"
  danger-wash: "#FDECEA"
  neutral-ink: "#45556C"
  neutral-wash: "#EDF1F6"
  badge: "#E5372B"
  demo-ink: "#3A2C00"
  demo-wash: "#FFD84D"
  demo-rule: "#E9BE1F"
  shadow: "#0E1726"
  scrim: "rgba(7, 12, 24, 0.5)"
  overlay-ink: "rgba(14, 23, 38, 0.78)"
  legend-wash: "rgba(255, 255, 255, 0.9)"
  skeleton: "#E4E9F1"
  camera-ground: "#000000"
  # Palet gelap (sufiks -dark; demo-ink/demo-wash/demo-rule/on-accent/on-hero/camera-ground sama dengan terang)
  accent-dark: "#2F5EF5"
  accent-pressed-dark: "#244ED6"
  accent-soft-dark: "#18264A"
  accent-ink-dark: "#8EAEFF"
  hero-from-dark: "#0C1D5E"
  hero-to-dark: "#133C94"
  hero-glow-dark: "#1C8FD0"
  on-hero-secondary-dark: "#D3DEF7"
  hero-chip-dark: "rgba(255, 255, 255, 0.12)"
  brand-sky-dark: "#3CC6F5"
  bg-dark: "#0A0F17"
  surface-dark: "#141B26"
  surface-alt-dark: "#1B2431"
  surface-pressed-dark: "#1F2B3D"
  line-dark: "#253042"
  line-strong-dark: "#3B4A60"
  ink-dark: "#EDF1F7"
  ink-secondary-dark: "#A1AEC1"
  ink-muted-dark: "#66748A"
  inverse-dark: "#E9EEF6"
  on-inverse-dark: "#0E1726"
  ok-ink-dark: "#63D394"
  ok-wash-dark: "#11301E"
  warn-ink-dark: "#F4BC52"
  warn-wash-dark: "#33250A"
  danger-ink-dark: "#FF8F85"
  danger-wash-dark: "#3A1714"
  neutral-ink-dark: "#B6C2D2"
  neutral-wash-dark: "#1E2834"
  badge-dark: "#FF5A4E"
  shadow-dark: "#000000"
  scrim-dark: "rgba(0, 0, 0, 0.6)"
  overlay-ink-dark: "rgba(10, 15, 23, 0.82)"
  legend-wash-dark: "rgba(20, 27, 38, 0.9)"
  skeleton-dark: "#1E2836"
typography:
  display: { fontFamily: "system (Roboto / SF Pro)", fontSize: "30px", fontWeight: 800, lineHeight: "36px", letterSpacing: "-0.4px" }
  title: { fontFamily: "system (Roboto / SF Pro)", fontSize: "24px", fontWeight: 700, lineHeight: "30px", letterSpacing: "-0.2px" }
  headline: { fontFamily: "system (Roboto / SF Pro)", fontSize: "20px", fontWeight: 700, lineHeight: "26px" }
  titleSm: { fontFamily: "system (Roboto / SF Pro)", fontSize: "17px", fontWeight: 700, lineHeight: "22px" }
  body: { fontFamily: "system (Roboto / SF Pro)", fontSize: "16px", fontWeight: 400, lineHeight: "22px" }
  bodyStrong: { fontFamily: "system (Roboto / SF Pro)", fontSize: "16px", fontWeight: 600, lineHeight: "22px" }
  bodySm: { fontFamily: "system (Roboto / SF Pro)", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }
  label: { fontFamily: "system (Roboto / SF Pro)", fontSize: "13px", fontWeight: 600, lineHeight: "18px" }
  caption: { fontFamily: "system (Roboto / SF Pro)", fontSize: "12px", fontWeight: 400, lineHeight: "16px" }
  figure: { fontFamily: "system (Roboto / SF Pro)", fontSize: "17px", fontWeight: 700, lineHeight: "22px", fontFeature: "tnum" }
  figureLg: { fontFamily: "system (Roboto / SF Pro)", fontSize: "26px", fontWeight: 800, lineHeight: "32px", letterSpacing: "-0.3px", fontFeature: "tnum" }
  figureXl: { fontFamily: "system (Roboto / SF Pro)", fontSize: "32px", fontWeight: 800, lineHeight: "38px", letterSpacing: "-0.6px", fontFeature: "tnum" }
  mono: { fontFamily: "Menlo (iOS), monospace (Android)", fontSize: "13px", fontWeight: 500, lineHeight: "18px" }
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "28px"
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
  button-primary: { backgroundColor: "{colors.accent}", textColor: "{colors.on-accent}", typography: "{typography.bodyStrong}", rounded: "{rounded.md}", padding: "8px 16px", height: "48px" }
  button-primary-lg: { typography: "{typography.titleSm}", rounded: "{rounded.lg}", padding: "12px 16px", height: "56px" }
  button-primary-disabled: { backgroundColor: "{colors.ink-muted}" }
  button-secondary: { backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-ink}", typography: "{typography.bodyStrong}", rounded: "{rounded.md}", height: "48px" }
  button-quiet: { textColor: "{colors.accent-ink}", typography: "{typography.bodyStrong}", rounded: "{rounded.md}", height: "48px" }
  button-danger: { backgroundColor: "{colors.danger-wash}", textColor: "{colors.danger-ink}", typography: "{typography.bodyStrong}", rounded: "{rounded.md}", height: "48px" }
  button-on-hero: { backgroundColor: "{colors.hero-chip}", textColor: "{colors.on-hero}", typography: "{typography.bodyStrong}", rounded: "{rounded.md}", height: "48px" }
  button-compact: { rounded: "{rounded.pill}", padding: "0 12px", height: "40px" }
  button-disabled: { backgroundColor: "{colors.surface-alt}", textColor: "{colors.ink-muted}" }
  fab-extended: { backgroundColor: "{colors.accent}", textColor: "{colors.on-accent}", typography: "{typography.bodyStrong}", rounded: "18px", padding: "0 16px", height: "56px" }
  card: { backgroundColor: "{colors.surface}", rounded: "{rounded.lg}", padding: "16px" }
  hero-card: { backgroundColor: "{colors.surface}", rounded: "{rounded.xl}", padding: "16px" }
  order-card: { backgroundColor: "{colors.surface}", rounded: "{rounded.xl}", padding: "16px" }
  action-card: { backgroundColor: "{colors.surface}", rounded: "{rounded.lg}", padding: "14px" }
  icon-tile: { backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-ink}", rounded: "{rounded.lg}", size: "52px" }
  status-tag: { typography: "{typography.bodySm}", rounded: "{rounded.pill}", padding: "4px 10px" }
  status-tag-info: { backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-ink}" }
  field: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", typography: "{typography.body}", rounded: "{rounded.md}", padding: "0 14px", height: "52px" }
  field-error: { backgroundColor: "{colors.danger-wash}" }
  field-readonly: { backgroundColor: "{colors.surface-alt}" }
  choice-on: { backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-ink}", rounded: "{rounded.md}", height: "56px" }
  chip: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", typography: "{typography.bodySm}", rounded: "{rounded.pill}", padding: "0 14px", height: "40px" }
  chip-on: { backgroundColor: "{colors.accent}", textColor: "{colors.on-accent}" }
  segmented: { backgroundColor: "{colors.surface-alt}", textColor: "{colors.ink-secondary}", typography: "{typography.bodySm}", rounded: "{rounded.pill}", height: "48px" }
  segmented-pill: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.pill}", height: "42px" }
  root-header: { backgroundColor: "{colors.hero-from}", textColor: "{colors.on-hero}", typography: "{typography.display}", rounded: "{rounded.xxl}", padding: "16px 16px 20px" }
  detail-header: { backgroundColor: "{colors.bg}", textColor: "{colors.ink}", typography: "{typography.titleSm}", padding: "4px 12px 4px 8px", height: "64px" }
  header-icon-button: { backgroundColor: "{colors.hero-chip}", textColor: "{colors.on-hero}", rounded: "{rounded.pill}", size: "44px" }
  tab-bar: { backgroundColor: "{colors.surface}", textColor: "{colors.ink-secondary}", typography: "{typography.caption}", height: "64px" }
  tab-indicator: { backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-ink}", rounded: "{rounded.pill}", width: "60px", height: "30px" }
  bottom-sheet: { backgroundColor: "{colors.bg}", rounded: "{rounded.xxl}", padding: "8px 16px 16px" }
  toast: { backgroundColor: "{colors.inverse}", textColor: "{colors.on-inverse}", typography: "{typography.bodySm}", rounded: "{rounded.lg}", padding: "12px" }
  demo-strip: { backgroundColor: "{colors.demo-wash}", textColor: "{colors.demo-ink}", typography: "{typography.caption}", height: "40px" }
---

# Design System: Tovv

Sistem ini dicatat dari build yang dikirim: `mobile/src/core/design/tokens.ts` (dua palet `light`/`dark` berkunci sama, `space`, `radius`, `type`, `duration`, `elevation()`, `cardChrome()`), `theme.tsx` (`ThemeProvider`, `useColors`, `makeStyles`), `motion.ts`, `core/i18n/status.ts`, `components/**`, dan tangkapan emulator Android terang + gelap di `.impeccable/review/final/`. Kontrak permukaan: [`.impeccable/surfaces/mobile-src-app.md`](../.impeccable/surfaces/mobile-src-app.md) (seed 99bfc5b6111de108), yang menggantikan seluruh dunia "Nota Rangkap" yang ditolak. Konteks produk: [PRODUCT.md](PRODUCT.md). Frontmatter bersifat normatif; satuan px berarti dp/pt di React Native; kunci berakhiran `-dark` adalah nilai palet gelap untuk token yang sama.

## Overview

**Creative North Star: "Kartu Saldo Super-App"**

Tovv memakai bahasa yang sudah dikenal pengguna Indonesia dari Gojek/GoPay, Grab/Tokopedia, dan Bank Jago/Jenius: header gradien biru merek di puncak layar akar, kartu ringkasan putih yang melayang menimpa tepi bawah header dengan satu angka uang besar, grid pintasan berikon, lalu daftar kartu membulat. Setiap kartu menjawab satu pertanyaan dalam bahasa sehari-hari dan dapat diketuk untuk diselesaikan.

Biru merek diturunkan dari logo Solveit (#1136D6 → #19B8F2). Gradien hanya hidup di header; isi layar duduk di latar dingin dengan kartu putih (terang) atau permukaan biru-arang (gelap). Tema mengikuti sistem kecuali pengguna memilih lain di Lainnya → Tampilan; kedua palet berkunci sama dan diuji kontrasnya. Font sistem, satu keluarga ikon (MaterialCommunityIcons) dalam tile ikon membulat, salinan dua bahasa (Indonesia sumber, Inggris lewat `core/i18n`) yang ditulis seperti orang berbicara. Navigasi, back gesture, safe area, keyboard dan ukuran teks tetap native.

Gerak terasa fisik tetapi pendek: header bergerak setengah kecepatan saat digulir lalu menyerahkan judul ke bar ringkas, kartu masuk bertahap, kartu yang ditekan turun dan miring halus ke arah jari, angka ringkasan menghitung naik sekali, pil tab meluncur. Semua di UI thread (Reanimated); "kurangi gerakan" berarti tanpa gerak.

**Key Characteristics:**
- Header gradien biru (diagonal `heroFrom` → `heroTo`, cahaya `heroGlow` di kanan atas) dengan sudut bawah 28, hanya di layar akar.
- Kartu ringkasan menimpa header (−72 dp), angka uang `figureXl` tabular yang menghitung naik sekali.
- Kartu membulat 16–20: bayangan lembut ke bawah di terang, garis tipis `line` di gelap.
- Status = teks + ikon + bentuk garis (utuh/putus-putus/coret) dalam chip pil; warna hanya penguat.
- Pita kuning "DEMO — SIMULASI FRONTEND" permanen di atas semua layar, sama di kedua tema.

## Colors

Satu biru merek dengan tonal wash, netral biru-dingin, empat pasangan status ink/wash, dan kuning DEMO yang tidak ikut berganti tema.

### Primary
- **Biru Solveit** (`accent`): tombol primary, FAB, chip terpilih, radio/fokus field, garis tahap yang sudah terjadi, kursor input. Di gelap diangkat menjadi biru yang lebih terang (`accent-dark`) agar tetap hidup di permukaan gelap. `accentPressed` untuk tekan.
- **Wash Biru** (`accentSoft`): tombol secondary, tile ikon default, pil indikator tab, segmen/choice aktif, kotak "Berikutnya" di kartu pekerjaan, hitungan di SectionTitle.
- **Tinta Biru** (`accentInk`): teks/ikon biru di atas permukaan atau wash. Di terang sama dengan `accent`; di gelap menjadi biru pucat (`accent-ink-dark`) karena biru jenuh tidak terbaca di `surface-dark`.

### Secondary
- **Gradien Header** (`heroFrom` → `heroTo`, cahaya `heroGlow`): hanya `HeroBackground` (RootHeader, bar ringkas, layar sambutan). Ujung gradien dibatasi agar teks `onHero` ≥ 4,5:1. Teks sekunder di atasnya `onHeroSecondary`; tombol/ikon di atasnya `heroChip` (putih tembus).
- **Biru Langit** (`brandSky`): hanya "v" kedua wordmark di atas header.

### Tertiary
- **Kuning DEMO** (`demoWash`, `demoInk`, `demoRule`): pita DEMO; nilai identik di kedua tema.
- **Merah Badge** (`badge`): titik hitungan notifikasi/tab/pintasan, berbingkai 2 dp warna latar di bawahnya.

### Neutral
- **Latar Dingin** (`bg`) untuk layar, detail header, bottom sheet; **Permukaan** (`surface`) untuk kartu, field, tab bar, footer; **Permukaan Alt** (`surfaceAlt`) untuk track segmen, field read-only, tombol ikon di header detail, skema rute; `surfacePressed` untuk wash tekan.
- **Garis** (`line`) untuk pembatas, border field/chip, bingkai kartu di gelap; **Garis Tegas** (`lineStrong`) untuk radio kosong, grabber, total, track toggle.
- **Tinta** (`ink`), **Tinta Sekunder** (`inkSecondary`, label dan metadata), **Tinta Redup** (`inkMuted`, chevron, placeholder, disabled).
- **Inverse** (`inverse`/`onInverse`): toast, chip "Offline", pita QR.
- **Pasangan status** `okInk/okWash`, `warnInk/warnWash`, `dangerInk/dangerWash`, `neutralInk/neutralWash` (info memakai `accentInk/accentSoft`): ink selalu di atas wash-nya sendiri; juga mewarnai tile ikon pintasan dan tingkat ActionItem.
- Utilitas: `shadow` (sumber warna bayangan), `scrim`, `overlayInk`, `legendWash`, `skeleton`, `cameraGround`.

### Named Rules
**The Same Keys Rule.** Palet terang dan gelap memiliki kunci yang identik (`Palette` diketik dari `light`); layar dan komponen hanya membaca `useColors()`/`makeStyles`, tidak pernah hex mentah. Pasangan teks diuji ≥ 4,5:1 di `tokens.test.ts`.
**The Header-Only Gradient Rule.** Gradien biru hanya dipakai `HeroBackground` di header akar dan bar ringkasnya; kartu, tombol dan latar isi selalu warna datar.
**The Ink-On-Own-Wash Rule.** Warna status muncul sebagai pasangan ink di atas wash-nya; tidak ada teks status berwarna di atas permukaan putih tanpa ikon dan label.

## Typography

**Display/Body Font:** font sistem (Roboto di Android, SF Pro di iOS).
**Data Font:** Menlo (iOS) / monospace (Android) hanya untuk `mono` (nomor dokumen lewat `Serial`, URI, ref).

**Character:** sans sistem yang tebal di puncak (800 untuk sapaan dan angka uang) dan tenang di isi; hierarki dibawa ukuran dan berat, bukan huruf kapital.

### Hierarchy
- **Display** (800, 30/36, −0.4): judul/sapaan header akar ("Halo, Raka", "Pekerjaan"), layar sambutan.
- **Title** (700, 24/30, −0.2): judul kartu tugas utama driver.
- **Headline** (700, 20/26): `SectionTitle`, judul bottom sheet.
- **TitleSm** (700, 17/22): judul DetailHeader, kode pekerjaan di kartu, judul bar ringkas, label tombol `lg`, judul ErrorBlock.
- **Body / BodyStrong** (400/600, 16/22): isi, field, judul baris, label tombol `md` dan FAB.
- **BodySm** (400, 14/20): alasan, status tag, segmen, chip, subjudul header, toast.
- **Label** (600, 13/18, huruf biasa): menamai nilai di bawahnya (field, kotak `Cell`, angka di HeroCard, kepala kolom).
- **Caption** (400, 12/16): metadata, waktu, helper, label pintasan (600), label tab.
- **Figure / FigureLg / FigureXl** (700/800/800, 17/22, 26/32, 32/38, tabular): nominal rupiah lewat `Money`/`CountUpMoney`; `figureXl` untuk angka utama HeroCard.
- **Mono** (500, 13/18): nomor dokumen dan ref.

### Named Rules
**The Sentence-Case Label Rule.** `label` ditulis huruf biasa dan selalu menamai nilai di bawahnya; tidak ada kicker/eyebrow kapital di atas judul.
**The Unlocked Size Rule.** Ukuran teks mengikuti pengaturan sistem; `maxFontSizeMultiplier` (1,2–1,4) hanya untuk pita DEMO, badge, cap hasil dan legenda yang sempit.

## Layout

- Ritme 4 dp (`space`): padding layar horizontal `lg` (16), padding kartu `lg` (16; ActionItem 14), jarak antar kartu `sm`–`md` (8–12), SectionTitle 28 di atas dan 12 di bawah.
- **Layar akar** (`Screen headerScrolls`): pita DEMO terpaku di atas; RootHeader ikut bergulir dengan parallax; `overlap` menambah 56 dp di bawah header dan HeroCard naik −72 dp menimpanya; lalu ShortcutGrid 4 kolom (tile 52), lalu bagian kartu. Bar ringkas 52 dp bergradien muncul saat header hampir hilang.
- **Aksi utama**: owner = extended FAB 56 dp di kanan bawah (16 dp dari tepi, di atas footer bila ada) yang menyusut menjadi ikon saat menggulir turun; pelanggan = tombol penuh di dalam HeroCard; driver = tombol langkah berikutnya di kartu tugas. Layar detail memakai footer putih bergaris atas di area ibu jari yang naik bersama keyboard.
- Lebar isi maksimal 720 dp di tablet/lanskap, terpusat; header tetap selebar layar.
- Target sentuh minimum `touch.min` 48 dp di kedua OS; tombol `lg` 56 dp; tombol ikon 44 dp + margin ke 48.
- `CellGrid` 2 kolom dapat turun ke 1 kolom saat teks diperbesar.
- Tab bawah per peran (`RoleTabs`), tinggi 64 + inset bawah.

## Elevation & Depth

Hibrida berdasarkan tema. Di terang, permukaan terangkat dengan bayangan lembut berarah ke bawah dari `elevation(level)` (RN `boxShadow`, warna `shadow`); di gelap bayangan hampir tak terlihat sehingga `cardChrome()` menggantinya dengan garis 1 dp `line`. Kartu bertone status (`warn`/`danger`/`ok`/`info`) tidak berbayangan: wash-nya sendiri sudah cukup memisahkan. Scrim bottom sheet `scrim`.

### Shadow Vocabulary
- **Rendah** (`boxShadow: 0px 2px 10px rgba(14,23,38,0.07)`, level 1): Card, ActionItem, OrderRow, Cell, tombol primary.
- **Sedang** (`boxShadow: 0px 6px 18px rgba(14,23,38,0.10)`, level 2): HeroCard, lembar depan DocumentStack.
- **Tinggi** (`boxShadow: 0px 10px 26px rgba(14,23,38,0.18)`, level 3): FAB, toast (tetap berbayangan di gelap dengan `shadow` hitam).

### Named Rules
**The Shadow-Light, Line-Dark Rule.** Permukaan kartu selalu memakai `cardChrome(c, scheme, level)`: bayangan di terang, garis `line` di gelap; jangan menulis bayangan per layar.
**The One Card Level Rule.** Satu tingkat kartu: tidak ada kartu di dalam kartu. Panel tonal di dalam kartu (kotak "Berikutnya", tile ikon) boleh, kartu berbayangan tidak.

## Shapes

Membulat dan ramah. `md` 12 untuk tombol, field, choice, kotak "Berikutnya", tile ikon kecil; `lg` 16 untuk Card, ActionItem, Cell, tombol `lg`, toast, tile ikon ≥ 48, QR, skema rute; `xl` 20 untuk HeroCard dan OrderRow; `xxl` 28 untuk sudut bawah RootHeader dan sudut atas bottom sheet; `pill` untuk chip status, chip filter, segmen, indikator tab, tombol compact, tombol ikon bulat, badge. FAB 18. Border field/chip/choice 1,5, fokus field 2 `accent`; chip status 1,25.

Bentuk garis membawa arti status di seluruh sistem: **utuh** = final/sudah terjadi, **putus-putus** = menunggu/provisional (chip status, tahap menunggu sinkron, ruas tahap yang belum, bingkai QR internal, tile foto kosong), **coret** (line-through) = batal/tidak berlaku.

## Components

### Buttons
Tegas dan membulat, turun saat ditekan.
- **Shape:** `md` 12, min 48 dp; `lg` 56 dp dengan `lg` 16; `compact` 40 dp pil dengan hitSlop 6.
- **Primary:** `accent` terisi, teks `onAccent`, bayangan level 1; `lg` primary memberi haptic ringan.
- **Secondary / Quiet / Danger / OnHero:** wash `accentSoft` dengan `accentInk`; transparan dengan `accentInk`; wash `dangerWash` dengan `dangerInk`; `heroChip` dengan garis putih tembus di atas header.
- **Press:** `PressableScale depth="subtle"` (skala 0,96, pegas `pressSpring`); "kurangi gerakan" = redup 25%.
- **Disabled/Loading:** primary `inkMuted` tanpa bayangan; lainnya `surfaceAlt` dengan teks `inkMuted`; loading menampilkan spinner dan `busy`.

### Extended FAB
`accent`, ikon 24 + label `bodyStrong`, tinggi 56, sudut 18, bayangan level 3, masuk dengan zoom pegas. Label menyusut ke lebar 0 saat menggulir turun (220 ms) dan kembali saat menggulir naik.

### Chips
- **Status tag:** pil, wash + ink per tone, ikon 15 (13 untuk `sm`) + teks `bodySm` 600; border sewarna wash bila utuh, ink putus-putus bila menunggu, teks dicoret bila batal. Label aksesibilitas menambah "belum final"/"tidak berlaku".
- **ChipRow (filter):** pil 40 dp di atas `surface` bergaris `line`; terpilih `accent` terisi dengan centang `onAccent`.
- **Chip tingkat/keterangan** (ActionItem, "Ada tagihan terbuka"): pil wash tanpa ikon, `caption` tebal.
- **Cap hasil (`Stamp`):** pil wash dengan ikon 22 dan teks hasil (DISETUJUI, DITOLAK, …) `label` 800; hanya dirender saat status tercapai, masuk dengan zoom pegas sekali.

### Cards / Containers
- **Card:** `surface`, `lg` 16, padding 16, `cardChrome` level 1; varian tone memakai wash tanpa bayangan; dapat ditekan dengan tekan 3D dan masuk bertahap (`enterIndex`).
- **HeroCard:** `xl` 20, padding 16, gap 12, level 2, menimpa header −72; isi: `label` + `CountUpMoney figureXl` + caption periode, lalu `HeroStats` (sub-angka dipisah garis `line`).
- **OrderRow:** `xl` 20, padding 16; kode `titleSm` + status tag `sm`, pelanggan, rel rute (titik cincin `accent` → penanda `dangerInk`), `StageTicks`, meta jam, lalu kotak "Berikutnya" `accentSoft`/`accentInk` atau keterangan pasif.
- **ActionItem:** `lg` 16, padding 14; tile ikon tingkat 40, judul, alasan, chip tingkat + tenggat, PIC, nominal, chevron. Tanpa tombol "selesai".
- **Cell / LineItem / Money:** kotak angka min 84 dp di `surface`; baris label kiri–nilai kanan (≤ 55%); `Money` tabular, `null` → "—" + caption `warnInk`, tidak pernah nol.
- **Press 3D (`PressableScale depth="card"`):** skala 0,975 dan rotateY hingga 4° ke arah jari, perspektif 900.

### Inputs / Fields
Label `label` di atas, kotak `surface` bergaris `line` 1,5, `md` 12, min 52 dp, padding 14; fokus garis `accent` 2; galat garis `dangerInk` di atas `dangerWash` + ikon dan caption yang diumumkan; read-only `surfaceAlt`. `MoneyField` berawalan "Rp", digit tabular, kosong = `null`. `Choice` = kartu radio 56 dp, aktif garis `accent` + `accentSoft`. `Toggle` = Switch native dengan track `accent`/`lineStrong`. `Segmented` = track pil `surfaceAlt`, pil aktif meluncur (`glideSpring`; di gelap `accentSoft` bergaris `accent`).

### Navigation
- **RootHeader:** gradien `HeroBackground`, `display` `onHero` atau wordmark, subjudul `bodySm` `onHeroSecondary`, tombol ikon bulat 44 `heroChip` dengan badge. Parallax setengah kecepatan, isi memudar dan turun 28 dp dalam 140 dp gulir, meregang saat ditarik.
- **DetailHeader:** di atas `bg`, tombol kembali bulat `surfaceAlt`, judul `titleSm`, nomor dokumen dan konteks di `caption`. Back gesture OS tetap aktif.
- **RoleTabs:** tab bar `surface` bergaris atas `line`; ikon 22 outline → terisi saat aktif dengan pil `accentSoft` 60×30 yang mekar (`glideSpring`); aktif `accentInk`, tidak aktif `inkSecondary`; badge `badge`.
- **BottomSheet:** latar `bg`, sudut atas 28, grabber 40×5 `lineStrong`, judul `headline` + tombol tutup; scrim dan back Android menutup.

### Feedback
- **Toast:** `inverse`, `lg` 16, tile ikon bulat 32 tone ok/danger/info, `bodySm` `onInverse`, bayangan level 3; muncul di bawah pita DEMO (bukan area ibu jari), diumumkan ke pembaca layar.
- **LoadingBlock:** kerangka baris (tile 44 + dua bar) berwarna `skeleton` yang berdenyut pelan (750 ms) hanya selama memuat; tanpa denyut saat "kurangi gerakan".
- **ErrorBlock / EmptyBlock:** tile ikon bulat 56 (danger / netral), judul, isi, tombol compact secondary "Coba lagi".

### Akun (masuk, daftar, lupa kata sandi)
- **AuthShell:** latar `HeroBackground` penuh dengan wordmark 40, judul `display` `onHero` dan subjudul `onHeroSecondary`; kartu isi `bg` bersudut atas 28 yang naik 80 dp dari bawah sambil tegak dari kemiringan 14° (`perspective` 1000, pegas damping 18). Saat digulir, judul bergerak 0,45× kecepatan dan memudar.
- **Masuk:** field email dan kata sandi dengan ikon dan tombol tampil/sembunyi, tautan "Lupa kata sandi?", tombol `lg`, pemisah "atau coba akun demo", tiga tile akun cepat (Owner/Driver/Pelanggan), catatan kuning `demoWash` berisi kata sandi demo.
- **Lupa kata sandi:** setelah dikirim, tile ikon bulat 72 `okWash` muncul dengan pegas dan teks yang tidak membocorkan apakah email terdaftar.

### Splash
`SplashOverlay` menutupi aplikasi ±1,4 detik saat dibuka: gradien merek, wordmark 64 muncul dengan pegas (skala 0,7 → 1), garis `brandSky` 120×4 melintas 700 ms, lalu lapisan membesar 6% dan memudar 320 ms. Pil DEMO tetap tampil. "Kurangi gerakan" = pudar singkat.

### Peta langsung
- Peta bawaan OS (react-native-maps) penuh layar; tema gelap memakai gaya peta redup (Android) / `userInterfaceStyle` (iOS). Tempat usaha dan transit disembunyikan.
- **Header mengambang:** kartu `surface` sudut `xl`, bayangan level 3, judul `headline`, titik status berdenyut (`okInk` langsung / `warnInk` lama) dengan teks "Langsung · diperbarui tiap 3 detik · posisi simulasi", chip filter unit untuk owner, tombol lokasi saya 48 untuk driver.
- **Penanda truk:** lingkaran 38 (46 saat dipilih) bergaris putih 3, isi `accent` (bertugas) / `okInk` (siap) / `neutralInk` (tidak beroperasi), tag kode unit di bawahnya; posisi lama digambar putus-putus `warnInk`. Meluncur 2,6 detik ke posisi baru.
- **Rute:** garis putus-putus `lineStrong` jemput → tujuan, ruas yang sudah ditempuh utuh `accent` 5; jemput = cincin `accent`, tujuan = pin `dangerInk`.
- **Karosel kartu:** kartu `surface` sudut `xl` lebar layar − 56, digeser dengan snap; mengetuk penanda menggulir ke kartunya, menggeser kartu memindahkan kamera. Kartu pekerjaan memuat progres 8 dp, perkiraan tiba, atau alasan lokasi belum tampil.

### Pelacakan & Dokumen
- **StageLine / StageTicks:** penanda 22 dp: selesai = lingkaran `accent` bercentang, sekarang = cincin `accent` 3 dengan titik, menunggu sinkron = putus-putus `warnInk` di atas `warnWash`, belum = cincin `lineStrong`; ruas utuh hanya antara tahap yang sudah terjadi. Versi ringkas: ruas pil 6 dp per tahap.
- **DocumentStack:** versi aktif sebagai kartu level 2; maksimal 3 versi lama mengintip di belakang (offset 6 dp, menyempit 8 dp per tingkat), sejumlah versi sebelumnya yang nyata; pil `accentSoft` "N versi sebelumnya" membuka riwayat.
- **RouteSchematic:** skema di atas grid 24 dp `surfaceAlt`, jalur sisa putus-putus, legenda pil `legendWash` "bukan peta jalan".
- **InternalQr:** bingkai putus-putus `lineStrong`, pita `inverse` "QR INTERNAL TOVV · BUKAN QRIS".
- **PhotoTile:** pelat bergaris berlabel SIMULASI untuk fixture; kosong = putus-putus `accent` di atas `accentSoft`.
- **DemoStrip:** pita `demoWash` permanen, tinggi 40 + hitSlop 4 = 48 dp, ikon labu + "DEMO — SIMULASI FRONTEND" 800 + peran + usaha + pil "Ganti"; membuka pemilih akun demo lokal.

### Motion
Durasi `fast` 140, `base` 240, `slow` 360, `count` 700 ms; `easeOut` eksponensial untuk kemunculan, `easeInOut` kubik untuk denyut kerangka; pegas `pressSpring` (damping 18, stiffness 320, mass 0,6) untuk tekan dan `glideSpring` (20, 220, 0,8) untuk indikator. Masuk bertahap `useEnter`: naik 12 dp + memudar 360 ms, jeda 60 + 45 × indeks, hanya 8 item pertama. Scroll-trigger `useScrollReveal`: kartu yang awalnya di bawah layar naik 24 dp, skala 0,97 → 1, dan opasitas 0,35 → 1 dalam 140 dp pertama setelah masuk layar; yang sudah terlihat saat layar dibuka tidak dianimasikan. Hanya Reanimated/native; `useMotionDuration` dan `useReducedMotion` mematikan gerak. Tidak ada loop dekoratif.

### Identitas
Wordmark "tovv" **SEMENTARA** (`components/brand/wordmark.tsx`, SVG; "v" kedua `brandSky` di header, `accentInk` di permukaan terang) karena logo resmi belum tersedia; ganti komponen ini saat logo diterima. Logo Solveit Indonesia hanya di layar Tentang.

## Do's and Don'ts

### Do:
- **Do** ambil setiap warna dari palet aktif (`useColors`/`makeStyles`) dan tambahkan token baru ke `light` dan `dark` sekaligus dengan kunci yang sama.
- **Do** bungkus permukaan kartu dengan `cardChrome()` (bayangan di terang, garis di gelap) dan sudut `lg`/`xl`.
- **Do** bawa setiap status sebagai teks + ikon MaterialCommunityIcons + bentuk garis dari `core/i18n/status.ts`.
- **Do** tampilkan uang dengan `Money`/`CountUpMoney` (tabular) dan tulis nilai belum diketahui sebagai "—" + keterangan.
- **Do** pakai tile ikon membulat dengan pasangan ink/wash untuk pintasan dan baris daftar.
- **Do** buat elemen yang dapat ditekan lewat `PressableScale` dan gerak lewat `motion.ts` agar "kurangi gerakan" dihormati.
- **Do** jaga target sentuh minimum 48 dp dan biarkan teks mengikuti ukuran sistem.

### Don't:
- **Don't** menulis hex mentah di layar atau memakai keluarga ikon lain / emoji sebagai ikon.
- **Don't** memakai gradien di luar header akar dan bar ringkasnya, atau kartu di dalam kartu.
- **Don't** menaruh kicker/eyebrow kapital di atas judul; `label` hanya menamai nilai.
- **Don't** menyampaikan status hanya dengan warna.
- **Don't** menyembunyikan, mengecilkan atau mewarnai ulang pita "DEMO — SIMULASI FRONTEND" per tema.
- **Don't** menambah gerak yang berjalan di JS thread, berulang tanpa alasan, atau mengabaikan "kurangi gerakan".
