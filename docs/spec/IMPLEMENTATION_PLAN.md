# IMPLEMENTATION_PLAN — Tovv

## Provenance, versi dan batas bukti

Paket **2.1 — 21 Oktober 2026**. Produk **Tovv**; pemilik, pengembang dan penerbit **Solveit Indonesia**. Status dokumen: spesifikasi/rencana; bukan bukti aplikasi sudah dibuat atau diuji.

Baseline yang benar-benar dibaca: PRD v2.0 (file sumber PRD(2).md, identik dengan salinan PRD (1).md), ARCHITECTURE, IMPLEMENTATION_PLAN, INTEGRATION_PLAN dan TEST_PLAN masing-masing berlabel v1.0 dengan acuan PRD v2.0. Tidak ditemukan versi lebih baru. VALIDATION_PLAN.md tidak ditemukan setelah pencarian nama; dokumen itu **disusun kembali**, bukan hasil pemeriksaan file lama. Pesan pengguna terbaru mengungguli baseline. Seluruh enam dokumen kini memakai versi paket 2.1.

Urutan baca: [PRD](PRD.md) → [ARCHITECTURE](ARCHITECTURE.md) → [INTEGRATION_PLAN](INTEGRATION_PLAN.md) → [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) → [TEST_PLAN](TEST_PLAN.md) → [VALIDATION_PLAN](VALIDATION_PLAN.md). PRD menguasai scope/aturan bisnis; kontrak dan model harus mematuhinya. Perubahan mengharuskan pembaruan requirement, task, test, fixture dan keputusan terkait pada paket yang sama.
## 0. Status aktual (23 Oktober 2026)

Bagian ini mencatat kondisi repository, bukan mengubah requirement. Yang sudah ada hanya **aplikasi mobile tahap frontend** (`mobile/`) dengan adapter demo bertipe; **backend, database, otorisasi server, realtime, dan integrasi belum dibuat**. Status `VERIFIED_LOCAL` di bawah berarti diuji Jest terhadap adapter demo/domain, bukan bukti backend atau perangkat. Tidak ada gate G0–G7 yang dinyatakan lulus.

Pemeriksaan terakhir di `mobile/`: typecheck dan lint bersih, 1.292 uji Jest lulus (termasuk oracle F-09, alur adapter, login demo, cakupan peta per peran, kontras dua palet, dan kelengkapan kamus terjemahan), expo-doctor 21/21. Bukti layar ada di `docs/QA_REPORT.md`.

| Task | Status | Catatan |
|---|---|---|
| T-01 | IMPLEMENTED_UNVERIFIED | mobile: Expo SDK 57 dipin, lockfile, expo-doctor 21/21; backend belum dibuat |
| T-02 | VERIFIED_LOCAL | mobile shell tiga peran, fixture F-09 di adapter demo, oracle diuji Jest; seeder database belum |
| T-03 | NOT_STARTED | backend; layar masuk/daftar/lupa kata sandi hanya simulasi lokal |
| T-04 | IMPLEMENTED_UNVERIFIED | frontend: registry armada baca saja; CRUD dan backend belum |
| T-05 | IMPLEMENTED_UNVERIFIED | frontend: permintaan lintas kanal di adapter demo |
| T-06 | IMPLEMENTED_UNVERIFIED | frontend: outbox lokal + idempotency di adapter; kontrak server belum |
| T-07 | VERIFIED_LOCAL | rumus harga F-01/F-02 diuji Jest; tanpa backend |
| T-08 | IMPLEMENTED_UNVERIFIED | frontend: versi penawaran dan biaya tambahan |
| T-09 | NOT_STARTED | reservasi atomik adalah tugas backend; frontend hanya mensimulasikan bentrok |
| T-10 | IMPLEMENTED_UNVERIFIED | frontend: kelayakan unit sebelum peringkat |
| T-11 | IMPLEMENTED_UNVERIFIED | frontend: akun bisnis, PO, penyetuju |
| T-12 | IMPLEMENTED_UNVERIFIED | frontend: tawaran, terima/tolak, alihkan |
| T-13 | IMPLEMENTED_UNVERIFIED | frontend: peta langsung per peran dengan replay F-06; tracking HP latar belakang dan realtime belum |
| T-14 | IMPLEMENTED_UNVERIFIED | frontend: antrean kirim ulang persisten di HP |
| T-15 | IMPLEMENTED_UNVERIFIED | frontend: tahap perjalanan, kendala, serah-terima |
| T-16 | IMPLEMENTED_UNVERIFIED | frontend: biaya aktual dan kontribusi sementara/final |
| T-17 | VERIFIED_LOCAL | ledger domain diuji Jest; tanpa database |
| T-19 | IMPLEMENTED_UNVERIFIED | frontend: pratinjau langganan dan rekap B2B |
| T-20 | NOT_STARTED | hanya layar contoh akses dukungan; Solveit Admin aktual BLOCKED |
| T-21 | IMPLEMENTED_UNVERIFIED | frontend: kotak masuk simulasi dan deep link; push belum |
| T-22 | IN_PROGRESS | emulator Android API 36 + Expo Go di HP pengguna; bukti perangkat fisik lengkap belum |
| T-23 | NOT_STARTED | — |
| T-24 | NOT_STARTED | — |
| T-25 | IN_PROGRESS | prototype demo frontend siap dicoba; rehearsal backend belum |
| T-26 | IMPLEMENTED_UNVERIFIED | frontend: kamera, salinan tahan lama, overlay; upload server belum |
| T-27 | IMPLEMENTED_UNVERIFIED | frontend: permintaan bayar, bukti, pemeriksaan, koreksi |
| T-28 | IMPLEMENTED_UNVERIFIED | frontend: daftar tindakan harian; delegasi tersedia di adapter, tidak ditautkan karena peran admin tidak dibuka |
| T-29 | VERIFIED_LOCAL | analytics M-01–M-12 diuji terhadap oracle F-09 |
| T-30 | IMPLEMENTED_UNVERIFIED | CSV demo tersedia; PDF server belum |
| T-31 | NOT_STARTED | — |
| T-18 | NEXT | Tidak dikerjakan pada prototype |

### Keputusan pengguna setelah paket 2.1

| Tanggal | Keputusan | Dampak |
|---|---|---|
| 22 Okt 2026 | Gaya visual standar super-app/fintech Indonesia, tema terang + gelap | `docs/DESIGN.md`; arah "Nota Rangkap" diganti |
| 23 Okt 2026 | Aplikasi hanya membuka tiga peran: owner, driver, pelanggan | Tugas dispatcher/finance dikerjakan owner; peran `admin` tetap di model data dan uji kebijakan. Requirement admin di PRD tidak dihapus |
| 23 Okt 2026 | Peta langsung memakai peta bawaan HP (react-native-maps) | Expo Go berjalan tanpa API key; build Android produksi butuh API key Google Maps (DEC-08 tetap terbuka untuk biaya/kebijakan) |
| 23 Okt 2026 | Masuk/daftar/lupa kata sandi sebagai simulasi lokal | Tidak menggantikan TEN-04; tetap tugas T-03 |
| 23 Okt 2026 | Antarmuka dua bahasa (Indonesia, Inggris) | Teks sumber bahasa Indonesia; kamus Inggris di `mobile/src/core/i18n/en.ts` |
| 23 Okt 2026 | Nama file, folder, commit, dan PR berbahasa Inggris; isi dokumen tetap bahasa Indonesia | `AGENTS.md` bagian Git |

## 1. Kontrak kerja agent dan status

Status task terbaru ada di §0; kolom Status pada tiap task di §3 mengikutinya. Backend belum dimulai. Baca keenam dokumen dan instruksi repo aktual, audit branch/working tree/lockfile/CI. Jangan overwrite perubahan user, jangan membangun NEXT tanpa keputusan, jangan membuat login bypass atau dashboard angka hardcoded. Pilih satu vertical slice dengan requirement, test, file sasaran dan acceptance jelas. Keputusan baru material dicatat ADR dan diperbarui pada semua kontrak terkait.

Status task: NOT_STARTED, IN_PROGRESS, IMPLEMENTED_UNVERIFIED, VERIFIED_LOCAL, BLOCKED, DONE_SCOPED. DONE_SCOPED harus menyebut capability/platform; tidak berarti semua evidence. Uji NOT_RUN/PASS/FAIL/BLOCKED terpisah dari mode simulated/device/integration. Checkpoint per task: scope/requirement IDs, SHA/path, migration, commands yang benar dijalankan, hasil, evidence, blocker/PIC dan next action. Nama script di dokumen adalah kontrak target, bukan file yang diklaim telah ada.

Jangan menganggap desain API menggantikan implementasi backend. Nomor task adalah identitas, bukan urutan numerik wajib. T-18 NEXT tidak dieksekusi dalam prototype. Tidak ada dependensi task aktif kepada T-18. Ketersediaan perangkat/Admin membatasi bukti spesifik, bukan alasan menghentikan alur lokal yang dapat diselesaikan.

## 2. Milestone, dependensi dan gate

| Milestone | Vertical slice/deliverable | Task | Acceptance gate/bukti |
|---|---|---|---|
| M0 | Toolchain, seed24, role shell, spike native awal | T-01,T-02 | G0: version report, fixture manifest awal, mode/live guard, navigasi; spike Android/iOS atau blocker spesifik |
| M1 | Auth/tenant/registry, kontrak, idempotency/outbox | T-03,T-04,T-06 | G1: auth/tenant negative tests dan response-loss retry MySQL |
| M2 | Request→quote→approval→reservasi/B2B/delegasi | T-05,T-07–T-11,T-28 | G2: kalkulasi, mandat, race unit+driver dan delegasi; tidak ada accepted tanpa slot |
| M3 | Assignment→kamera→offline/tracking→handover | T-12–T-15,T-26 | G3: status/evidence asli backend, source jujur, upload durable; device gaps terdaftar |
| M4 | Biaya→invoice→proof→receipt→analytics/report/SaaS | T-16,T-17,T-19,T-27,T-29,T-30 | G4: ledger race/koreksi, oracle F-09, CSV/PDF privacy; tanpa provider pembayaran |
| M5 | Inbox/push dan Admin contract | T-20,T-21 | G5: harness+grant/revoke, push/inbox; actual gaps terpisah |
| M6 | Perangkat, performa, keamanan, restore | T-22,T-23,T-24 | G6: risk suite dan bukti terukur per capability/platform |
| M7 | Rehearsal dan discovery | T-25,T-31 | G7-A presentasi; G7-B perangkat/integrasi lengkap; keputusan bisnis terpisah |

### Dependency tambahan normatif

T-26 bergantung T-03,T-05,T-06,T-14; mulai spike renderer/camera pada T-01 tanpa menganggap fitur final. T-15 selesai sesudah T-26 untuk evidence link. T-27 bergantung T-06,T-17; T-19 tidak menunggu gateway, memakai T-15,T-16,T-17,T-27. T-28 bergantung T-03,T-07,T-08; daftar harian dilengkapi setelah T-27 tanpa membentuk siklus acceptance: permission service lebih dulu, projection setelah domain siap. T-29 bergantung T-16,T-19,T-27; T-30 bergantung T-26,T-29. T-22 akhir bergantung T-13,T-14,T-26,T-21; spike awal tetap T-01. T-25 bergantung seluruh deliverable lokal PROTO, termasuk T-28–T-30, dan laporan gap T-22–T-24. T-31 discovery masalah boleh sejak awal; demo usability setelah G7-A.

Fixture F-09 ditetapkan lengkap pada M0 sebagai spesifikasi; seeder tabel materialized bertahap mengikuti migration modul, dan seluruh oracle wajib cocok saat M4/G4. Jangan membuat tabel/angka dashboard palsu agar G0 terlihat lengkap.

## 3. Task baseline yang dipertahankan

### T-01 — Baseline, exact versions dan spike native awal

- Milestone: M0. Owner peran: BE + mobile. Status: IMPLEMENTED_UNVERIFIED — mobile: Expo SDK 57 dipin, lockfile, expo-doctor 21/21; backend belum dibuat.
- Dependensi: —.
- Requirement utama: PRO-01, INT-01.
- Pekerjaan: Baca instruksi repo; verifikasi PHP minimum dan MySQL; pin Expo/RN/Node; buat Composer/npm lockfiles, ADR dan environment matrix. Spike location pada development build dengan login uji sederhana; catat akses perangkat/provider yang belum ada.
- Keluaran/exit: Skeleton backend/mobile boot; version report; simulated/provider switches server; OpenAPI draft; minimal native location evidence atau blocker spesifik.
- Test terkait: TC-001.
- Batas: Tidak mengubah website; tidak menaikkan semua library independen; live payment guard aktif.

### T-02 — Seed deterministik dan mobile shell

- Milestone: M0. Owner peran: Full-stack. Status: VERIFIED_LOCAL — mobile shell tiga peran, fixture F-09 di adapter demo, oracle diuji Jest; seeder database belum.
- Dependensi: T-01.
- Requirement utama: TEN-06, MOB-01, MOB-04, NFR-11, PRO-02.
- Pekerjaan: Buat dua tenant, account B2B dan skenario fixture F-09 (24 request,14 order) dan oracle PRD; navigation per role, login screen, design tokens, loading/error/offline. Seeder memakai referensi clock; reset CLI guarded.
- Keluaran/exit: Fixture specification+manifest dan screen map; login aktual diselesaikan T-03, seeder schema bertahap dilengkapi per modul; labels PROTOTYPE/DEMO.
- Test terkait: TC-002, TC-003.
- Batas: Tidak ada tombol login-bypass publik atau reset production.

### T-03 — Auth, membership, policy dan audit

- Milestone: M1. Owner peran: BE. Status: NOT_STARTED — backend; layar masuk/daftar/lupa kata sandi hanya simulasi lokal.
- Dependensi: T-02.
- Requirement utama: TEN-01, TEN-02, TEN-03, TEN-04, NFR-01.
- Pekerjaan: Implementasikan Sanctum device sessions, expiry/revoke, tenant resolver, business membership, role policy, DTO per role, audit dan cache scope.
- Keluaran/exit: Negative tests API/queue/cache; device token storage; policy test matrix.
- Test terkait: TC-004, TC-005, TC-006, TC-007, TC-062.
- Batas: Satu kebocoran tenant/role memblokir task dependent yang memakai data privat.

### T-04 — Registry armada, driver dan biaya

- Milestone: M1. Owner peran: BE + mobile. Status: IMPLEMENTED_UNVERIFIED — frontend: registry armada baca saja; CRUD dan backend belum.
- Dependensi: T-03.
- Requirement utama: FLT-01.
- Pekerjaan: CRUD unit/driver/partner/customer vehicle; ukuran/capacity/source; status out_of_service; cost template dan resource lock row.
- Keluaran/exit: Fixture U1/U2/U3; layar registry; API validation dan unit eligibility inputs.
- Test terkait: TC-018.
- Batas: Unknown bukan nol; partner registry tidak berarti ketersediaan live.

### T-05 — Permintaan dan pihak layanan

- Milestone: M2. Owner peran: Full-stack. Status: IMPLEMENTED_UNVERIFIED — frontend: permintaan lintas kanal di adapter demo.
- Dependensi: T-04,T-06.
- Requirement utama: ORD-01, ORD-02, ORD-03, ORD-04.
- Pekerjaan: Implementasikan request mobile/assisted, immediately/scheduled/flexible, condition review, parties dan source; form validation dan draft persistence awal.
- Keluaran/exit: Request lengkap/needs_review; source dan actor tersimpan; customer melihat scope sendiri.
- Test terkait: TC-008, TC-009.
- Batas: Tidak memberi ETA/price pasti untuk kondisi yang belum dinilai.

### T-06 — Kontrak, idempotency dan outbox

- Milestone: M1. Owner peran: BE. Status: IMPLEMENTED_UNVERIFIED — frontend: outbox lokal + idempotency di adapter; kontrak server belum.
- Dependensi: T-03.
- Requirement utama: ORD-05.
- Pekerjaan: Finalize OpenAPI envelope, middleware idempotency, optimistic version, transaction outbox dan consumer dedupe; generated TS client bila toolchain siap.
- Keluaran/exit: Replay/hash conflict tests; retry setelah response loss; contract lint dan errors.
- Test terkait: TC-010.
- Batas: Database unique invariant tetap ada meski key expiry.

### T-07 — Pricing dan simulasi negosiasi

- Milestone: M2. Owner peran: BE + mobile. Status: VERIFIED_LOCAL — rumus harga F-01/F-02 diuji Jest; tanpa backend.
- Dependensi: T-04,T-06.
- Requirement utama: QTE-01, QTE-02, QTE-03.
- Pekerjaan: Bangun cost calculation service tanpa floating point, target nominal/persen, confidence, label surplus, partner cost dan owner override komersial.
- Keluaran/exit: F-01/F-02 dan edge cases benar; UI rincian dan missing-data state.
- Test terkait: TC-012, TC-013, TC-014.
- Batas: Tidak menyebut surplus estimasi laba bersih atau mengasumsikan backhaul pasti.

### T-08 — Quote version dan change order

- Milestone: M2. Owner peran: Full-stack. Status: IMPLEMENTED_UNVERIFIED — frontend: versi penawaran dan biaya tambahan.
- Dependensi: T-05,T-07.
- Requirement utama: QTE-04, QTE-05, QTE-06.
- Pekerjaan: Buat send/accept intent, supersede/expiry, approval/assisted consent dan change order; acceptance capacity difinalisasi T-09.
- Keluaran/exit: Snapshot immutable, version conflict, unapproved change tidak masuk invoice.
- Test terkait: TC-015, TC-016, TC-017.
- Batas: Jangan mengklaim accept end-to-end selesai sebelum T-09.

### T-09 — Reservasi atomik dan pembatalan

- Milestone: M2. Owner peran: BE. Status: NOT_STARTED — reservasi atomik adalah tugas backend; frontend hanya mensimulasikan bentrok.
- Dependensi: T-08,T-04,T-06.
- Requirement utama: ORD-06, FLT-04, FLT-06, NFR-05.
- Pekerjaan: Resource lock unit+driver, overlap/buffer/timezone, atomic quote confirmation; cancel/abort guard; priority price/commitment consent.
- Keluaran/exit: MySQL concurrent tests, rollback quote saat conflict, release capacity yang sah.
- Test terkait: TC-010, TC-011, TC-020, TC-021, TC-023, TC-069.
- Batas: Tidak memakai SQLite untuk membuktikan locking MySQL.

### T-10 — Rekomendasi unit dan alternatif

- Milestone: M2. Owner peran: BE + mobile. Status: IMPLEMENTED_UNVERIFIED — frontend: kelayakan unit sebelum peringkat.
- Dependensi: T-07,T-09.
- Requirement utama: FLT-09, QTE-07, FLT-02, FLT-03.
- Pekerjaan: Filter keras lalu ranking biaya/ETA; alasan rekomendasi; pilih alternatif membuat quote baru dan recheck availability.
- Keluaran/exit: Unit murah tak layak ditolak; unknown review; dua kandidat layak dibandingkan bila data tersedia.
- Test terkait: TC-018, TC-019.
- Batas: Tidak ada auto-override capacity atau algoritme AI yang tak bisa dijelaskan.

### T-11 — Program pelanggan bisnis

- Milestone: M2. Owner peran: Full-stack. Status: IMPLEMENTED_UNVERIFIED — frontend: akun bisnis, PO, penyetuju.
- Dependensi: T-05,T-08,T-09.
- Requirement utama: ORD-07, BIZ-01, BIZ-02, BIZ-03, BIZ-04, BIZ-05, BIZ-06.
- Pekerjaan: Business accounts/members, requester/approver, versioned rate card, terms/reference, favorites, reorder dan scoped history.
- Keluaran/exit: B2B scenario lengkap; expired rate card, approval dan tenant boundaries diuji.
- Test terkait: TC-038, TC-039, TC-040, TC-041.
- Batas: Pelanggan tidak menerima margin; requester tanpa mandat tidak accept.

### T-12 — Assignment sendiri dan mitra

- Milestone: M3. Owner peran: Full-stack. Status: IMPLEMENTED_UNVERIFIED — frontend: tawaran, terima/tolak, alihkan.
- Dependensi: T-09.
- Requirement utama: FLT-05.
- Pekerjaan: Offer/accept/reject/revoke; partner acceptance assisted; reassign lock old/new resource; old driver access dicabut.
- Keluaran/exit: Assignment history, driver task list, partner pricing internal dan audit.
- Test terkait: TC-022.
- Batas: Offer belum accepted tidak ditampilkan pasti berangkat.

### T-13 — Tracking device, simulator dan realtime

- Milestone: M3. Owner peran: Mobile + BE. Status: IMPLEMENTED_UNVERIFIED — frontend: peta langsung per peran dengan replay F-06; tracking HP latar belakang dan realtime belum.
- Dependensi: T-12,T-03.
- Requirement utama: OPS-02, OPS-06, NFR-04.
- Pekerjaan: Location ingestion batch, latest projection, freshness UI, private epoch channels, maps adapter, source labels dan start/stop lifecycle.
- Keluaran/exit: Device→API→viewer vertical slice; duplicate/out-of-order tests; simulator route tool guarded.
- Test terkait: TC-025, TC-026.
- Batas: Simulator bukan bukti background; tidak memalsukan posisi saat unavailable.

### T-14 — Offline outbox dan recovery

- Milestone: M3. Owner peran: Mobile + BE. Status: IMPLEMENTED_UNVERIFIED — frontend: antrean kirim ulang persisten di HP.
- Dependensi: T-06,T-12.
- Requirement utama: OPS-03, MOB-03, NFR-06.
- Pekerjaan: SQLite outbox+files, per-aggregate drain, dependencies, retry/backoff, auth/version conflict handling, restart recovery dan cache clearing.
- Keluaran/exit: Airplane-mode→restart→reconnect tests; no double event/expense; pending review screen.
- Test terkait: TC-027, TC-028.
- Batas: Offline accept/reserve/paid tetap dilarang.

### T-15 — Execution, incident dan bukti

- Milestone: M3. Owner peran: Full-stack. Status: IMPLEMENTED_UNVERIFIED — frontend: tahap perjalanan, kendala, serah-terima.
- Dependensi: T-12,T-13,T-14,T-26.
- Requirement utama: OPS-01, OPS-04, OPS-05.
- Pekerjaan: State machine, readiness, photo upload/private read, incident PIC, handover accepted/disputed, closure with outstanding.
- Keluaran/exit: Normal+aborted+disputed trip; unauthorized file denial; watermark evidence metadata.
- Test terkait: TC-024, TC-029, TC-062.
- Batas: Driver tidak harus berinteraksi saat mengemudi; tidak auto-complete karena timer.

### T-16 — Biaya aktual dan contribution

- Milestone: M4. Owner peran: BE + mobile. Status: IMPLEMENTED_UNVERIFIED — frontend: biaya aktual dan kontribusi sementara/final.
- Dependensi: T-15,T-07.
- Requirement utama: QTE-08, FIN-01, FIN-02.
- Pekerjaan: Expense approval, advance+return settlement, estimate-vs-actual, provisional flags dan contribution report.
- Keluaran/exit: F-08 settlement; snapshot estimate tetap; net revenue/refund benar.
- Test terkait: TC-042, TC-043, TC-044.
- Batas: Advance bukan expense; data belum final tidak diberi label final.

### T-17 — Fondasi invoice dan ledger manual

- Milestone: M4. Owner peran: Full-stack. Status: VERIFIED_LOCAL — ledger domain diuji Jest; tanpa database.
- Dependensi: T-15,T-08,T-06.
- Requirement utama: PAY-01, PAY-02, PAY-05, PAY-06.
- Pekerjaan: Schema dan domain services invoice/ledger: issue bernomor immutable, allocation/credit/reversal/refund invariants, saldo derived. T-27 memakai service ini untuk UI/API request-proof-review; tidak membuat ledger kedua.
- Keluaran/exit: Invoice DEMO dan unit/integration primitives ledger; alur pengguna pembayaran, receipt history dan negative E2E diselesaikan bersama T-27 sebelum G4.
- Test terkait: TC-030, TC-031, TC-035, TC-036, TC-037.
- Batas: Tidak ada faktur pajak/uang nyata; screenshot bukan verified receipt.

### T-18 — Integrasi gateway (NEXT; ID historis)

- Scope NEXT; status DEFERRED, tidak punya gate prototype. Requirement PAY-03/PAY-04/PAY-07. Alasan: instruksi terbaru mengganti dependency gateway dengan manual-demo payment T-27. TC-032/033/034/063 disimpan sebagai histori deferred, tidak dieksekusi sebagai syarat kelulusan.

### T-19 — SaaS preview dan laporan B2B

- Milestone: M4. Owner peran: BE + mobile. Status: IMPLEMENTED_UNVERIFIED — frontend: pratinjau langganan dan rekap B2B.
- Dependensi: T-15,T-16,T-17,T-11,T-27.
- Requirement utama: BIZ-08, SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06.
- Pekerjaan: Plan snapshot, usage eligibility, subscription-vs-success, credit entries, expiry grace, preview SaaS invoice dan owner/B2B summary DTO.
- Keluaran/exit: Tenant A/B charges DEMO; duplicate handover once; account report hides margin customer.
- Test terkait: TC-042, TC-045, TC-046, TC-047, TC-048, TC-049.
- Batas: Tidak ada checkout langganan live; commercial rates tidak dianggap disetujui.

### T-20 — Solveit Admin connector

- Milestone: M5. Owner peran: BE + web. Status: NOT_STARTED — hanya layar contoh akses dukungan; Solveit Admin aktual BLOCKED.
- Dependensi: T-13,T-19,T-03.
- Requirement utama: TEN-05, ADM-01, ADM-02, ADM-03, ADM-04.
- Pekerjaan: Platform API, signed actor assertion, grants, tickets, monitoring summary; harness lalu actual website adapter+UI sesuai repo policy.
- Keluaran/exit: Contract proof dan dua commit SHA saat aktual; revoke/scope tests; flag off default.
- Test terkait: TC-051, TC-052, TC-053, TC-064.
- Batas: Repo website belum ada: verified-admin BLOCKED; jangan klaim harness adalah actual Admin.

### T-21 — Push, inbox dan deep link

- Milestone: M5. Owner peran: Mobile + BE. Status: IMPLEMENTED_UNVERIFIED — frontend: kotak masuk simulasi dan deep link; push belum.
- Dependensi: T-12,T-15,T-17.
- Requirement utama: MOB-02, MOB-05.
- Pekerjaan: Expo notification token binding, provider receipts, preference, dedupe inbox dan deep link auth; mode simulated terpisah.
- Keluaran/exit: Foreground/background/terminated notification cases; unauthorized link denial.
- Test terkait: TC-050.
- Batas: Transport push bukan exactly-once; data sensitif tidak masuk payload.

### T-22 — Uji perangkat terkontrol

- Milestone: M6. Owner peran: QA + mobile. Status: IN_PROGRESS — emulator Android API 36 + Expo Go di HP pengguna; bukti perangkat fisik lengkap belum.
- Dependensi: T-13,T-14,T-21,T-26.
- Requirement utama: NFR-03, PRO-03.
- Pekerjaan: Jalankan matrix Android+iOS release build, locked screen, background, force-stop, battery saver, permission change dan reconnect.
- Keluaran/exit: Device report lengkap per case dengan timestamps, coverage/gaps dan limitation.
- Test terkait: TC-054.
- Batas: Test field dilakukan penumpang/petugas saat berhenti; simulator tidak menggantikan hasil device.

### T-23 — Load, performa dan observability

- Milestone: M6. Owner peran: BE + QA. Status: NOT_STARTED.
- Dependensi: T-13,T-20.
- Requirement utama: NFR-02, NFR-10, NFR-12.
- Pekerjaan: Generator isolated tenants, benchmark API/location/queue, startup/memory/battery/data measurement; budget metrics dan failure drills.
- Keluaran/exit: Raw results+summary reproducible; threshold pass/fail per NFR; hardware/build dicatat.
- Test terkait: TC-055, TC-056, TC-059, TC-064.
- Batas: Hanya lingkungan uji; jangan menyatakan kapasitas produksi dari satu run.

### T-24 — Restore, retention dan security review

- Milestone: M6. Owner peran: BE + QA. Status: NOT_STARTED.
- Dependensi: T-17,T-19,T-23.
- Requirement utama: NFR-07, NFR-09.
- Pekerjaan: Restore database+files ke instance bersih, cleanup retention, tenant/channel/file checks, secret scanning dan deployment hardening.
- Keluaran/exit: Restore manifest+counts; access test evidence; no critical blockers open.
- Test terkait: TC-057, TC-058.
- Batas: Tidak sekadar backup exit code; tidak destructive terhadap data produksi.

### T-25 — Demo, feedback dan handoff

- Milestone: M7. Owner peran: Product + QA + full-stack. Status: IN_PROGRESS — prototype demo frontend siap dicoba; rehearsal backend belum.
- Dependensi: T-16,T-19,T-20,T-21,T-22,T-24,T-28,T-29,T-30 (deliverable lokal dan laporan gap untuk eksternal).
- Requirement utama: NFR-08, PRO-04, PRO-05.
- Pekerjaan: Jalankan D-01–D-08, smoke sebelum presentasi, capture evidence yang disamarkan, feedback owner, limitations, checkpoint dan proposal capability matrix.
- Keluaran/exit: Demo-ready atau prototype-terbukti dinyatakan sesuai gate; semua requirement terhubung bukti atau gap.
- Test terkait: TC-060, TC-061.
- Batas: Dependensi external BLOCKED tetap dicatat; tidak menyatakan lengkap ketika perangkat/integrasi PROTO/Admin belum terbukti.

### T-26 — GPS Map Camera durable

- Milestone M3; PIC Mobile + BE; status NOT_STARTED.
- Dependensi: T-03,T-05,T-06,T-14.
- Requirement: CAM-01–CAM-06.
- Pekerjaan/deliverable: Camera/gallery adapter, file durable, metadata/source, original+overlay, upload packet/complete, scoped read. Preview/retake/notes/permission/storage/offline states.
- Acceptance gate: F-10 camera dan import; disk penuh tidak saved; kill/restart mempertahankan file; UUID retry satu packet. Android dan iOS evidence terpisah, snapshot synthetic bukan bukti kamera.
- Test/bukti: TC-065,TC-066,TC-067,TC-076; actual output, database delta, screenshot/video bila relevan, commit/build/perangkat dan limitations.
- Blocker: akses repo/perangkat/credential hanya jika diperlukan untuk bukti terkait, jangan mengubah status ke PASS simulasi.

### T-27 — Pembayaran internal manual dan aman

- Milestone M4; PIC BE + mobile/finance; status NOT_STARTED.
- Dependensi: T-06,T-17.
- Requirement: PAY-09–PAY-12, PAY-02, PAY-05, PAY-06.
- Pekerjaan/deliverable: Instruksi nonpayable, payment request/ref/expiry, proof review, receipt+allocation locks, partial/overpay/late/reject/reverse/refund/custody. QR detail internal bukan QRIS.
- Acceptance gate: Tidak ada provider credential/API; F-11 expected ledger; verify concurrent satu efek, evidence tidak paid; expiry bukan bukti tidak diterima.
- Test/bukti: TC-068,TC-069,TC-070,TC-071,TC-077; actual output, database delta, screenshot/video bila relevan, commit/build/perangkat dan limitations.
- Blocker: akses repo/perangkat/credential hanya jika diperlukan untuk bukti terkait, jangan mengubah status ke PASS simulasi.

### T-28 — Delegasi dan daftar tindakan

- Milestone M2 lalu projection M4; PIC BE + mobile; status NOT_STARTED.
- Dependensi: T-03,T-07,T-08.
- Requirement: FIN-04,FIN-05,TEN-07.
- Pekerjaan/deliverable: Fixed scope/limit/expiry/revoke, owner driver context, server permission commit-time; action list turunan dengan PIC/reason.
- Acceptance gate: F-12 admin dalam limit boleh, A2 tanpa izin denied; revoke/expiry; tidak self-approve payment; daftar tidak menduplikasi sumber.
- Test/bukti: TC-072; actual output, database delta, screenshot/video bila relevan, commit/build/perangkat dan limitations.
- Blocker: akses repo/perangkat/credential hanya jika diperlukan untuk bukti terkait, jangan mengubah status ke PASS simulasi.

### T-29 — Analytics dari ledger sumber

- Milestone M4; PIC BE/data + mobile; status NOT_STARTED.
- Dependensi: T-16,T-19,T-27.
- Requirement: ANA-01–ANA-04,FIN-06.
- Pekerjaan/deliverable: ReportingReadService M-01–M-12, as_of/timezone/correction, source drill-down dan completeness, role-safe DTO.
- Acceptance gate: Oracle F-09 cocok per tenant; final7/9, provisional null; period/correction/empty filters; no hardcoded totals.
- Test/bukti: TC-073,TC-078; actual output, database delta, screenshot/video bila relevan, commit/build/perangkat dan limitations.
- Blocker: akses repo/perangkat/credential hanya jika diperlukan untuk bukti terkait, jangan mengubah status ke PASS simulasi.

### T-30 — Template PDF/CSV yang dapat dibagikan

- Milestone M4; PIC BE + QA; status NOT_STARTED.
- Dependensi: T-26,T-29.
- Requirement: RPT-01,RPT-02.
- Pekerjaan/deliverable: Fixed template jobs, snapshot filters, authorized download, DEMO, redacted photo derivative, formula escape CSV.
- Acceptance gate: Dokumen operator/customer sesuai izin; total sama snapshot analytics; no arbitrary URL renderer; revoked user tak download.
- Test/bukti: TC-074; actual output, database delta, screenshot/video bila relevan, commit/build/perangkat dan limitations.
- Blocker: akses repo/perangkat/credential hanya jika diperlukan untuk bukti terkait, jangan mengubah status ke PASS simulasi.

### T-31 — Discovery dan pencatatan bukti produk

- Milestone M7 / discovery awal; PIC Product/BA; status NOT_STARTED.
- Dependensi: T-25 untuk demo; tanpa dependensi untuk interview.
- Requirement: PRO-04,PRO-05.
- Pekerjaan/deliverable: Rekrut/observasi sesuai VALIDATION_PLAN tanpa mengklaim kontak sudah dilakukan; task script, baseline, outcome dan next decision.
- Acceptance gate: Hipotesis/problem/usability/WTP/onboarding terpisah, semua angka target eksperimen, founder bias tercatat. Tidak menganggap demo ROI.
- Test/bukti: TC-079; actual output, database delta, screenshot/video bila relevan, commit/build/perangkat dan limitations.
- Blocker: akses repo/perangkat/credential hanya jika diperlukan untuk bukti terkait, jangan mengubah status ke PASS simulasi.

## 4. Exit gates dan checkpoint

G0–G6 bukan klaim sudah lulus. Evidence matrix menyebut local vs device vs actual integration untuk setiap requirement. G7-A memerlukan semua alur D-01–D-08 yang dipresentasikan berjalan backend/database, auth/isolation/financial/reservation invariants lolos, fixture/report benar, reset+backup restore minimum terbukti, tidak ada S0/S1, serta known-limitations slide yang menyebut capability Android/iOS/Admin/maps/push yang simulated/blocked. Kemampuan PROTO yang belum dibuktikan tidak dihilangkan; bisa dipresentasikan sebagai simulasi dengan label, tidak dilaporkan complete.

G7-B memerlukan tambahan semua PROTO teruji sesuai jenis bukti, kamera/offline/background pada Android fisik dan iPhone fisik, push/maps provider aktual bila diklaim digunakan, Admin aktual dan semua critical tests lulus. Gateway, QRIS live, marketplace dan fitur NEXT tidak pernah menjadi gate G7-A/G7-B. Jika repo Admin tidak tersedia, ADM actual tetap BLOCKED dan G7-B belum lulus; G7-A boleh menggunakan harness berlabel.

Checkpoint minimal per milestone: commit, dependency lock report, migrations/seed version, completed tasks dengan evidence, tests PASS/FAIL/BLOCKED/NOT_RUN per platform/mode, defect severity, keputusan scope, langkah reset/rollback, next runnable task. Security/financial failure tidak ditutup hanya dengan screenshot. Estimates jadwal belum dikunci karena repo/tim/perangkat belum diverifikasi; setelah T-01 pecah task menjadi ukuran1–3hari kerja sebagai perencanaan, bukan janji delivery.

## 5. Handoff dan perubahan

Artefak implementasi nanti: enam dokumen2.1, source+lockfiles, OpenAPI/event schemas, seeder/oracle, actual test commands, installation Android+iOS, screenshots berlabel, evidence index, restore/runbook, privacy retention config dan known limitations. Semua yang belum ada tetap backlog, jangan menuliskan command fiktif sebagai berhasil.

Perubahan setelah feedback: catat masalah/bukti/persona/frekuensi/impact, pilih perbaikan alur sebelum menambah fitur, revisi ID bila semantik berubah, dan sinkronkan PRD/model/API/task/test/validation. Review kelanjutan bisnis tidak otomatis lulus karena G7-B teknis lulus. Pilot berbayar memerlukan dokumen scope/izin/kontrak baru dan hasil VALIDATION_PLAN.
