@AGENTS.md

## Catatan Claude Code

- Pekerjaan desain memakai skill Impeccable; kontrak permukaan aplikasi ada di `.impeccable/surfaces/mobile-src-app.md`. Konteks produk untuk skill: `docs/PRODUCT.md`.
- Screenshot native diambil dari emulator/HP Android lewat `adb exec-out screencap -p`, bukan dari browser. Simpan tangkapan mentah di `.impeccable/review/` (diabaikan Git) dan rangkum di `docs/QA_REPORT.md`.
- Peta (react-native-maps) hanya bisa diuji di Expo Go yang sudah login akun Expo, atau di development build yang dibangun ulang dengan API key Google Maps.
