# INTEGRATION_PLAN — Tovv

## Provenance, versi dan batas bukti

Paket **2.1 — 21 Oktober 2026**. Produk **Tovv**; pemilik, pengembang dan penerbit **Solveit Indonesia**. Status dokumen: spesifikasi/rencana; bukan bukti aplikasi sudah dibuat atau diuji.

Baseline yang benar-benar dibaca: PRD v2.0 (file sumber PRD(2).md, identik dengan salinan PRD (1).md), ARCHITECTURE, IMPLEMENTATION_PLAN, INTEGRATION_PLAN dan TEST_PLAN masing-masing berlabel v1.0 dengan acuan PRD v2.0. Tidak ditemukan versi lebih baru. VALIDATION_PLAN.md tidak ditemukan setelah pencarian nama; dokumen itu **disusun kembali**, bukan hasil pemeriksaan file lama. Pesan pengguna terbaru mengungguli baseline. Seluruh enam dokumen kini memakai versi paket 2.1.

Urutan baca: [PRD](PRD.md) → [ARCHITECTURE](ARCHITECTURE.md) → [INTEGRATION_PLAN](INTEGRATION_PLAN.md) → [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) → [TEST_PLAN](TEST_PLAN.md) → [VALIDATION_PLAN](VALIDATION_PLAN.md). PRD menguasai scope/aturan bisnis; kontrak dan model harus mematuhinya. Perubahan mengharuskan pembaruan requirement, task, test, fixture dan keputusan terkait pada paket yang sama.
## Catatan implementasi (23 Oktober 2026)

Belum ada integrasi nyata: aplikasi mobile memakai adapter demo lokal. Untuk peta (§6), frontend memakai react-native-maps dengan penyedia bawaan OS (Google Maps di Android, Apple Maps di iOS); di Expo Go tidak perlu API key, tetapi build Android produksi memerlukan API key Google Maps sehingga DEC-08 (biaya dan kebijakan provider) tetap terbuka. Untuk auth (§4), layar masuk/daftar/lupa kata sandi saat ini simulasi lokal berlabel demo, bukan sesi perangkat dari server. Status per task: [IMPLEMENTATION_PLAN §0](IMPLEMENTATION_PLAN.md).

## 1. Matriks integrasi dan bukti

Semua status awal NOT_RUN atau BLOCKED jika akses memang belum tersedia. `device/provider` menunjukkan sumber runtime, **bukan** hasil test. Transaksi manual_demo berjalan pada backend nyata tetapi tidak membuktikan dana bank diterima.

| ID/kemampuan | Sumber/provider | Mode demo | Credential | Fallback dan batas | Pembuktian |
|---|---|---|---|---|---|
| I-01 Mobile/API | Laravel Tovv | local/demo backend nyata | device token, TLS | cache read pending, bukan fake success | Auth, MySQL E2E, idempotency, contract |
| I-02 Lokasi/tracking | Expo Location+TaskManager | device atau replay terpisah | izin OS, dev build/signing | stale/unknown; replay hanya dipilih eksplisit | Android+iOS foreground/background, FP matrix |
| I-03 Peta/ETA/geocode | react-native-maps; adapter provider ditetapkan T-01 | simulated/manual atau provider | key restricted, budget | koordinat teks/manual; ETA unavailable; map failure bukan capture failure | Provider request actual bila ada + error/quota cases |
| I-04 Pembayaran internal | Tovv Finance service | manual_demo | actor finance, tanpa key bank | proof pending hingga review manusia | Full/partial/late/reject/race; saldo DB |
| I-05 Notifikasi | Inbox DB + Expo Notifications | simulated inbox atau provider | push credentials per platform | inbox in-app, tidak janji push pasti | Android/iOS receipt/deep-link actual terpisah |
| I-06 Media/PDF/CSV | Storage privat + renderer | local S3-compatible/demo | server storage credential | durable pending jika down; retry | Original/overlay/hash/read policy/export actual |
| I-07 Solveit Admin | Website BFF atau harness | ADMIN STUB hingga repo aktual | assertion keys+owner grant | unavailable+last refresh; mobile independen | Contract harness; actual dua SHA terpisah |
| I-08 SaaS preview | Tovv usage ledger | DEMO only | owner token | tidak ada checkout | Plan snapshot/usage/credit, tanpa pungutan |
| I-09 GPS Map Camera | expo-camera/FileSystem/ImagePicker/overlay adapter | capture device atau synthetic media fixture | kamera/foreground location izin | gallery berlabel, lokasi unknown, peta opsional | Camera/gallery, low storage, restart, overlay dua OS |
| I-10 Internal payment QR | QR renderer dan app deep link | detail demo nonpayable | login/scope request | tombol detail invoice; no funds | Decode hanya tovv-demo URI, authz, expiry |

QRIS live, gateway, scraping bank dan webhook payment adalah NEXT, **tidak ada credential/tes/gate wajib** untuknya. Tidak perlu API eksternal untuk menjalankan demo pembayaran. Provider maps/push boleh blocked sambil presentasi memakai mode simulasi yang terlihat; G7-B tidak boleh menganggapnya integrasi aktual.

## 2. Kontrak API umum

Base path `/api/v1`. HTTPS untuk device remote/demo. UTF-8 JSON; waktu ISO 8601 UTC dengan suffix Z, zona bisnis field IANA terpisah. Money string integer IDR, misalnya `"3200000"`; jarak meter, berat kg, dimensi mm, accuracy meter. ID opaque string. Enum status mengikuti PRD.

Auth mobile: `Authorization: Bearer <device-token>`. Tenant context: `X-Tenant-ID`, hanya diterima jika membership sah. Request ID dibuat server bila client tidak memberi ID valid. Mutation kritis memerlukan `Idempotency-Key` UUID. Resource mutation membawa `expected_version` integer.

```json
{
  "data": {"id":"ord_demo_01","status":"confirmed","version":3},
  "meta": {"request_id":"req_example","server_time":"2026-10-21T05:00:00Z","environment":"demo","integration_mode":"manual_demo","dataset_generation":"tovv-2.1-f09"}
}
```

Error envelope:

```json
{
  "error": {
    "code":"CAPACITY_CONFLICT",
    "message":"Unit sudah digunakan pada waktu yang dipilih.",
    "fields":{},
    "retryable":false
  },
  "meta":{"request_id":"req_example"}
}
```

| HTTP | Penggunaan |
|---|---|
| 200/201 | Read/mutation selesai; replay memakai status hasil awal dengan header Idempotent-Replayed:true |
| 202 | Pekerjaan async diterima; sertakan job/resource status URL, bukan success final |
| 400 | JSON/header malformed |
| 401 | Token invalid/expired; jangan infinite retry |
| 403 | Actor tidak berwenang pada operasi; 404 untuk objek tenant lain agar keberadaannya tidak bocor |
| 409 | Versi/kapasitas/idempotency conflict; client meminta review |
| 422 | Validasi field/bisnis, termasuk unit tidak layak |
| 429 | Rate limit; Retry-After |
| 503 | Provider atau layanan sementara tidak tersedia; tidak diganti paid/live palsu |

List memakai cursor dan limit default 20, max 100. Filter selalu tenant-scoped. Jangan mengirim seluruh dataset. Status response berbeda per role: margin/cost tidak pernah ada pada customer DTO.


## 3. Endpoint minimum

Kontrak target; belum ada klaim endpoint telah tersedia. Semua mutation sensitif memakai Idempotency-Key, expected_version, tenant policy dan server timestamp. Response memasukkan resource/version dan affected balances hanya setelah commit. Body money string integer IDR; reject unknown fields yang dapat memengaruhi otorisasi.

| Endpoint relatif /api/v1 | Aktor/guard | Hasil/efek |
|---|---|---|
| POST /auth/device-sessions; DELETE /auth/device-sessions/{id}; GET /me/contexts | sesi sah/rate limit | token7hari default, revoke dan konteks berizin |
| GET/POST /requests; PATCH /requests/{id} | own customer/dispatcher | draft/assisted channel/party, expected_version |
| POST /requests/{id}/recommendations; GET /requests/{id}/nearby | dispatcher/customer DTO terbatas | eligible own/managed, timestamp, alasan; tidak reserve |
| POST /requests/{id}/quotes; POST /quotes/{id}/send, /accept | quote manager/approver | snapshot versi dan accept+reserve atomik |
| POST /orders/{id}/change-orders; POST /change-orders/{id}/approve | dispatcher dan approver | biaya baru billable sesudah approval |
| POST /orders/{id}/assignments; POST /assignments/{id}/accept, /reject | dispatcher/driver aktif | offer/history/reassign, revoke akses lama |
| POST /assignments/{id}/events; /locations/batch | driver aktif/version | validasi per event/status/clock, dedupe |
| GET /orders/{id}/tracking | owner/own customer/granted support | role-safe snapshot freshness/source/stage |
| POST /orders/{id}/handovers, /cancel, /abort | pelaksana/dispatcher sesuai policy | state/custody/evidence, no auto payment |
| POST /media-packets | owner resource/customer request/driver | bind client_media_id, metadata immutable/version |
| PUT /media-packets/{id}/objects/{kind} | uploader authorized | multipart original/overlay, hash, duplicate replay |
| POST /media-packets/{id}/complete | current/historical upload policy | validate objects/link, ready atau needs_review |
| GET /media/{objectId}/content | object policy tiap akses | private content, tidak public URL |
| POST /orders/{id}/historical-evidence | uploader saat tugas yang terverifikasi | review only setelah reassign; tidak mutate execution |
| GET/POST /business-accounts; /{id}/rate-cards, /members, /favorite-routes | operator/org admin izin spesifik | versions/terms/mandat |
| POST /orders/{id}/reorder | own/B2B | request draft baru, reprice/reapprove |
| POST /orders/{id}/actual-costs, /cash-advances; POST /cash-advances/{id}/settlements | driver submit/finance approve | expense bukan advance; approval/reversal audit |
| POST /orders/{id}/invoices; POST /invoices/{id}/issue | finance | immutable snapshot/unique numbering |
| GET/POST /payment-instructions | customer read relevant/owner manage | versi DEMO nonpayable |
| POST /invoices/{id}/payment-requests; GET /payment-requests/{id} | finance/create, own payer/read | amount<=outstanding, invoice_version, ref, expiry |
| POST /payment-requests/{id}/cancel | finance | reason; tidak menghapus bukti/receipt |
| POST /invoices/{id}/payment-proofs | customer atau assisted actor | pending_review/flagged_review saja |
| POST /payment-proofs/{id}/verify, /reject | payments.verify | amount/custody/reason, receipt atomic atau rejected |
| POST /receipts/{id}/reverse | payments.correct | reversal/alokasi atomik, reason, dependency guard |
| POST /receipts/{id}/allocations | finance | same tenant/customer, cap available/outstanding, request review |
| POST /invoices/{id}/credit-notes; POST /receipts/{id}/refund-records | finance/correct | keputusan demo dan ledger, tidak transfer |
| GET/POST /delegations; DELETE /delegations/{id} | owner grant/revoke | scopes/limit/expiry/reason; no re-delegate |
| GET /daily-actions | user sesuai izin | source/PIC/reason/due/action, dedupe |
| GET /analytics/summary, /analytics/rows | owner/finance/B2B DTO | metric_id, formula_version, filter, as_of, coverage |
| POST /exports; GET /exports/{id}; GET /exports/{id}/content | report scope | template enum, filter, async, reauth download |
| GET /saas/usage, /saas/invoice-preview; POST /saas/plan-changes | owner | DEMO snapshot, no live billing |
| POST /support-access-approvals; DELETE /support-access-approvals/{id} | tenant owner | actor/scopes/expiry, approval satu kali/revoke grant |
| POST /realtime/tickets; POST /broadcasting/auth | current actor/grant | epoch<=60detik dan channel scope |

Asset/driver/partner CRUD tetap PROTO FLT-01: GET/POST /fleet/units, /fleet/drivers, /fleet/partners; PATCH /{id} expected_version. Archive aset historis, jangan DELETE cascade pekerjaan. Semua path final dicatat OpenAPI sebelum consumer selesai. Endpoint `/payment-attempts` dan webhook provider lama tidak disediakan di PROTO; jangan mengembalikan sukses stub yang menyiratkan provider aktif.

### 3.1 Contoh kontrak pembayaran

```json
{
  "invoice_version":2,
  "requested_amount":"500000",
  "currency":"IDR",
  "expires_at":"2026-10-22T05:00:00Z",
  "instruction_version_id":"instr_demo_A_v1",
  "mode":"manual_demo"
}
```

Server menghasilkan payment_request_id/reference/outstanding_snapshot/allowed_actions. Proof submit mengirim payment_request_id nullable (tunai assisted), invoice_id, amount_claimed, method=transfer_demo/cash_demo, reference_claimed, event_at, media_packet_id nullable untuk cash, assisted_reason; server menambahkan submitted_by/received_at/status. Verify mengirim expected_version, amount_verified, received_event_at, custody=operator_demo/driver_demo, review_reason, duplicate_reference_resolution nullable. Payload tidak dapat mengirim receipt status posted untuk memaksa saldo.

Concurrent key yang masih diproses mengembalikan409 IDEMPOTENCY_IN_PROGRESS (retryable=true, Retry-After); payload sama diulang dengan key sama. Error tambahan: INVOICE_VERSION_CONFLICT409, CAPACITY_CONFLICT409, PROOF_ALREADY_REVIEWED409 (replay key sama mengembalikan hasil lama), DUPLICATE_REFERENCE_REVIEW_REQUIRED422, INSUFFICIENT_RECEIPT_BALANCE409, DEPENDENT_FINANCIAL_ENTRY409, DEMO_ONLY422, DATASET_GENERATION_MISMATCH409. Response setelah verify berisi proof/receipt/allocation IDs, outstanding, unapplied dan posted_at. UI fetch canonical snapshot jika response hilang, tidak membuat receipt lokal.

### 3.2 Contoh kontrak kamera

```json
{
  "client_media_id":"demo-cam-A15-001",
  "request_id":"R-A15",
  "order_id":null,
  "customer_vehicle_id":"V-A15",
  "stage":"request_condition",
  "capture_origin":"camera",
  "event_at":"2026-10-21T04:59:00Z",
  "device_captured_at":"2026-10-21T04:59:00Z",
  "device_recorded_at":"2026-10-21T04:59:01Z",
  "location_captured_at":null,
  "timezone":"Asia/Jakarta",
  "latitude":null,"longitude":null,"accuracy_m":null,
  "location_source":"unknown",
  "note":"GPS tidak diizinkan; foto demo",
  "is_demo":true,
  "dataset_generation":"tovv-2.1-f09"
}
```

Actor/tenant/server_received_at ditentukan server. Source simulated hanya diterima route replay/fixture tooling berizin demo, tidak dipercaya dari driver biasa. `camera` berarti jalur capture aplikasi yang dilaporkan, bukan jaminan anti-tamper. Overlay metadata snapshot immutable; mengubah catatan kemudian menghasilkan revisi derivative, bukan menimpa original. Upload object per kind dengan Content-SHA256, mime/size; server menghitung hash sendiri.
## 4. Auth mobile dan sesi

Sanctum device token prototype memiliki expiry 7 hari (default configurable), bukan token abadi. Tidak mengklaim Sanctum menyediakan refresh-token/OIDC secara otomatis. Expired → login ulang; jangan menyimpan password di app. Logout menghapus credential lokal dan revoke server saat koneksi memungkinkan; logout offline menandai kebutuhan revoke dan mencegah penggunaan cache oleh akun lain.

Login server memeriksa rate limit. Token ability tidak menggantikan policy object/tenant. User yang revoked tidak boleh mengirim antrean seolah masih aktif. Pending event terkait disimpan needs_review lokal sampai sesi berwenang menanganinya; tidak dipindahkan ke tenant lain.

## 5. Kontrak lokasi dan realtime

Batch maksimal 100 event, body limit dikonfigurasi. Client mempertahankan event_id saat retry. Server mengembalikan hasil per event: accepted, duplicate, rejected dengan reason. Event ilegal tidak membatalkan seluruh event valid tanpa penjelasan.

```json
{
  "assignment_version":2,
  "events":[{
    "event_id":"loc_example_001",
    "captured_at":"2026-10-21T05:00:00Z",
    "latitude":-7.2575,"longitude":112.7521,
    "accuracy_m":12.5,"speed_mps":0,
    "source":"device"
  }]
}
```

Source simulated hanya diterima melalui endpoint/tools khusus demo dengan server policy, tidak cukup mengganti field source pada API driver. received_at ditambahkan server. Source lokasi event kanonik device/simulated; manual/stale/unknown berlaku pada foto/pilihan lokasi, dan freshness stale dihitung terpisah untuk tracking. Device GPS bukan bukti mutlak lokasi kendaraan atau anti-fraud. Field condition berasal dari status/incident petugas; tidak ditebak sebagai kecelakaan dari kecepatan nol.

Realtime event envelope:

```json
{
  "event_id":"evt_example",
  "type":"trip.location.updated.v1",
  "aggregate_id":"order_example",
  "version":17,
  "occurred_at":"2026-10-21T05:00:01Z",
  "recorded_at":"2026-10-21T05:00:02Z",
  "dataset_generation":"tovv-2.1-f09",
  "data":{"latitude":-7.2575,"longitude":112.7521,"captured_at":"2026-10-21T05:00:00Z","accuracy_m":12.5,"source":"device"}
}
```

Daftar event kanonik ada pada §8; contoh di atas harus juga menyertakan recorded_at dan dataset_generation saat kontrak diimplementasikan. Customer channel tidak menerima usage/cost event. Epoch/revoke mengikuti ARCHITECTURE ADR-010. Polling fallback untuk snapshot (misalnya 30 detik saat layar aktif) tetap bertimestamp dan tidak disebut koneksi live jika stale.

## 6. Maps, ETA dan navigasi

react-native-maps merender peta. Adapter geocoding/routes server mengembalikan provider, mode, distance_m, duration_s, fetched_at dan warnings. Provider awal yang disarankan Google Maps/Routes jika akun/budget tersedia; final credential dan SKU diverifikasi saat implementasi. Adapter simulated mengembalikan fixture deterministik berlabel simulated.

Batasi API key mobile dengan package/signing Android atau bundle iOS dan API yang digunakan. Server key terpisah, disimpan server dan dibatasi sumber akses. Public client key yang memang diperlukan SDK bukan dianggap secret server. Jangan memanggil Routes setiap update GPS; hitung saat quote/perubahan rute atau refresh dengan batas biaya.

Jangan menggunakan jarak garis lurus sebagai jarak jalan tanpa label. Rute umum tidak otomatis memperhitungkan tinggi/berat/jalan yang layak bagi truk; dispatcher mengonfirmasi jalur. Navigasi eksternal dibuka melalui deep link dengan lokasi yang diperlukan saja. Cache mengikuti ketentuan provider; TTL teknis tidak menggantikan lisensi penyimpanan data.


## 7. Pembayaran internal: integrasi dan batas

I-04 hanya modul Finance internal. Tidak ada panggilan bank/gateway, signature webhook, server key provider, checkout, payout atau payment reconciliation job sebagai dependency prototype. Review queue untuk manusia berbeda dari rekonsiliasi bank. Instruksi statis terversi dan permintaan dinamis mengacu invoice snapshot; decode QR internal hanya deep link detail dengan auth. Visual QRIS simulasi memakai ilustrasi tidak scannable sebagai payment payload, label TIDAK DAPAT DIBAYAR; jangan menyertakan nomor rekening nyata atau test bank credential.

PAY-03/04/07 dan PAY-13 NEXT memerlukan proposal integrasi terpisah sebelum dipakai. Kelulusan manual prototype tidak menyatakan kemampuan gateway/sandbox/QRIS. Rujukan resmi BI di PRD §10 menjadi batas istilah, bukan API yang dipanggil.

## 8. Media, notifikasi, event dan reporting

Media upload original<=20MiB, derivative<=5MiB, PDF<=15MiB. Magic bytes/mime/dimensi/decompression limits, random storage key, no filename path trust, no arbitrary remote-fetch pada PDF. Capture file cache dipindah ke durable directory sebelum outbox; thumbnail/customer derivative menghindari metadata sensitif. Gagal upload tidak menghapus original lokal. Server complete hanya sesudah paket wajib tersimpan dan checksum cocok. Read tiap object memeriksa policy, termasuk export job download.

Push minimal type/resource_id, tidak koordinat/margin. Device token terikat user/device/environment, invalid token dinonaktifkan. Inbox dedupe event_id; push tidak exactly-once, deep link tidak menambah hak. Preferensi routine notification tidak menghapus event bisnis. Upload bisa menunggu app aktif kembali; jangan menjamin background upload saat OS terminate.

Event envelope: event_id, type.v1, tenant context internal, aggregate_id, version, occurred_at, recorded_at, dataset_generation, data DTO role-safe. Emit hanya setelah commit via outbox. Domain events: quote.updated.v1, assignment.updated.v1, trip.status.updated.v1, trip.location.updated.v1, media.ready.v1, handover.updated.v1, invoice.updated.v1, payment-request.updated.v1, payment-proof.updated.v1, receipt.posted.v1, receipt.reversed.v1, refund.recorded.v1, delegation.revoked.v1, usage.updated.v1, export.ready.v1. Customer tidak menerima cost/usage/delegation internal; platform summary tidak menerima foto/raw GPS. Event bukan instruksi client untuk menghitung ledger tanpa fetch snapshot.

Analytics response menyebut metric_id, value (money string/count number/null), numerator, denominator bila relevan, completeness, formula_version, as_of, timezone, filters, source_row_count. Export response 202 job_id/status_url; file disediakan setelah auth dan labeled DEMO, filter konsisten dashboard. Tidak mengirim seluruh data tenant ke mobile untuk agregasi client.
## 9. Integrasi Solveit Admin aktual

### 9.1 Batas perubahan

Website tetap memakai frontend React/TS/Vite/Tailwind/React Router 7 ssr:false dan backend Laravel miliknya. Tambahkan route Admin `/admin/products/tovv` mengikuti router/auth yang sudah ada setelah membaca repo. Jangan menganggap path folder Admin, middleware/session atau grant system sudah tersedia. Tidak mengubah inquiry flag, SSR strategy, autentikasi existing atau schema website yang tidak terkait.

Routes privat mengambil data runtime; tidak memasukkan data tenant ke hasil static prerender. Secret integrasi hanya berada pada backend website. Tovv tetap berguna ketika BFF website down; mobile tidak melewati backend website.

### 9.2 Kontrak platform API Tovv

| Endpoint | Data | Scope |
|---|---|---|
| GET /platform/v1/health | Readiness, queue/outbox lag, adapter modes; tanpa secret | platform.health.read |
| GET /platform/v1/tenants | Tenant ID/name/status dan DEMO plan | platform.tenants.read |
| GET /platform/v1/summary | Aggregate order/usage/error dan updated_at | platform.summary.read |
| POST /platform/v1/support-grants | Buat grant untuk actor tenant scopes expiry reason | grant.create; owner approval pada aplikasi Tovv atau akun owner demo |
| DELETE /platform/v1/support-grants/{id} | Revoke grant | grant owner/revoker policy |
| GET /platform/v1/tenants/{id}/trips | Detail minimal perjalanan | support grant trips.read |
| GET /platform/v1/tenants/{id}/trips/{trip}/tracking | Tracking relevan | support grant location.read |
| POST /platform/v1/realtime-tickets | Ticket scoped tenant/order/epoch | Current grant yang sesuai |

Prototype integrasi read-only terhadap bisnis: tidak mengubah quote, invoice, payment, assignment atau billing dari platform Admin. Membuat/revoke grant adalah operasi akses yang diaudit. Grant memerlukan otorisasi owner Tovv; platform staff tidak membuat izin sendiri hanya dengan mengirim nama owner. Owner yang login pada Tovv menyetujui support-access approval dengan actor/scopes/expiry tertentu. POST platform support-grants membawa approval_id; server mengonsumsi approval satu kali, memeriksa kecocokan actor/tenant/scopes, lalu membuat grant aktif. Memperpanjang expiry membutuhkan persetujuan baru. Approval demo berasal dari owner seed yang tetap login, bukan boolean trusted dari BFF.

### 9.3 Identitas BFF → Tovv

Gunakan signed short-lived assertion JWS melalui library JOSE/JWT yang dipelihara dan dipin T-01; jangan menulis algoritme kriptografi sendiri. Initial keypair khusus demo, public key dipin pada Tovv config; alg allowlist RS256, tidak mengikuti alg/header key URL arbitrary.

Claims: iss=website-admin-demo, aud=tovv-platform-api, sub=immutable admin actor ID, service_client_id, request_id, scopes, optional tenant_id/grant_id, iat, exp≤60 detik, jti unik. BFF membuat assertion setelah sesi dan permission website diverifikasi. Tovv memverifikasi key, issuer/audience, waktu, nonce satu kali, client allowlist serta grant internal. Requested scopes diinterseksikan dengan allowed scopes, tidak dipercaya sepenuhnya. Body digest/method/path disertakan dan diverifikasi agar assertion terikat pada request.

Admin retry membuat assertion/jti baru; business idempotency key tetap sama. Secret/key private tidak pernah dikirim browser. Clock skew maksimum 30 detik; exp tetap diperiksa. Key rotation menggunakan kid yang dikenal; trust baru ditambahkan lalu key lama dicabut setelah TTL selesai. Standard OIDC/SSO penuh merupakan keputusan lanjutan, bukan klaim bahwa assertion prototype sudah memenuhi semua kebutuhan enterprise identity.

Service health bisa memakai actor sistem terdaftar; akses detail selalu membutuhkan actor manusia+grant. Websocket browser memakai ticket dari BFF setelah Tovv mengotorisasi; tidak memakai assertion BFF jangka panjang.

### 9.4 Tahap integrasi dan fallback

A. Publikasikan OpenAPI/platform fixture dan negative tests di repo Tovv.
B. Bangun harness contract lokal yang benar-benar mengakses Tovv, berlabel ADMIN STUB.
C. Saat repo website tersedia, baca instruksi repo/auth/router lalu implementasikan adapter server dan UI di repo website dengan flag `TOVV_ADMIN_ENABLED=false` default.
D. Jalankan actual end-to-end, compare contract dan revoke; catat kedua commit SHA.
E. Aktifkan flag hanya pada environment demo yang ditetapkan. Kegagalan koneksi tampil unavailable+last successful refresh.

Bukan verified-admin sampai C–E diuji. Akses repo yang belum diberikan tidak dibypass melalui asumsi kode. Tidak perlu menunda fitur Tovv lain karena dependensi Admin belum tersedia.


## 10. Konfigurasi dan readiness

| Config | Default | Guard |
|---|---|---|
| APP_ENV / PROTOTYPE_MODE | local,test,demo / true | allowlist environment; no public reset |
| PAYMENT_MODE | manual_demo | tidak ada gateway adapter di dependency graph |
| PAYMENT_LIVE_ENABLED / SAAS_BILLING_LIVE_ENABLED | false / false | build prototype menolak true |
| LOCATION_SOURCE_MODE | replay | device eksplisit, source per event; no silent fallback |
| MAPS_MODE / PUSH_MODE | simulated / simulated | provider perlu key+budget+uji aktual |
| TOVV_ADMIN_ENABLED | false pada website | hanya demo flag setelah contract integration |
| DEMO_CLOCK / DATASET_GENERATION | C0 / tovv-2.1-f09 | tidak mengubah clock security/token |
| API_ORIGINS / STORAGE_PREFIX | allowlist / demo-specific | no wildcard/private bucket; server secret only |

EXPO_PUBLIC_* bukan tempat secret. Keys maps mobile memang client-scoped dengan pembatas package/signature/bundle/API; server routes key terpisah. JOSE assertion private key hanya BFF server. Config native camera/location berubah memerlukan rebuild binary, tidak cukup OTA.

## 11. Versioning, migrasi dan evidence

OpenAPI3.1 dan event schema disimpan contracts/. Breaking enum/path memerlukan changelog dan update consumer; typed TS client dibuat setelah toolchain dipin. Perubahan prototype payment: payment_attempt/provider config/webhook inbox lama tidak menjadi tabel wajib; jika kode lama ternyata sudah ada, jangan drop data otomatis, buat migrasi preservasi/read-only legacy dan audit sebelum mengaktifkan contract baru. Endpoint manual lama dipetakan proof submit/verify bukan alias yang otomatis paid.

Evidence index: integration_id, mode, environment, commit_tovv, commit_website bila actual, build/OS/device, test_id, outcome, timestamp, sanitized evidence path, limitation, owner/next action. Harness PASS tetap simulated/verified-local, bukan verified-admin. Dua platform harus mempunyai baris terpisah. Tidak ada pengujian aktual yang telah diklaim pada paket dokumen ini.

Referensi resmi: [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/), [FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/), [Location](https://docs.expo.dev/versions/latest/sdk/location/), [Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [captureRef](https://docs.expo.dev/versions/latest/sdk/captureRef/), [Sanctum](https://laravel.com/docs/13.x/sanctum), [Reverb](https://laravel.com/docs/13.x/reverb), [React Router prerender](https://reactrouter.com/how-to/pre-rendering), [BI QRIS](https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/ritel/kanal-layanan/qris/default.aspx). Paket SDK dipilih sesuai versi framework yang dipin; link latest bukan bukti compatibility build.
