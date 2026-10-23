# TEST_PLAN — Tovv

## Provenance, versi dan batas bukti

Paket **2.1 — 21 Oktober 2026**. Produk **Tovv**; pemilik, pengembang dan penerbit **Solveit Indonesia**. Status dokumen: spesifikasi/rencana; bukan bukti aplikasi sudah dibuat atau diuji.

Baseline yang benar-benar dibaca: PRD v2.0 (file sumber PRD(2).md, identik dengan salinan PRD (1).md), ARCHITECTURE, IMPLEMENTATION_PLAN, INTEGRATION_PLAN dan TEST_PLAN masing-masing berlabel v1.0 dengan acuan PRD v2.0. Tidak ditemukan versi lebih baru. VALIDATION_PLAN.md tidak ditemukan setelah pencarian nama; dokumen itu **disusun kembali**, bukan hasil pemeriksaan file lama. Pesan pengguna terbaru mengungguli baseline. Seluruh enam dokumen kini memakai versi paket 2.1.

Urutan baca: [PRD](PRD.md) → [ARCHITECTURE](ARCHITECTURE.md) → [INTEGRATION_PLAN](INTEGRATION_PLAN.md) → [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) → [TEST_PLAN](TEST_PLAN.md) → [VALIDATION_PLAN](VALIDATION_PLAN.md). PRD menguasai scope/aturan bisnis; kontrak dan model harus mematuhinya. Perubahan mengharuskan pembaruan requirement, task, test, fixture dan keputusan terkait pada paket yang sama.
## Catatan implementasi (23 Oktober 2026)

Register skenario TC di bawah tetap **NOT_RUN** untuk backend, database, dan perangkat. Yang sudah berjalan adalah uji Jest di `mobile/` (1.292 uji): oracle F-09, rumus harga, ledger, analytics, alur adapter demo per peran, login demo, cakupan peta per peran, kontras warna dua tema, dan kelengkapan kamus terjemahan. Uji ini memeriksa logika frontend/adapter, bukan klaim lulus TC. Bukti layar ada di `docs/QA_REPORT.md`.

## 1. Status, risiko dan bukti

Seluruh test aplikasi **NOT_RUN**. PASS hanya jika actual result cocok expected dengan bukti, FAIL jika menyimpang, BLOCKED jika dependency spesifik belum tersedia. NEXT adalah DEFERRED, bukan PASS/N/A untuk platform wajib. Mode bukti PRD §2 terpisah dari outcome. Kode tersedia ≠ verified-local ≠ verified-device ≠ verified-admin. Pemeriksaan konsistensi dokumen tidak meluluskan test aplikasi.

S0: kebocoran tenant/personal data, uang nyata tak disengaja, kehilangan ledger. S1: double booking/receipt, salah harga/saldo, kehilangan foto pending, core flow gagal. S2: fungsi sekunder/UX, S3: kosmetik. S0/S1 memblokir gate fitur terkait dan presentasi yang mengandalkannya. Bukti harus menyebut test_id, requirement, fixture+generation, exact commit/build/OS/device/mode, command/langkah, expected, actual, timestamp, artifact path, defect/limitation. Tidak ada secret atau lokasi peserta pada proposal publik.

## 2. Lingkungan, command target dan metode

Backend PHPUnit/Pest mengikuti repo; integration dan concurrency memakai MySQL8.4 dengan dua koneksi/barrier independen, ulang20x untuk race utama. Jangan mengganti race dengan unit test sequential. Mobile runner/RN Testing Library/Maestro dipilih kompatibel T-01; native permission/background tetap manual device. Playwright untuk harness dan Admin aktual dua suite berbeda. Contract OpenAPI lint/schema, load k6/setara, independent integer oracle untuk formula.

Script target yang harus dibuat: backend `composer test:unit`, `composer test:integration`, `composer test:concurrency`; mobile `npm run typecheck`, `npm run test:unit`; contracts `npm run lint`, `npm run test`; admin-harness `npm run test:e2e`; tools demo seed/reset/restore dengan environment guard. Ini interface rencana, bukan klaim command tersedia/berhasil. Tidak ada script payment sandbox wajib. Production credentials dilarang terambil default.

Fixture utama PRD §8 F-09, branch tests F-07/F-10/F-11/F-12/F-13; reset sebelum tiap case yang mengubah ledger. Expected dihitung independen, bukan memanggil fungsi production yang diuji. Money assertions integer, tanggal UTC+IANA, media checksum+relasi+akses. Cek DB dan event/outbox setelah race, bukan hanya HTTP200.

## 3. Register skenario dan expected result

Setiap skenario di bawah awal NOT_RUN kecuali NEXT=DEFERRED. Bukti per case: input/redacted request, respons, row delta/ledger/hash bila relevan, screenshot/video untuk UI/native, build/commit dan actual outcome. Untuk lintas peran jalankan akun berbeda, bukan mengubah role di client tanpa auth.

### TC-001 — Mode demo dan guard live

- Requirement: PRO-01, INT-01. Level: integration; gate G0; status NOT_RUN.
- Fixture: F-09.
- Skenario: Coba aktifkan payment live dan SaaS live; scan QR internal; matikan peta lalu lihat mode.
- Expected: Live ditolak; instruksi nonpayable; QR hanya detail demo; tidak ada fallback silent atau status paid palsu.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-002 — Seed reproducible dan reset

- Requirement: PRO-02, TEN-06. Level: integration; gate G0; status NOT_RUN.
- Fixture: F-09.
- Skenario: Seed dua kali dengan clock sama; reset environment demo lalu coba guard production.
- Expected: Dataset deterministik tanpa duplikat; A/B berbeda; reset production ditolak.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-003 — Navigasi dan aksesibilitas

- Requirement: MOB-01, MOB-04, NFR-11. Level: mobile; gate G0; status NOT_RUN.
- Fixture: F-05.
- Skenario: Login tiap role; font 1,3x, empty/error/slow network; lakukan tugas utama.
- Expected: Menu tepat, tombol tidak terpotong, status bukan warna saja, pesan error punya tindakan.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-004 — Tenant attack API/list/export

- Requirement: TEN-01, TEN-02, NFR-01. Level: security; gate G1; status NOT_RUN.
- Fixture: F-13.
- Skenario: User A mengirim object ID/tenant header B pada read, list, search, mutation dan export.
- Expected: Tidak ada data B; object lookup 404 atau operasi 403; tidak ada side effect.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-005 — Tenant attack job/cache/file/channel

- Requirement: TEN-01, NFR-01. Level: security; gate G6; status NOT_RUN.
- Fixture: F-13.
- Skenario: Prime cache A lalu akses B; enqueue salah tenant; download file B; subscribe channel B.
- Expected: Semua scope ditolak atau terisolasi, tanpa data/event lintas tenant.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-006 — Sesi expired/revoked

- Requirement: TEN-04. Level: security; gate G1; status NOT_RUN.
- Fixture: F-05.
- Skenario: Login dua device; revoke satu; coba API lama, push binding dan login rate limit.
- Expected: Hanya device target revoked; expiry ditegakkan; token lama tidak memberi akses baru.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-007 — Identitas operator dan private DTO

- Requirement: TEN-03. Level: contract; gate G1; status NOT_RUN.
- Fixture: F-05.
- Skenario: Customer buka quote/invoice A, inspect JSON; owner buka data yang sama.
- Expected: Penerbit A benar; customer tidak menerima cost/margin/partner rate.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-008 — Request lengkap dan assisted

- Requirement: ORD-01, ORD-02, ORD-04. Level: e2e; gate G2; status NOT_RUN.
- Fixture: F-09/A01,A14.
- Skenario: Buat request pribadi lalu assisted B2B; bedakan pemesan/penerima/pembayar; kosongkan berat penting.
- Expected: Source/actor tersimpan; pihak tidak tertukar; unknown memicu needs_review.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-009 — Jenis waktu layanan

- Requirement: ORD-03. Level: integration; gate G2; status NOT_RUN.
- Fixture: F-06.
- Skenario: Buat segera, rentang fleksibel dan terjadwal di zona berbeda; coba waktu invalid.
- Expected: Rentang dan zona terjaga; immediate perlu konfirmasi; invalid ditolak.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-010 — Idempotency response loss

- Requirement: ORD-05, NFR-05. Level: concurrency; gate G1; status NOT_RUN.
- Fixture: F-07.
- Skenario: Kirim create request dua kali bersamaan dengan key sama; ulang payload berbeda.
- Expected: Satu resource/side effect; replay hasil sama; hash berbeda 409.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-011 — Cancel dan abort

- Requirement: ORD-06. Level: integration; gate G2; status NOT_RUN.
- Fixture: F-09/A08,A09.
- Skenario: Cancel sebelum loading; coba cancel sesudah loading lalu abort tanpa PIC/lokasi.
- Expected: Cancel melepas kapasitas; sesudah loading wajib abort dan custody lengkap; histori tetap.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-012 — Harga nominal F-01

- Requirement: QTE-01, QTE-02. Level: unit; gate G2; status NOT_RUN.
- Fixture: F-01.
- Skenario: Hitung own-fleet F-01; hitung partner quote tanpa BBM mitra ganda.
- Expected: Contribution 786.000, surplus 386.000, target 3.214.000; partner mode tidak double count.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-013 — Persen dan rounding F-02

- Requirement: QTE-02. Level: unit; gate G2; status NOT_RUN.
- Fixture: F-02.
- Skenario: Hitung F-02, P=0, r=100%, value besar; bandingkan decimal oracle.
- Expected: Target matematis 3.242.425; divide-by-zero/r invalid ditolak; money final tepat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-014 — Negosiasi dan missing cost

- Requirement: QTE-03. Level: e2e; gate G2; status NOT_RUN.
- Fixture: F-01.
- Skenario: Tawarkan harga rugi, di bawah target, biaya kosong; owner override.
- Expected: Label/alasan benar; missing bukan zero; override komersial diaudit tanpa bypass capacity.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-015 — Version/expiry quote

- Requirement: QTE-04. Level: integration; gate G2; status NOT_RUN.
- Fixture: F-07/A11.
- Skenario: Send v1 lalu v2; customer accept v1/expired/v2 dua kali.
- Expected: v1/expired ditolak; v2 satu accepted; snapshot sebelumnya immutable.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-016 — Approval dan assisted consent

- Requirement: QTE-05. Level: security; gate G2; status NOT_RUN.
- Fixture: F-05.
- Skenario: Akun tidak berwenang accept; admin assisted tanpa bukti/identitas lalu lengkap.
- Expected: Unauthorized ditolak; consent minimum wajib; actor+kanal+waktu tercatat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-017 — Change order belum disetujui

- Requirement: QTE-06. Level: integration; gate G2; status NOT_RUN.
- Fixture: F-09/A06.
- Skenario: Tambah prioritas/biaya tambahan setelah konfirmasi, issue invoice sebelum/sesudah approval.
- Expected: Item pending tidak ditagih; approved ditagih sekali dan snapshot referensi ada.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-018 — Fleet hard constraints

- Requirement: FLT-01, FLT-02. Level: integration; gate G2; status NOT_RUN.
- Fixture: F-04.
- Skenario: F-04 kendaraan 1.800 kg ditawarkan U1 1.500 kg/U2 3.000 kg/U3 nonaktif.
- Expected: Hanya kandidat layak; unknown dimensions review; tidak bisa bypass via API.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-019 — Ranking dan alternatif

- Requirement: FLT-03, QTE-07. Level: e2e; gate G2; status NOT_RUN.
- Fixture: F-04.
- Skenario: Gunakan dua unit layak dengan biaya/ETA berbeda; ubah pilihan setelah quote.
- Expected: Alasan/rincian terlihat; versi quote berubah; availability diperiksa ulang.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-020 — Race unit dan driver

- Requirement: FLT-04, NFR-05. Level: concurrency; gate G2; status NOT_RUN.
- Fixture: F-07/A07.
- Skenario: Dua worker MySQL confirm interval overlap dengan barrier; ulang dengan unit berbeda driver sama.
- Expected: Tepat satu sukses tiap race; loser 409; tidak ada accepted quote tanpa reservasi.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-021 — Batas interval dan zona

- Requirement: FLT-04. Level: integration; gate G2; status NOT_RUN.
- Fixture: F-06.
- Skenario: Adjacent interval [start,end) dengan buffer; lintas WIB/WITA; quote tanpa hold.
- Expected: Nonoverlap yang sah diterima; buffer overlap ditolak; UI tidak mengaku hold.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-022 — Assignment partner dan reassignment

- Requirement: FLT-05. Level: e2e; gate G3; status NOT_RUN.
- Fixture: F-09/A07.
- Skenario: Offer mitra belum accepted; reassign dari driver lama ke baru saat event pending.
- Expected: Pending tidak dianggap dispatch; history utuh; driver lama ditolak untuk aktivitas baru.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-023 — Komitmen prioritas

- Requirement: FLT-06. Level: e2e; gate G2; status NOT_RUN.
- Fixture: F-04.
- Skenario: Prioritas tanpa kapasitas atau tanpa persetujuan; lalu jadwal valid disetujui.
- Expected: Tidak menjanjikan layanan tidak tersedia; charge hanya setelah consent; tidak menjanjikan kecepatan jalan.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-024 — Readiness dan incident

- Requirement: OPS-01, OPS-05. Level: e2e; gate G3; status NOT_RUN.
- Fixture: F-09/A06,A09.
- Skenario: Pickup belum siap; exception owner; incident dibuka/ditutup.
- Expected: Alasan/PIC/tindak lanjut terlihat; incident resolved tidak otomatis memajukan execution.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-025 — Lokasi duplicate/terlambat/stale

- Requirement: OPS-02, NFR-04. Level: integration; gate G3; status NOT_RUN.
- Fixture: F-06.
- Skenario: Kirim titik t2 lalu t1, duplicate ID, timestamp masa depan; hentikan >90 detik.
- Expected: Latest tetap t2; duplicate sekali; future dikarantina; UI stale/accuracy/source benar.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-026 — Akses lokasi lifecycle

- Requirement: OPS-06. Level: security; gate G3; status NOT_RUN.
- Fixture: F-13.
- Skenario: Customer lain subscribe; driver revoked; handover menutup tracking; ukur epoch boundary.
- Expected: Unauthorized tidak menerima; akses baru dicabut; broadcast customer selesai berhenti; revocation ≤60 detik.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-027 — Offline restart dan replay

- Requirement: OPS-03, MOB-03, NFR-06. Level: device; gate G3; status NOT_RUN.
- Fixture: F-10.
- Skenario: Airplane mode, catat status/foto/expense; restart; reconnect dengan response loss.
- Expected: Pending bertahan; urutan per aggregate; satu efek; foto sama tidak ganda.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-028 — Offline conflict

- Requirement: OPS-03, NFR-06. Level: integration; gate G3; status NOT_RUN.
- Fixture: F-07/A07.
- Skenario: Saat driver offline, reassign dari server; kirim event lama; coba accept quote offline.
- Expected: Event lama needs_review/rejected, tidak rewind; accept/reserve/paid tidak final offline.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-029 — Bukti dan handover dispute

- Requirement: OPS-04. Level: e2e; gate G3; status NOT_RUN.
- Fixture: F-09/B03.
- Skenario: Upload pickup/delivery, receiver objection; ulang handover; buat evidence kurang.
- Expected: Bukti privat terikat kendaraan/tahap; dispute pending review; missing tidak eligible; no duplicate.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-030 — Invoice immutable dan numbering

- Requirement: PAY-01. Level: concurrency; gate G4; status NOT_RUN.
- Fixture: F-09/A05.
- Skenario: Issue dua invoice concurrent per tenant; coba edit issued; generate PDF.
- Expected: Nomor unik, snapshot benar, edit langsung ditolak; PDF operator dan DEMO terlihat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-031 — Bukti transfer bukan paid

- Requirement: PAY-02. Level: e2e; gate G4; status NOT_RUN.
- Fixture: F-11.
- Skenario: Customer upload proof sintetis; finance berbeda verify dua kali; driver mencatat tunai dengan custody.
- Expected: Pending tidak mengubah saldo; satu receipt; custody driver tidak sama finance dan penyerahan tidak membuat receipt kedua.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-032 — Histori: Checkout sandbox nyata

Scope NEXT; status DEFERRED. Requirement PAY-03. Skenario provider baseline tidak menjadi gate prototype dan tidak dibuktikan oleh pembayaran manual. Jika NEXT diaktifkan, spesifikasi provider harus diverifikasi kembali. Pengganti risiko integritas manual: TC-068–TC-071, tanpa mengganti makna ID ini.

### TC-033 — Histori: Webhook invalid dan cross-tenant

Scope NEXT; status DEFERRED. Requirement PAY-04, PAY-07. Skenario provider baseline tidak menjadi gate prototype dan tidak dibuktikan oleh pembayaran manual. Jika NEXT diaktifkan, spesifikasi provider harus diverifikasi kembali. Pengganti risiko integritas manual: TC-068–TC-071, tanpa mengganti makna ID ini.

### TC-034 — Histori: Webhook duplicate/out-of-order

Scope NEXT; status DEFERRED. Requirement PAY-04, NFR-05. Skenario provider baseline tidak menjadi gate prototype dan tidak dibuktikan oleh pembayaran manual. Jika NEXT diaktifkan, spesifikasi provider harus diverifikasi kembali. Pengganti risiko integritas manual: TC-068–TC-071, tanpa mengganti makna ID ini.

### TC-035 — Partial dan late payment

- Requirement: PAY-05. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-11/A02,A03,B03.
- Skenario: Bayar partial, ubah invoice lewat kredit, submit proof pada request expired/superseded dan overpay.
- Expected: Outstanding benar; late/overpaid masuk review/unapplied, tidak hilang atau auto wallet.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-036 — Credit/refund tanpa double subtraction

- Requirement: PAY-05. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-11/A10.
- Skenario: Invoice 1.000.000 paid; credit 200.000; reverse allocation/refund 200.000.
- Expected: Net invoice=800.000, net allocation=800.000, balance=0; entry asal tidak dihapus.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-037 — Receipt, biaya dan custody terpisah

- Requirement: PAY-06. Level: e2e; gate G4; status NOT_RUN.
- Fixture: F-11/A01.
- Skenario: Receipt demo posted dengan custody driver; serahkan ke finance; tambahkan biaya penanganan internal.
- Expected: Saldo customer dan cash custody terpisah; tidak ada payout bank/gateway yang diklaim; tidak membuat receipt kedua.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-038 — B2B organization boundary

- Requirement: BIZ-01, BIZ-06. Level: security; gate G2; status NOT_RUN.
- Fixture: F-13.
- Skenario: Requester account A1 mencoba A2 pada tenant sama; B1 tenant lain; inspect history/file DTO.
- Expected: Hanya org berwenang; receiver tidak otomatis dapat invoice/history.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-039 — Mandat approval dan PO

- Requirement: BIZ-02, BIZ-05. Level: e2e; gate G2; status NOT_RUN.
- Fixture: F-05.
- Skenario: Requester tanpa mandat accept; PO required kosong; approver sah menyetujui.
- Expected: Tidak bypass lewat assisted booking; valid consent/PO diperlukan sebelum confirm.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-040 — Rate card precedence dan version

- Requirement: BIZ-03. Level: unit; gate G2; status NOT_RUN.
- Fixture: F-05.
- Skenario: Tarif account valid vs standard; expired; update rate sesudah accepted.
- Expected: Tarif tepat atau review; histori tidak berubah; missing/expired tidak diam-diam pakai tarif lama.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-041 — Repeat order

- Requirement: BIZ-04, ORD-07. Level: e2e; gate G2; status NOT_RUN.
- Fixture: F-09/A01.
- Skenario: Reorder dari order lama yang unitnya bentrok dan rate expired.
- Expected: Draf baru; tidak auto-dispatch; reprice/reapprove/recheck capacity.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-042 — Owner/customer report

- Requirement: BIZ-08, FIN-02. Level: contract; gate G4; status NOT_RUN.
- Fixture: F-09.
- Skenario: Order paid+unpaid, refund dan expense belum final; compare DTO owner vs B2B.
- Expected: Revenue/contribution/receivable berbeda; provisional terlihat; B2B tidak menerima margin.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-043 — Advance F-08

- Requirement: FIN-01. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-08.
- Skenario: Advance 500.000, approved expense 420.000, return 80.000; retry settlement.
- Expected: Advance balance 0; expense 420.000 sekali; receipt/ref beda tetap tertelusur.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-044 — Estimate vs actual

- Requirement: QTE-08, FIN-02. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-09/A04.
- Skenario: Ubah actual cost sesudah order tanpa mengubah quote; missing expense kemudian final.
- Expected: Estimate snapshot tetap; variance per komponen benar; provisional menjadi final lewat tindakan berwenang.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-045 — Alternatif plan

- Requirement: SUB-01, SUB-03. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-03.
- Skenario: F-03 tenant A subscription dan B success; complete masing-masing dua service unit.
- Expected: A tidak mendapat success fee; B dua usage fee DEMO; snapshot plan tepat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-046 — Usage eligibility race

- Requirement: SUB-02. Level: concurrency; gate G4; status NOT_RUN.
- Fixture: F-09/B03.
- Skenario: Handover ulang/concurrent, disputed, canceled, handed_over unpaid.
- Expected: Satu success sah; disputed review/canceled none; unpaid tetap eligible sesuai ketentuan demo.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-047 — Plan change dan usage credit

- Requirement: SUB-04. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-03.
- Skenario: Ganti paket saat order aktif; credit usage dengan alasan lalu replay.
- Expected: Order aktif snapshot lama; efektif periode berikutnya; satu credit entry, ledger historis utuh.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-048 — Invoice jasa vs SaaS

- Requirement: SUB-05. Level: e2e; gate G4; status NOT_RUN.
- Fixture: F-03.
- Skenario: Generate dua PDF/preview dari tenant sama.
- Expected: Penerbit/nomor/item terpisah; SaaS DEMO tanpa checkout live.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-049 — Paket expired saat perjalanan

- Requirement: SUB-06. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-03.
- Skenario: Expire plan saat driver in_transit; coba order baru dan completion/payment.
- Expected: Warning; order baru dibatasi policy demo; order aktif dan akses penting berlanjut.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-050 — Push dan deep link

- Requirement: MOB-02, MOB-05. Level: device; gate G5; status NOT_RUN.
- Fixture: F-05.
- Skenario: Kirim event duplikat, disable preferensi, revoke token; tap link order lain.
- Expected: Satu inbox; preference dihormati; invalid token dinonaktifkan; link tidak bypass auth.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-051 — Actual Admin dan prerender

- Requirement: ADM-01, ADM-04. Level: admin; gate G5; status NOT_RUN.
- Fixture: F-13.
- Skenario: Pada website aktual, buka menu Tovv, inspect build static, putuskan backend Tovv.
- Expected: Data runtime benar; private data tidak di HTML build; unavailable+timestamp; tidak mengubah inquiry flag.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-052 — BFF assertion attack

- Requirement: ADM-02. Level: security; gate G5; status NOT_RUN.
- Fixture: F-13.
- Skenario: Wrong issuer/audience/alg, expired, replay jti, body/path berbeda dan scope berlebih.
- Expected: Semua invalid ditolak; secret tidak ada di bundle; scope diinterseksikan grant/client.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-053 — Grant dan realtime Admin

- Requirement: TEN-05, ADM-03. Level: admin; gate G5; status NOT_RUN.
- Fixture: F-13.
- Skenario: Support tanpa grant, grant valid, grant revoked; reconnect channel epoch baru.
- Expected: Detail denied sebelum grant; akses tercatat; revoked berhenti ≤60 detik; snapshot recovery benar.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-054 — Field tracking Android+iOS

- Requirement: PRO-03, NFR-03. Level: device; gate G6; status NOT_RUN.
- Fixture: F-06.
- Skenario: Jalankan matrix device FP-01–FP-08, perjalanan terkontrol, timestamps capture/API/render.
- Expected: Laporkan p95≤60 detik sesi eligible, gap keseluruhan dan OS behavior; hasil per platform, bukan global PASS tanpa perangkat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-055 — Load dan respons

- Requirement: NFR-02, NFR-12. Level: performance; gate G6; status NOT_RUN.
- Fixture: F-09 + generator beban.
- Skenario: Profil L-01–L-03, warmup+steady, record hardware/config; provider stub latency controlled.
- Expected: p95 read≤800ms/write≤1500ms, error<1%; laporkan throughput, queue lag dan biaya estimasi.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-056 — Failure visibility

- Requirement: NFR-10. Level: resilience; gate G6; status NOT_RUN.
- Fixture: F-07.
- Skenario: Matikan worker/Reverb/provider, buat poison job; restore dan redrive.
- Expected: Monitoring membedakan failure/stale; correlation ID; recovery idempotent; log tanpa secret.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-057 — Restore end-to-end

- Requirement: NFR-07. Level: recovery; gate G6; status NOT_RUN.
- Fixture: F-09,F-10.
- Skenario: Backup demo, restore ke DB+bucket bersih, bandingkan manifest/sample ledger/files.
- Expected: Counts/amount/hash/relasi cocok; aplikasi dapat login dan read order; waktu restore dicatat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-058 — Retensi dan logout cache

- Requirement: NFR-09. Level: security; gate G6; status NOT_RUN.
- Fixture: F-09,F-10.
- Skenario: Advance clock melewati retensi; jalankan cleanup; logout dan login tenant lain.
- Expected: Raw lokasi/media expired dibersihkan; evidence anonim tetap; cache akun lama tidak terbaca.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-059 — Performa mobile

- Requirement: NFR-12. Level: device; gate G6; status NOT_RUN.
- Fixture: F-06.
- Skenario: Release build pada device acuan; ukur startup 10 kali, memory, baterai/data sesi 60 menit.
- Expected: Raw numbers+device/OS/build ada; bandingkan target eksperimen; tidak mengklaim ringan dari dev build.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-060 — Demo rehearsal

- Requirement: PRO-04, NFR-08. Level: uat; gate G7; status NOT_RUN.
- Fixture: F-09.
- Skenario: Reset seed lalu jalankan D-01–D-08 lintas aktor, termasuk provider unavailable dan Admin harness.
- Expected: Alur selesai atau gap jelas; smoke lulus; fallback labelled; task completion/assistance dicatat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-061 — Handoff dan traceability

- Requirement: PRO-05. Level: review; gate G7; status NOT_RUN.
- Fixture: F-09.
- Skenario: Dari checkout bersih, ikuti setup; pilih requirement acak lalu telusuri task/test/evidence.
- Expected: Setup reproducible; semua PROTO terpetakan; status bukti benar; no fabricated PASS.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-062 — Upload adversarial

- Requirement: OPS-04, TEN-01. Level: security; gate G3; status NOT_RUN.
- Fixture: F-10.
- Skenario: Upload file salah mime, oversized, path traversal filename dan URL remote pada template invoice.
- Expected: Ditolak/sanitized; tidak fetch arbitrary URL; tidak ada cross-tenant file read.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-063 — Histori: Sandbox downtime dan retry ambigu

Scope NEXT; status DEFERRED. Requirement PAY-04. Skenario provider baseline tidak menjadi gate prototype dan tidak dibuktikan oleh pembayaran manual. Jika NEXT diaktifkan, spesifikasi provider harus diverifikasi kembali. Pengganti risiko integritas manual: TC-068–TC-071, tanpa mengganti makna ID ini.

### TC-064 — Monitoring summary privacy

- Requirement: ADM-04, NFR-10. Level: security; gate G5; status NOT_RUN.
- Fixture: F-13.
- Skenario: Platform summary tanpa grant dibanding owner dashboard; inspect payload/log.
- Expected: Hanya aggregate/health yang diizinkan; tidak ada raw location, foto, margin customer atau credential.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-065 — Kamera, gallery dan metadata

- Requirement: CAM-01, CAM-02, CAM-03. Level: device; gate G3; status NOT_RUN.
- Fixture: F-10/A15.
- Skenario: Customer capture draft, driver pickup dan admin berizin capture; impor gallery, retake, rotasi; inspect original/overlay/metadata.
- Expected: Kaitan request/order/vehicle/stage benar; gallery terlabel, original immutable, waktu device/event/server berbeda, overlay DEMO terbaca. Per OS bukti terpisah.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-066 — Permission, storage dan geocode failure

- Requirement: CAM-02, CAM-03, CAM-05. Level: device; gate G3; status NOT_RUN.
- Fixture: F-10.
- Skenario: Deny camera/GPS, pilih stale/manual, mock geocode/map down dan disk penuh saat copy/overlay.
- Expected: GPS null tidak palsu; foto tetap tanpa map; manual/stale berlabel dan umur; low storage tidak saved; retry/retake jelas; original aman.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-067 — Durable photo dan duplicate upload

- Requirement: CAM-04, MOB-03, NFR-06. Level: device/concurrency; gate G3; status NOT_RUN.
- Fixture: F-10.
- Skenario: Capture offline; terminate app; restart; response loss saat original/overlay/complete; kirim UUID sama dua worker lalu bytes berbeda.
- Expected: File/outbox bertahan; satu packet dan satu object per kind; hash mismatch409; complete hanya setelah objek ready; original bukan cache-only.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-068 — Instruksi dan dynamic request nonpayable

- Requirement: PAY-09, PAY-10, PAY-12. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-11/A02.
- Skenario: Buat request500000 saat outstanding1000000; scan QR; ubah instruction version; attempt stale invoice/wrong tenant/amount terlalu besar.
- Expected: Ref unik, valid snapshot, amount/expiry/history; QR detail auth bukan QRIS; rekening DEMO nonpayable; invalid ditolak; tidak ada API eksternal.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-069 — Race manual verification dan allocation

- Requirement: PAY-11, NFR-05. Level: concurrency; gate G4; status NOT_RUN.
- Fixture: F-11/A02.
- Skenario: Dua finance verify proof sama dengan key sama/berbeda; dua proof berbeda berebut sisa; inject DB rollback; ulang20x barrier.
- Expected: Satu receipt per proof; alokasi <= invoice net; overpay unapplied; no half commit; duplicate response idempotent; balances cocok ledger.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-070 — Reject, late, suspected reused reference

- Requirement: PAY-05, PAY-10, PAY-11. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-11/A04,B03,A03.
- Skenario: Reject A04; submit late B03 pada expired request; submit reference A03 ulang dan approve dengan reviewer/reason sah bila bukan duplikat.
- Expected: Reject tanpa saldo; late flagged_review bukan dianggap dana tidak ada; reused ref butuh resolution; proof sama tidak receipt kedua, customer tak verify sendiri.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-071 — Reversal dan refund dependency

- Requirement: PAY-05, PAY-06, PAY-11. Level: concurrency; gate G4; status NOT_RUN.
- Fixture: F-11/A10.
- Skenario: Verifikasi/kredit/refund contoh A10; reverse verification dengan refund sudah recorded; ulang reversal tanpa dependency di branch A01.
- Expected: A10 net invoice800000/allocation800000/due0; reverse dependent409; reversal branch mengembalikan saldo sekali dan audit utuh, tidak transfer uang.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-072 — Owner-driver dan delegasi race

- Requirement: FIN-04, FIN-05, TEN-07. Level: security/e2e; gate G2; status NOT_RUN.
- Fixture: F-12.
- Skenario: Owner mengemudi A06, admin-A1 quote dalam limit; A2 tanpa mandat; expiry/revoke bersamaan commit; coba self approval proof; daftar harian.
- Expected: Role driver tak mewarisi owner; limit/scope/expiry server; revoke efektif pada commit berikut; self approve denied; source/action/PIC dedupe, unresolved tetap terlihat.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-073 — Oracle analytics dan missingness

- Requirement: ANA-01, ANA-02, ANA-03, ANA-04, FIN-06. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-09.
- Skenario: Reset C0, query M-01–M-12 per tenant, drill-down dan compare independent oracle; missing biaya dan empty cohort.
- Expected: Requests24/orders14/quoted19; invoice net10700000; gross receipt6500000/refund200000; allocation6100000/due4600000; kontribusi final3030000 pada7/9; missing null dan coverage, tidak klaim ROI.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-074 — CSV/PDF scope dan isi

- Requirement: RPT-01, RPT-02, CAM-06, BIZ-08. Level: security/e2e; gate G4; status NOT_RUN.
- Fixture: F-09,F-10,F-13.
- Skenario: Export tiap template owner/customer/B2B; masukkan formula CSV, external URL PDF; revoke scope saat job/download.
- Expected: DEMO/filter/as_of/issuer/total benar; tidak ada margin/EXIF internal customer; formula aman; no remote fetch; revoke denied; snapshot cocok dashboard.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-075 — Nearby eligibility dan freshness

- Requirement: FLT-09, FLT-02, OPS-02. Level: integration; gate G2; status NOT_RUN.
- Fixture: F-04,F-06.
- Skenario: U1 paling dekat tidak layak, U2 layak tapi stale, unit tenantB dekat; customer memilih unit lalu kapasitas berubah.
- Expected: U1/B ditolak; stale labeled dan ETA source; pilihan tidak reserve, final conflict409; tidak pencarian lintas tenant.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-076 — Media authorization dan historical upload

- Requirement: CAM-06, CAM-04, TEN-01, OPS-04. Level: security; gate G3; status NOT_RUN.
- Fixture: F-10,F-13.
- Skenario: Driver direassign saat offline; old evidence submit historical-review; customer akses original/private derivative tenant/org lain.
- Expected: Hanya uploader historical sah bisa review; tidak memajukan order; akses tenant/org/order salah denied untuk semua variant/export; hash bukan proof kebenaran.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-077 — Financial clocks dan corrections

- Requirement: PAY-05, PAY-11, ANA-02. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-11.
- Skenario: Foto/proof event kemarin baru diterima dan posted hari ini; request expired; reverse receipt hari berikutnya.
- Expected: Timeline event/device/received/posted berbeda; arus keuangan per posted date; saldo as_of benar, tidak backdate otomatis atau double subtract.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-078 — Period, snapshot dan join fan-out

- Requirement: ANA-01, ANA-04, PRO-02. Level: integration; gate G4; status NOT_RUN.
- Fixture: F-09.
- Skenario: Query timezone/batas periode/quotev1-v2; dua receipts satu invoice; export berjalan ketika koreksi baru commit; empty data.
- Expected: Conversion distinct request; tanggal tepat; invoice tidak dikali join; as_of snapshot konsisten; zero known vs missing null; dashboard angka dari sumber sama.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-079 — Evidence dan validasi tidak berlebihan

- Requirement: PRO-04, PRO-05, NFR-08. Level: review; gate G7; status NOT_RUN.
- Fixture: F-09.
- Skenario: Review proposal, video/demo dan validation log; cocokkan claims terhadap evidence per platform/mode.
- Expected: Tidak ada claim ROI/PMF/perangkat dari seed; Android dan iOS terpisah; Admin stub bukan actual; hipotesis/WTP belum temuan; NEXT bukan gate.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

### TC-080 — Reset generation dan restore media ledger

- Requirement: PRO-02, NFR-07, NFR-09, CAM-04. Level: recovery; gate G6; status NOT_RUN.
- Fixture: F-09,F-10.
- Skenario: Backup DB+media, reset ketika ada device outbox lama, restore instance baru; cleanup expired dengan clock security nyata.
- Expected: Counts/amount/relationships/hashes cocok; old generation409/review, tidak overwrite seed; no external notifications; time-travel tak mencabut auth/retention nyata.
- Bukti: actual output sesuai §1–2; perangkat/integrasi aktual dibuktikan terpisah, simulasi tetap simulated.

## 4. Matrix perangkat dan tracking (FP)

Jalankan pada Android dan iOS secara terpisah; mulai tracking saat app foreground, lalu ubah kondisi. Jangan menafsirkan force-stop yang menghentikan GPS sebagai bug universal framework; yang wajib adalah batas perilaku tercatat, stale jujur dan recovery yang aman.

| ID | Kondisi | Durasi minimum usulan | Expected yang diamati |
|---|---|---|---|
| FP-01 | Foreground, jaringan normal | 15 menit | Posisi/accuracy/time terkirim; role viewer tepat |
| FP-02 | Layar terkunci | 30 menit | Ukur continuity/gap/freshness; konfigurasi background benar |
| FP-03 | Berpindah ke aplikasi navigasi | 20 menit | Tracking tetap sesuai kemampuan OS; tidak ditopang timer UI |
| FP-04 | Airplane mode, capture lalu reconnect | 5 menit offline + recovery | Data lokal bertahan; latest tidak mundur; replay tanpa duplikat |
| FP-05 | App swipe-away/force-stop lalu buka lagi | 5 menit + recovery | Perilaku vendor/OS dicatat; UI stale; resume setelah login/permission valid |
| FP-06 | Battery saver/low power | 20 menit | Ukur perubahan interval; limitation terlihat; tidak memalsukan titik |
| FP-07 | Izin dicabut/downgrade approximate | Sampai kondisi teramati | Informasi permission/accuracy dan recovery jelas; tidak meminta izin berulang tanpa konteks |
| FP-08 | Logout/reassign/layanan selesai | 2 epoch realtime | Pengiriman/access berhenti sesuai policy; penerima tidak melihat lokasi tugas lain |

Field route terkontrol dengan peserta yang setuju, tanpa pelanggan berbayar. Pengemudi tidak menjalankan test saat mengemudi; operator penumpang atau kendaraan berhenti melakukan interaksi. Gunakan waktu server+device yang tersinkron, catat skew.

Freshness sample = rendered_at − captured_at. Selain p50/p95/max, laporkan durasi tanpa data >90 detik, persentase coverage, perangkat, izin dan mode. Eligible-session (jaringan+izin tersedia) dan keseluruhan sesi dilaporkan keduanya agar kegagalan tidak disembunyikan. Tidak menetapkan continuous GPS saat user force-stop sebagai jaminan produk.

## 5. Profil beban dan performa

| Profil | Beban sintetis | Durasi | Pengukuran |
|---|---|---|---|
| L-01 | 10 user aktif, 5 driver update/15 detik | 5 menit warmup + 15 menit steady | Baseline read/write dan ingest |
| L-02 | 50 user aktif, 50 driver update/15 detik, 20 map viewers | 5 + 30 menit | Target prototype NFR-02; queue/DB/Reverb resources |
| L-03 | 100 driver replay burst setelah offline, max 100 event/batch; background L-02 | 10 menit | Backpressure, dedupe, latest ordering, retry dan queue recovery |

Request mix baseline: 60% read order/list/tracking snapshot, 20% request/quote/status write, 20% invoice/B2B read/write; location ingestion diukur terpisah. Catat actual offered RPS dan achieved RPS; jumlah user virtual bukan throughput. Provider eksternal peta/push memakai adapter deterministic untuk kapasitas backend; panggilan provider peta/push aktual hanya volume rendah yang diizinkan provider, tidak load-test provider tanpa izin.

Target: p95 read≤800 ms, write≤1.500 ms, unexpected error<1%; idempotency/capacity expected 409 tidak dihitung error server tetapi dilaporkan. P95 queue delay job nonmedia target≤10 detik pada steady L-02. Tidak ada loss event yang sudah acknowledged. Setelah burst, backlog harus kembali ke baseline dalam 5 menit pada mesin uji; jika gagal, catat profil/kapasitas dan perbaiki atau revisi target secara eksplisit.

Mobile: catat ukuran download/install, cold startup 10 kali (target eksploratif p95≤3 detik pada device acuan), memory peak, frame drops saat map aktif, baterai/data per jam. Battery test 60 menit dibanding sesi screen/network setara tanpa tracking; tidak menetapkan angka drain universal sebelum device baseline ada. Minimal tidak ada crash/ANR selama sesi; batas memory spesifik ditetapkan dari hasil awal dan dicatat. Hasil hanya berlaku pada build/device/config yang diuji.


## 6. Matriks perangkat tambahan kamera/offline

| Kasus | Android fisik | iPhone fisik | Expected |
|---|---|---|---|
| Camera/gallery/rotation/overlay keterbacaan | NOT_RUN | NOT_RUN | Original utuh, label capture/import, waktu/sumber benar |
| Denied/restricted/approximate location | NOT_RUN | NOT_RUN | Foto tanpa GPS tetap, no fabricated coordinates |
| Durable original+outbox setelah terminate | NOT_RUN | NOT_RUN | Data pending kembali; upload tidak duplikat |
| Storage penuh saat copy/derivative | NOT_RUN | NOT_RUN | Tidak saved palsu; original yang sudah persisten aman |
| Screen lock/native task/reassignment | NOT_RUN | NOT_RUN | Scope/stale/stop jelas; gap dicatat |
| Background upload/reopen | NOT_RUN | NOT_RUN | Tidak janji upload terminated; recovery foreground berhasil |

Catat model/OS/build/izin/battery saver/network; bila tidak ada iPhone tulis BLOCKED:iPhone/signing belum tersedia, bukan menyimpulkan dari Android. Emulator dan route replay dapat lulus simulasi saja. Pengemudi tidak mengoperasikan test saat berkendara; petugas penumpang atau kendaraan berhenti, tanpa pelanggan berbayar.

## 7. Matriks requirement → skenario → fixture → expected → bukti

Kolom expected memuat hasil utama; register TC §3 memberi seluruh langkah/assertions; fixture spesifik tercantum pada tiap TC dan kanonik PRD §8. Tidak ada requirement PROTO tanpa task dan skenario. Expected dan evidence tidak diganti dengan status PASS sebelum eksekusi.

| Requirement | Scope/task | Skenario | Fixture | Expected result utama | Bukti yang diperlukan |
|---|---|---|---|---|---|
| TEN-01 | PROTO / T-03 | TC-004, TC-005, TC-062, TC-076 | F-13, F-10, F-10,F-13 | Tidak ada data B; object lookup 404 atau operasi 403; tidak ada side effect. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| TEN-02 | PROTO / T-03 | TC-004 | F-13 | Tidak ada data B; object lookup 404 atau operasi 403; tidak ada side effect. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| TEN-03 | PROTO / T-03 | TC-007 | F-05 | Penerbit A benar; customer tidak menerima cost/margin/partner rate. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| TEN-04 | PROTO / T-03 | TC-006 | F-05 | Hanya device target revoked; expiry ditegakkan; token lama tidak memberi akses baru. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| TEN-05 | PROTO / T-20 | TC-053 | F-13 | Detail denied sebelum grant; akses tercatat; revoked berhenti ≤60 detik; snapshot recovery benar. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| TEN-06 | PROTO / T-02 | TC-002 | F-09 | Dataset deterministik tanpa duplikat; A/B berbeda; reset production ditolak. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ORD-01 | PROTO / T-05 | TC-008 | F-09/A01,A14 | Source/actor tersimpan; pihak tidak tertukar; unknown memicu needs_review. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ORD-02 | PROTO / T-05 | TC-008 | F-09/A01,A14 | Source/actor tersimpan; pihak tidak tertukar; unknown memicu needs_review. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ORD-03 | PROTO / T-05 | TC-009 | F-06 | Rentang dan zona terjaga; immediate perlu konfirmasi; invalid ditolak. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ORD-04 | PROTO / T-05 | TC-008 | F-09/A01,A14 | Source/actor tersimpan; pihak tidak tertukar; unknown memicu needs_review. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ORD-05 | PROTO / T-06 | TC-010 | F-07 | Satu resource/side effect; replay hasil sama; hash berbeda 409. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ORD-06 | PROTO / T-09 | TC-011 | F-09/A08,A09 | Cancel melepas kapasitas; sesudah loading wajib abort dan custody lengkap; histori tetap. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ORD-07 | PROTO / T-11 | TC-041 | F-09/A01 | Draf baru; tidak auto-dispatch; reprice/reapprove/recheck capacity. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-01 | PROTO / T-07 | TC-012 | F-01 | Contribution 786.000, surplus 386.000, target 3.214.000; partner mode tidak double count. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-02 | PROTO / T-07 | TC-012, TC-013 | F-01, F-02 | Contribution 786.000, surplus 386.000, target 3.214.000; partner mode tidak double count. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-03 | PROTO / T-07 | TC-014 | F-01 | Label/alasan benar; missing bukan zero; override komersial diaudit tanpa bypass capacity. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-04 | PROTO / T-08 | TC-015 | F-07/A11 | v1/expired ditolak; v2 satu accepted; snapshot sebelumnya immutable. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-05 | PROTO / T-08 | TC-016 | F-05 | Unauthorized ditolak; consent minimum wajib; actor+kanal+waktu tercatat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-06 | PROTO / T-08 | TC-017 | F-09/A06 | Item pending tidak ditagih; approved ditagih sekali dan snapshot referensi ada. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-07 | PROTO / T-10 | TC-019 | F-04 | Alasan/rincian terlihat; versi quote berubah; availability diperiksa ulang. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| QTE-08 | PROTO / T-16 | TC-044 | F-09/A04 | Estimate snapshot tetap; variance per komponen benar; provisional menjadi final lewat tindakan berwenang. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-01 | PROTO / T-04 | TC-018 | F-04 | Hanya kandidat layak; unknown dimensions review; tidak bisa bypass via API. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-02 | PROTO / T-10 | TC-018, TC-075 | F-04, F-04,F-06 | Hanya kandidat layak; unknown dimensions review; tidak bisa bypass via API. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-03 | PROTO / T-10 | TC-019 | F-04 | Alasan/rincian terlihat; versi quote berubah; availability diperiksa ulang. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-04 | PROTO / T-09 | TC-020, TC-021 | F-07/A07, F-06 | Tepat satu sukses tiap race; loser 409; tidak ada accepted quote tanpa reservasi. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-05 | PROTO / T-12 | TC-022 | F-09/A07 | Pending tidak dianggap dispatch; history utuh; driver lama ditolak untuk aktivitas baru. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-06 | PROTO / T-09 | TC-023 | F-04 | Tidak menjanjikan layanan tidak tersedia; charge hanya setelah consent; tidak menjanjikan kecepatan jalan. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-07 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| FLT-08 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| OPS-01 | PROTO / T-15 | TC-024 | F-09/A06,A09 | Alasan/PIC/tindak lanjut terlihat; incident resolved tidak otomatis memajukan execution. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| OPS-02 | PROTO / T-13 | TC-025, TC-075 | F-06, F-04,F-06 | Latest tetap t2; duplicate sekali; future dikarantina; UI stale/accuracy/source benar. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| OPS-03 | PROTO / T-14 | TC-027, TC-028 | F-10, F-07/A07 | Pending bertahan; urutan per aggregate; satu efek; foto sama tidak ganda. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| OPS-04 | PROTO / T-15 | TC-029, TC-062, TC-076 | F-09/B03, F-10, F-10,F-13 | Bukti privat terikat kendaraan/tahap; dispute pending review; missing tidak eligible; no duplicate. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| OPS-05 | PROTO / T-15 | TC-024 | F-09/A06,A09 | Alasan/PIC/tindak lanjut terlihat; incident resolved tidak otomatis memajukan execution. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| OPS-06 | PROTO / T-13 | TC-026 | F-13 | Unauthorized tidak menerima; akses baru dicabut; broadcast customer selesai berhenti; revocation ≤60 detik. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| OPS-07 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| OPS-08 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| PAY-01 | PROTO / T-17 | TC-030 | F-09/A05 | Nomor unik, snapshot benar, edit langsung ditolak; PDF operator dan DEMO terlihat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-02 | PROTO / T-17 | TC-031 | F-11 | Pending tidak mengubah saldo; satu receipt; custody driver tidak sama finance dan penyerahan tidak membuat receipt kedua. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-03 | NEXT / BACKLOG T-18 | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| PAY-04 | NEXT / BACKLOG T-18 | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| PAY-05 | PROTO / T-17 | TC-035, TC-036, TC-070, TC-071, TC-077 | F-11/A02,A03,B03, F-11/A10, F-11/A04,B03,A03, F-11 | Outstanding benar; late/overpaid masuk review/unapplied, tidak hilang atau auto wallet. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-06 | PROTO / T-17 | TC-037, TC-071 | F-11/A01, F-11/A10 | Saldo customer dan cash custody terpisah; tidak ada payout bank/gateway yang diklaim; tidak membuat receipt kedua. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-07 | NEXT / BACKLOG T-18 | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| PAY-08 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| BIZ-01 | PROTO / T-11 | TC-038 | F-13 | Hanya org berwenang; receiver tidak otomatis dapat invoice/history. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| BIZ-02 | PROTO / T-11 | TC-039 | F-05 | Tidak bypass lewat assisted booking; valid consent/PO diperlukan sebelum confirm. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| BIZ-03 | PROTO / T-11 | TC-040 | F-05 | Tarif tepat atau review; histori tidak berubah; missing/expired tidak diam-diam pakai tarif lama. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| BIZ-04 | PROTO / T-11 | TC-041 | F-09/A01 | Draf baru; tidak auto-dispatch; reprice/reapprove/recheck capacity. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| BIZ-05 | PROTO / T-11 | TC-039 | F-05 | Tidak bypass lewat assisted booking; valid consent/PO diperlukan sebelum confirm. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| BIZ-06 | PROTO / T-11 | TC-038 | F-13 | Hanya org berwenang; receiver tidak otomatis dapat invoice/history. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| BIZ-07 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| BIZ-08 | PROTO / T-19 | TC-042, TC-074 | F-09, F-09,F-10,F-13 | Revenue/contribution/receivable berbeda; provisional terlihat; B2B tidak menerima margin. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| BIZ-09 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| FIN-01 | PROTO / T-16 | TC-043 | F-08 | Advance balance 0; expense 420.000 sekali; receipt/ref beda tetap tertelusur. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FIN-02 | PROTO / T-16 | TC-042, TC-044 | F-09, F-09/A04 | Revenue/contribution/receivable berbeda; provisional terlihat; B2B tidak menerima margin. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FIN-03 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| FIN-04 | PROTO / T-28 | TC-072 | F-12 | Role driver tak mewarisi owner; limit/scope/expiry server; revoke efektif pada commit berikut; self approve denied; source/action/PIC dedupe, unresolved tetap terlihat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FIN-05 | PROTO / T-28 | TC-072 | F-12 | Role driver tak mewarisi owner; limit/scope/expiry server; revoke efektif pada commit berikut; self approve denied; source/action/PIC dedupe, unresolved tetap terlihat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FIN-06 | PROTO / T-29 | TC-073 | F-09 | Requests24/orders14/quoted19; invoice net10700000; gross receipt6500000/refund200000; allocation6100000/due4600000; kontribusi final3030000 pada7/9; missing null dan coverage, tidak klaim ROI. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| SUB-01 | PROTO / T-19 | TC-045 | F-03 | A tidak mendapat success fee; B dua usage fee DEMO; snapshot plan tepat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| SUB-02 | PROTO / T-19 | TC-046 | F-09/B03 | Satu success sah; disputed review/canceled none; unpaid tetap eligible sesuai ketentuan demo. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| SUB-03 | PROTO / T-19 | TC-045 | F-03 | A tidak mendapat success fee; B dua usage fee DEMO; snapshot plan tepat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| SUB-04 | PROTO / T-19 | TC-047 | F-03 | Order aktif snapshot lama; efektif periode berikutnya; satu credit entry, ledger historis utuh. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| SUB-05 | PROTO / T-19 | TC-048 | F-03 | Penerbit/nomor/item terpisah; SaaS DEMO tanpa checkout live. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| SUB-06 | PROTO / T-19 | TC-049 | F-03 | Warning; order baru dibatasi policy demo; order aktif dan akses penting berlanjut. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| MOB-01 | PROTO / T-02 | TC-003 | F-05 | Menu tepat, tombol tidak terpotong, status bukan warna saja, pesan error punya tindakan. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| MOB-02 | PROTO / T-21 | TC-050 | F-05 | Satu inbox; preference dihormati; invalid token dinonaktifkan; link tidak bypass auth. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| MOB-03 | PROTO / T-14 | TC-027, TC-067 | F-10 | Pending bertahan; urutan per aggregate; satu efek; foto sama tidak ganda. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| MOB-04 | PROTO / T-02 | TC-003 | F-05 | Menu tepat, tombol tidak terpotong, status bukan warna saja, pesan error punya tindakan. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| MOB-05 | PROTO / T-21 | TC-050 | F-05 | Satu inbox; preference dihormati; invalid token dinonaktifkan; link tidak bypass auth. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| MOB-06 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| NFR-01 | PROTO / T-03 | TC-004, TC-005 | F-13 | Tidak ada data B; object lookup 404 atau operasi 403; tidak ada side effect. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-02 | PROTO / T-23 | TC-055 | F-09 + generator beban | p95 read≤800ms/write≤1500ms, error<1%; laporkan throughput, queue lag dan biaya estimasi. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-03 | PROTO / T-22 | TC-054 | F-06 | Laporkan p95≤60 detik sesi eligible, gap keseluruhan dan OS behavior; hasil per platform, bukan global PASS tanpa perangkat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-04 | PROTO / T-13 | TC-025 | F-06 | Latest tetap t2; duplicate sekali; future dikarantina; UI stale/accuracy/source benar. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-05 | PROTO / T-09 | TC-010, TC-020, TC-069 | F-07, F-07/A07, F-11/A02 | Satu resource/side effect; replay hasil sama; hash berbeda 409. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-06 | PROTO / T-14 | TC-027, TC-028, TC-067 | F-10, F-07/A07 | Pending bertahan; urutan per aggregate; satu efek; foto sama tidak ganda. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-07 | PROTO / T-24 | TC-057, TC-080 | F-09,F-10 | Counts/amount/hash/relasi cocok; aplikasi dapat login dan read order; waktu restore dicatat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-08 | PROTO / T-25 | TC-060, TC-079 | F-09 | Alur selesai atau gap jelas; smoke lulus; fallback labelled; task completion/assistance dicatat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-09 | PROTO / T-24 | TC-058, TC-080 | F-09,F-10 | Raw lokasi/media expired dibersihkan; evidence anonim tetap; cache akun lama tidak terbaca. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-10 | PROTO / T-23 | TC-056, TC-064 | F-07, F-13 | Monitoring membedakan failure/stale; correlation ID; recovery idempotent; log tanpa secret. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-11 | PROTO / T-02 | TC-003 | F-05 | Menu tepat, tombol tidak terpotong, status bukan warna saja, pesan error punya tindakan. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| NFR-12 | PROTO / T-23 | TC-055, TC-059 | F-09 + generator beban, F-06 | p95 read≤800ms/write≤1500ms, error<1%; laporkan throughput, queue lag dan biaya estimasi. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PRO-01 | PROTO / T-01 | TC-001 | F-09 | Live ditolak; instruksi nonpayable; QR hanya detail demo; tidak ada fallback silent atau status paid palsu. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PRO-02 | PROTO / T-02 | TC-002, TC-078, TC-080 | F-09, F-09,F-10 | Dataset deterministik tanpa duplikat; A/B berbeda; reset production ditolak. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PRO-03 | PROTO / T-22 | TC-054 | F-06 | Laporkan p95≤60 detik sesi eligible, gap keseluruhan dan OS behavior; hasil per platform, bukan global PASS tanpa perangkat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PRO-04 | PROTO / T-25 | TC-060, TC-079 | F-09 | Alur selesai atau gap jelas; smoke lulus; fallback labelled; task completion/assistance dicatat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PRO-05 | PROTO / T-25 | TC-061, TC-079 | F-09 | Setup reproducible; semua PROTO terpetakan; status bukti benar; no fabricated PASS. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ADM-01 | PROTO / T-20 | TC-051 | F-13 | Data runtime benar; private data tidak di HTML build; unavailable+timestamp; tidak mengubah inquiry flag. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ADM-02 | PROTO / T-20 | TC-052 | F-13 | Semua invalid ditolak; secret tidak ada di bundle; scope diinterseksikan grant/client. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ADM-03 | PROTO / T-20 | TC-053 | F-13 | Detail denied sebelum grant; akses tercatat; revoked berhenti ≤60 detik; snapshot recovery benar. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ADM-04 | PROTO / T-20 | TC-051, TC-064 | F-13 | Data runtime benar; private data tidak di HTML build; unavailable+timestamp; tidak mengubah inquiry flag. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| INT-01 | PROTO / T-01 | TC-001 | F-09 | Live ditolak; instruksi nonpayable; QR hanya detail demo; tidak ada fallback silent atau status paid palsu. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| TEN-07 | PROTO / T-28 | TC-072 | F-12 | Role driver tak mewarisi owner; limit/scope/expiry server; revoke efektif pada commit berikut; self approve denied; source/action/PIC dedupe, unresolved tetap terlihat. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| FLT-09 | PROTO / T-10 | TC-075 | F-04,F-06 | U1/B ditolak; stale labeled dan ETA source; pilihan tidak reserve, final conflict409; tidak pencarian lintas tenant. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-09 | PROTO / T-27 | TC-068 | F-11/A02 | Ref unik, valid snapshot, amount/expiry/history; QR detail auth bukan QRIS; rekening DEMO nonpayable; invalid ditolak; tidak ada API eksternal. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-10 | PROTO / T-27 | TC-068, TC-070 | F-11/A02, F-11/A04,B03,A03 | Ref unik, valid snapshot, amount/expiry/history; QR detail auth bukan QRIS; rekening DEMO nonpayable; invalid ditolak; tidak ada API eksternal. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-11 | PROTO / T-27 | TC-069, TC-070, TC-071, TC-077 | F-11/A02, F-11/A04,B03,A03, F-11/A10, F-11 | Satu receipt per proof; alokasi <= invoice net; overpay unapplied; no half commit; duplicate response idempotent; balances cocok ledger. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-12 | PROTO / T-27 | TC-068 | F-11/A02 | Ref unik, valid snapshot, amount/expiry/history; QR detail auth bukan QRIS; rekening DEMO nonpayable; invalid ditolak; tidak ada API eksternal. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| PAY-13 | NEXT / BACKLOG | DEFERRED | — | Bukan gate prototype | Tidak diklaim tersedia |
| CAM-01 | PROTO / T-26 | TC-065 | F-10/A15 | Kaitan request/order/vehicle/stage benar; gallery terlabel, original immutable, waktu device/event/server berbeda, overlay DEMO terbaca. Per OS bukti terpisah. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| CAM-02 | PROTO / T-26 | TC-065, TC-066 | F-10/A15, F-10 | Kaitan request/order/vehicle/stage benar; gallery terlabel, original immutable, waktu device/event/server berbeda, overlay DEMO terbaca. Per OS bukti terpisah. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| CAM-03 | PROTO / T-26 | TC-065, TC-066 | F-10/A15, F-10 | Kaitan request/order/vehicle/stage benar; gallery terlabel, original immutable, waktu device/event/server berbeda, overlay DEMO terbaca. Per OS bukti terpisah. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| CAM-04 | PROTO / T-26 | TC-067, TC-076, TC-080 | F-10, F-10,F-13, F-09,F-10 | File/outbox bertahan; satu packet dan satu object per kind; hash mismatch409; complete hanya setelah objek ready; original bukan cache-only. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| CAM-05 | PROTO / T-26 | TC-066 | F-10 | GPS null tidak palsu; foto tetap tanpa map; manual/stale berlabel dan umur; low storage tidak saved; retry/retake jelas; original aman. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| CAM-06 | PROTO / T-26 | TC-074, TC-076 | F-09,F-10,F-13, F-10,F-13 | DEMO/filter/as_of/issuer/total benar; tidak ada margin/EXIF internal customer; formula aman; no remote fetch; revoke denied; snapshot cocok dashboard. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ANA-01 | PROTO / T-29 | TC-073, TC-078 | F-09 | Requests24/orders14/quoted19; invoice net10700000; gross receipt6500000/refund200000; allocation6100000/due4600000; kontribusi final3030000 pada7/9; missing null dan coverage, tidak klaim ROI. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ANA-02 | PROTO / T-29 | TC-073, TC-077 | F-09, F-11 | Requests24/orders14/quoted19; invoice net10700000; gross receipt6500000/refund200000; allocation6100000/due4600000; kontribusi final3030000 pada7/9; missing null dan coverage, tidak klaim ROI. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ANA-03 | PROTO / T-29 | TC-073 | F-09 | Requests24/orders14/quoted19; invoice net10700000; gross receipt6500000/refund200000; allocation6100000/due4600000; kontribusi final3030000 pada7/9; missing null dan coverage, tidak klaim ROI. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| ANA-04 | PROTO / T-29 | TC-073, TC-078 | F-09 | Requests24/orders14/quoted19; invoice net10700000; gross receipt6500000/refund200000; allocation6100000/due4600000; kontribusi final3030000 pada7/9; missing null dan coverage, tidak klaim ROI. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| RPT-01 | PROTO / T-30 | TC-074 | F-09,F-10,F-13 | DEMO/filter/as_of/issuer/total benar; tidak ada margin/EXIF internal customer; formula aman; no remote fetch; revoke denied; snapshot cocok dashboard. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |
| RPT-02 | PROTO / T-30 | TC-074 | F-09,F-10,F-13 | DEMO/filter/as_of/issuer/total benar; tidak ada margin/EXIF internal customer; formula aman; no remote fetch; revoke denied; snapshot cocok dashboard. Lihat TC untuk seluruh assertions. | NOT_RUN; actual output/DB delta, commit dan mode; device/OS atau Admin aktual bila terkait (§1–3) |

## 8. Gate, rehearsal dan laporan

G7-A siap presentasi: backend/database E2E lintas role nyata, tenant/org/file/channel isolation, quote/kapasitas/ledger concurrency, fixture analytics/report konsisten, DEMO nonpayable, reset/restore teruji dan D-01–D-08 rehearsal; tidak ada S0/S1. Mode replay, harness, maps/push stub boleh untuk presentasi dengan limitations yang terlihat. Fitur kamera/perangkat yang belum diuji diperlihatkan sebagai simulated flow, bukan hasil capture aktual.

G7-B seluruh kemampuan perangkat PROTO terbukti: tambahan Android+iOS fisik (kamera, permission, offline restart, background), integrasi PROTO aktual yang digunakan dan Admin aktual; critical suite lulus. Jika akses Admin belum ada, ADM actual BLOCKED. **Payment gateway/QRIS live tidak menjadi syarat kedua gate.** Semua NEXT bukan pekerjaan wajib. Gate teknis tidak membuktikan manfaat bisnis/ROI/retensi.

Rehearsal mengikuti PRD D-01–D-08: reset/snapshot/clock, health API/worker/Reverb/storage, peran login, adapter label, invoice/receipt DEMO, fallback terlabel. Sesudah sesi catat waktu/bantuan/errors, revoke sesi/grants sementara dan cleanup sesuai retensi. Validation feedback mengikuti dokumen terpisah.

Laporan akhir implementasi nanti: jumlah PASS/FAIL/BLOCKED/NOT_RUN per mode/platform, critical defects, requirement gaps, checksum fixture/oracle, native matrix, benchmark, restore duration, Admin two-SHA evidence, known limitations dan keputusan gate. Contoh evidence record: test_id TC-069; status NOT_RUN; mode verified-local hanya setelah dijalankan; actual/evidence kosong berarti belum berhasil. Jangan mengisi actual dari expected.
