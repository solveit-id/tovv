# Inventaris layar dan cakupan requirement — tahap frontend

Label status:

- **Tersedia (frontend)** — layar interaktif selesai, data dan aturan disimulasikan adapter demo bertipe; *bukan* bukti backend.
- **Disimulasikan** — pengalaman tersedia, tetapi kemampuan inti (perangkat/provider/server) diganti simulasi berlabel.
- **Belum** — belum dikerjakan pada tahap ini.

Semua requirement di bawah tetap **NOT_RUN/BLOCKED** untuk gate PRD (G7-A/G7-B) karena backend, database, otorisasi server dan bukti perangkat lengkap belum ada.

## Layar

| Layar (route) | Peran | Requirement utama | Status |
|---|---|---|---|
| Mulai (`/mulai`), Pilih akun demo (`/demo`) | semua | PRO-01, TEN-07 (konteks eksplisit) | Tersedia — pemilih akun **hanya mode demo**, bukan TEN-04 |
| Beranda owner (`/owner`) | owner | FIN-05, ANA-02, TEN-07 | Tersedia |
| Pekerjaan (`/owner/pekerjaan`, `/admin/permintaan`, `/customer/pesanan`) | owner/admin/customer | ORD, MOB-01 | Tersedia |
| Keuangan/laporan (`/owner/keuangan`, `/reports`) | owner/finance | ANA-01–04, FIN-06, BIZ-08, RPT-02 | Tersedia (CSV dibagikan lewat share sheet); PDF REP-01–04 **Belum** (server T-30) |
| Beranda admin (`/admin`) | dispatcher/finance | FIN-05, FIN-04 | Tersedia |
| Jadwal & armada (`/admin/jadwal`, `/fleet`) | dispatcher/owner | FLT-01, FLT-04 | Tersedia (registry baca; CRUD unit **Belum**) |
| Antrean finance (`/admin/keuangan`, `/finance/queue`) | finance/owner | PAY-02, PAY-11 | Tersedia |
| Biaya & uang jalan (`/finance/expenses`, `/driver/biaya`) | finance/driver | FIN-01, QTE-08 | Tersedia (settlement uang muka sebagai tampilan F-08; input pengembalian **Belum**) |
| Permintaan baru (`/request/new`) | admin/customer | ORD-01–05 | Tersedia (titik lokasi sintetis; pencarian alamat/peta **Disimulasikan**) |
| Detail permintaan (`/request/[id]`) | admin/owner/customer | ORD-02, BIZ-03, QTE-04 | Tersedia |
| Susun penawaran (`/request/[id]/quote`) | owner/admin berdelegasi | QTE-01–07, FLT-02/03/06/09 | Tersedia |
| Hitung harga (`/pricing`) | owner/admin | QTE-01–03 (F-01/F-02) | Tersedia |
| Penawaran pelanggan (`/quote/[id]`) | customer/approver | QTE-04/05, BIZ-02/05 | Tersedia |
| Detail pekerjaan (`/order/[id]`) | semua (isi per peran) | OPS-01/05, QTE-06, FLT-05, ORD-06, TEN-03 | Tersedia |
| Penugasan (`/order/[id]/assign`) | dispatcher/owner | FLT-05 | Tersedia |
| Perjalanan (`/order/[id]/tracking`) | customer/owner | OPS-02/06, NFR-04 | **Disimulasikan** (replay F-06, skema rute; tracking perangkat/realtime Belum) |
| Kamera GPS (`/camera`) | driver/customer/staf | CAM-01–05 | Tersedia memakai kamera & lokasi perangkat bila diizinkan; upload server **Disimulasikan** |
| Bukti & perbandingan (`/order/[id]/evidence`) | semua berhak | OPS-04, CAM-02/03/06 | Tersedia (fixture berlabel SIMULASI) |
| Serah-terima (`/order/[id]/handover`) | driver | OPS-04, SUB-02 | Tersedia |
| Invoice (`/invoice/[id]`) | finance/payer | PAY-01/05/09/10, PAY-12 | Tersedia (QR internal `tovv-demo://`, bukan QRIS) |
| Kirim bukti (`/invoice/[id]/proof`) | customer/assisted | PAY-02/12 | Tersedia |
| Pemeriksaan bukti (`/proof/[id]`) | finance/owner | PAY-11, PAY-05 | Tersedia |
| Permintaan pembayaran (`/payment-request/[id]`, deep link) | payer/finance | PAY-10, MOB-02 | Tersedia (deep link skema `tovv-demo`) |
| Tagihan pelanggan (`/customer/tagihan`) | customer/B2B finance | BIZ-06, PAY-02 | Tersedia |
| Delegasi (`/delegations`) | owner | FIN-04 | Tersedia |
| Pelanggan bisnis (`/business`) | owner/admin/B2B | BIZ-01–06, BIZ-08 | Tersedia (baca; edit rate card **Belum**) |
| Paket SaaS (`/saas`) | owner | SUB-01–06 | Tersedia (preview DEMO, tanpa checkout) |
| Akses dukungan (`/support-access`) | owner | TEN-05, ADM-01 | **Disimulasikan** (ADMIN STUB; Solveit Admin aktual BLOCKED) |
| Kotak masuk (`/inbox`) | semua | MOB-05 | **Disimulasikan** (push perangkat Belum) |
| Antrean sinkronisasi (`/sync`, `/driver/sinkron`) | semua | OPS-03, MOB-03, NFR-06 | Tersedia (outbox lokal persisten; server **Disimulasikan**) |
| Mode demo & tentang (`/about`) | semua | PRO-01, NFR-08 | Tersedia |

## Alur terhubung

permintaan → estimasi/penawaran → persetujuan → pemilihan unit → penugasan → perjalanan/dokumentasi → serah-terima → invoice → bukti menunggu pemeriksaan → receipt demo → ringkasan: **tersedia ujung ke ujung di adapter demo** dan diuji `mobile/src/data/api/demo-api.test.ts`.

| Kasus penting | Di mana terlihat |
|---|---|
| Order telepon tanpa aplikasi customer | Admin → Catat permintaan (kanal telepon, persetujuan dicatat) |
| Owner merangkap driver + delegasi terbatas | owner-A: tombol "Masuk mode driver" (A06); admin-A1 delegasi 8 jam/Rp 100.000; admin-A2 tanpa delegasi → eskalasi |
| Unit terdekat tidak layak | Susun penawaran: U1 1.500 kg < 1.800 kg, U3 out of service; P1 posisi lama |
| Penawaran berubah | Lembar rangkap versi; v1 DIGANTI; A13 kedaluwarsa di C0 |
| Penugasan ditolak/diganti | A07: driver-A1 menolak, driver-A2 ditawari; alihkan dari layar Penugasan |
| Penerima belum siap | A06: kendala terbuka, PIC admin-A1 |
| Tambahan biaya belum disetujui | A06: Rp 200.000 pending; tidak masuk invoice sampai disetujui |
| Kamera vs galeri, GPS ditolak/stale, upload tertunda | Kamera: label impor galeri, lokasi tidak tersedia/lama/manual, antrean sinkronisasi |
| Penyimpanan penuh | Mode demo → Penyimpanan penuh: foto tidak dinyatakan tersimpan |
| Parsial, lebih bayar, penolakan bukti, piutang | A02 sebagian, A03 unapplied Rp 200.000, A04 ditolak, B03 flagged; piutang Rp 2,2 jt / 2,4 jt |
| Kontribusi provisional | A04 (biaya belum final), B03 (berkeberatan) tampil provisional, bukan nol |

## Belum dikerjakan pada tahap ini (tetap scope PROTO)

Backend Laravel/MySQL dan seluruh otorisasi server (TEN-01/02, NFR-01/05), login perangkat nyata (TEN-04), transaksi atomik dan race test MySQL (FLT-04, PAY-11), tracking perangkat latar belakang dan realtime Reverb (OPS-02, NFR-03), push notification (MOB-02/05), PDF server (RPT-01), upload media ke storage privat (CAM-04/06 sisi server), Solveit Admin aktual (ADM-01–04), backup/restore (NFR-07), observability (NFR-10), pengukuran performa release (NFR-12), CRUD registry armada dan rate card, mode gelap.
