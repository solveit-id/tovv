# PRD — Tovv

## Provenance, versi dan batas bukti

Paket **2.1 — 21 Oktober 2026**. Produk **Tovv**; pemilik, pengembang dan penerbit **Solveit Indonesia**. Status dokumen: spesifikasi/rencana; bukan bukti aplikasi sudah dibuat atau diuji.

Baseline yang benar-benar dibaca: PRD v2.0 (file sumber PRD(2).md, identik dengan salinan PRD (1).md), ARCHITECTURE, IMPLEMENTATION_PLAN, INTEGRATION_PLAN dan TEST_PLAN masing-masing berlabel v1.0 dengan acuan PRD v2.0. Tidak ditemukan versi lebih baru. VALIDATION_PLAN.md tidak ditemukan setelah pencarian nama; dokumen itu **disusun kembali**, bukan hasil pemeriksaan file lama. Pesan pengguna terbaru mengungguli baseline. Seluruh enam dokumen kini memakai versi paket 2.1.

Urutan baca: [PRD](PRD.md) → [ARCHITECTURE](ARCHITECTURE.md) → [INTEGRATION_PLAN](INTEGRATION_PLAN.md) → [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) → [TEST_PLAN](TEST_PLAN.md) → [VALIDATION_PLAN](VALIDATION_PLAN.md). PRD menguasai scope/aturan bisnis; kontrak dan model harus mematuhinya. Perubahan mengharuskan pembaruan requirement, task, test, fixture dan keputusan terkait pada paket yang sama.
## 1. Identitas, positioning dan tujuan

Tovv adalah SaaS multi-tenant berbentuk satu aplikasi Android dan iOS untuk perusahaan towing/pengangkutan kendaraan. Empat kelompok tampilan: **Owner, Admin, Operator/driver, User/customer**. Izin tindakan lebih rinci daripada tampilan. Operator memiliki relasi pelanggan dan menjalankan jasanya; Solveit Indonesia menyediakan perangkat lunak. Ini lini produk tersendiri dari bisnis custom software dan Orbit.

Segmen discovery: operator dengan negosiasi manual, beberapa pelaksana sendiri/mitra kelolaan, dan pekerjaan pribadi maupun pelanggan bisnis berulang. Ukuran armada, volume, biaya administrasi dan harga berlangganan belum terbukti. Koneksi founder ke Surabaya Towing adalah akses discovery, bukan validasi pasar; nama/logo/data perusahaan nyata tidak menjadi seed. ATLAS disebut sebagai contoh positioning jaringan roadside assistance; prototype Tovv berfokus pada pengelolaan operator. Tidak ada klaim bahwa pesaing tidak mempunyai suatu fitur.

Tujuan: presentasi, demonstrasi alur nyata, proposal, pengumpulan masukan dan uji kegunaan/kebutuhan sebelum pilot. Semua aksi bisnis demo benar-benar diproses backend/database; semua data presentasi sintetis. Tovv tidak menjanjikan tambahan order, laba, penyelesaian klaim atau keberhasilan bisnis otomatis.

## 2. Batas scope dan bukti

- **PROTO**: wajib pada paket prototype; milestone awal boleh subset yang diumumkan.
- **NEXT**: evaluasi setelah bukti kebutuhan, bukan dependensi kelulusan prototype.
- **OUT**: di luar arah/batas saat ini; perlu keputusan produk baru untuk masuk.
- PROTO: satu kendaraan pelanggan dan satu unit pelaksana aktif per order, flatbed reguler dengan kelayakan diketahui, unit sendiri/mitra operator, histori pergantian, request berbagai kanal, harga/approval/kapasitas, perjalanan/bukti, finance manual, B2B, analytics, report dan Admin terbatas.
- Tidak ada uang nyata, langganan nyata, pengangkutan pelanggan berbayar dalam pengujian, atau klaim SLA/siap komersial. Kecelakaan berat/recovery yang tidak diketahui kelayakannya berhenti pada review manusia, bukan otomatis dianggap flatbed aman.

| Kemampuan ditunda | Scope | Alasan/batas |
|---|---|---|
| Marketplace nasional, pencarian lintas tenant, membership bantuan nasional/tanpa batas | OUT | Produk pengelolaan operator, bukan pengelola jaringan bantuan |
| Dompet, escrow, pencairan oleh Solveit, kredensial bank | OUT | Bukan penyelenggara pemindahan dana |
| AI pricing, optimasi armada, prediksi muatan pulang, analytics prediktif | NEXT | Memerlukan data dan bukti manfaat |
| GPS hardware, carrier multi-muatan | NEXT | Di luar bukti awal ponsel/satu kendaraan |
| Akuntansi/payroll/perpajakan penuh | OUT | Catatan operasional bukan pengganti sistem akuntansi/pajak |
| Integrasi WhatsApp otomatis, gateway, QRIS live, rekonsiliasi bank otomatis | NEXT | Demo tidak bergantung provider tersebut |
| White-label/fork tiap operator | OUT | Satu aplikasi multi-tenant; biaya pemeliharaan tidak dibenarkan |
| Report builder, sistem klaim, verifikasi foto forensik | NEXT | Template tetap dan dokumentasi dasar lebih dahulu |
| AI damage detection, OCR, pengenalan wajah, aplikasi kamera eksternal wajib | OUT | Tidak diperlukan untuk tujuan prototype |
| B2B credit limit, invoice gabungan, standing order, self-service onboarding/SSO enterprise | NEXT | Pertahankan baseline backlog tanpa memperbesar prototype |

| Label bukti | Arti |
|---|---|
| implemented | Kode/migration tersedia, belum berarti lulus |
| verified-local | Test aktual dengan backend/database lulus |
| verified-device | Bukti pada Android ATAU iOS tertentu; catat terpisah |
| verified-integration | Provider/kanal aktual yang disebut benar-benar diuji |
| verified-admin | Repository Solveit Admin aktual terhubung dan diuji |
| simulated | Replay, fixture, fake adapter atau ADMIN STUB; bukan bukti perangkat/integrasi aktual |
| blocked | Dependensi spesifik belum tersedia; bukan PASS |

**G7-A siap dipresentasikan** berbeda dari **G7-B seluruh kemampuan perangkat/integrasi PROTO terbukti**. G7-A dapat memakai replay/maps stub/Admin harness yang diumumkan, tetapi transaksi bisnis, isolasi dan angka laporan harus nyata pada backend. G7-B menambah bukti Android+iOS dan integrasi PROTO aktual yang memang dipakai, termasuk Admin bila belum tersedia. Tidak ada gate payment gateway. Semua task awal NOT_STARTED; semua uji aplikasi NOT_RUN.

## 3. Stack, repositori dan kewenangan

React Native + TypeScript strict + Expo development builds/Router; TanStack Query; SQLite dan durable file/outbox; SecureStore. Laravel 13 API, PHP 8.5.x minimum 8.5.7, MySQL 8.4 LTS, Redis queue/cache, Laravel Reverb, storage media privat. Baseline dipertahankan; exact Expo/RN/Node/package ditetapkan kompatibel pada T-01, bukan menaikkan versi agar terbaru.

Repo Tovv terpisah: mobile/, backend/, contracts/, tools/admin-harness/, infra/, docs/. Enam file standar ini di root. Website tetap repo frontend/ React TS strict, Vite, GSAP, Tailwind v4, React Router 7 framework mode prerender ssr:false dan backend/ Laravel tersendiri. Inquiry flag default off dan status deploy-nya tidak berubah. Mobile langsung ke Tovv API; Admin melalui backend website/BFF, tanpa shared database.

| Tampilan | Kemampuan rinci | Batas wajib |
|---|---|---|
| Owner | Harga/biaya, delegasi, personel, laporan, plan preview | Hanya tenant; tidak bypass kelayakan unit |
| Admin | Dispatcher mengelola request/jadwal; finance mengelola invoice/receipt; dapat gabungan jika diberikan | Dispatcher tidak otomatis finance atau boleh mengubah instruksi pembayaran |
| Operator/driver | Tugas aktif, status, kamera, biaya sendiri, lokasi tugas | Tidak melihat margin, seluruh pelanggan atau tugas tenant lain |
| User/customer | Request/quote/order/invoice sendiri; B2B requester/approver/finance sesuai mandat; penerima terbatas handover | Organisasi berbeda terisolasi bahkan dalam tenant sama |
| Platform staff | Health/usage minimum; detail dengan grant owner berakhir | Tidak mengubah transaksi bisnis dari Admin platform |

Owner yang mengemudi menggunakan mode driver; admin menerima delegasi eksplisit, tidak berbagi password owner. Perubahan konteks menghapus cache/subscription lama. Akun seed tetap login nyata, tanpa bypass publik.

## 4. Hipotesis kebutuhan dan kontrak nilai fitur

Bukti saat ini hanya brief founder, akses potensial operator dan baseline dokumen; **belum ada observasi proses, pengukuran biaya, wawancara independen atau hasil usability**. Semua manfaat di bawah hipotesis, bukan temuan pasar. Keamanan, isolasi dan integritas transaksi adalah kewajiban desain sekalipun tidak diminta pengguna.

Setiap kartu berikut memakai AC pada register §6 dan metode VALIDATION_PLAN. Penanggung jawab produk/fitur berbeda dari aktor pengguna yang mengoperasikannya.

### Harga dan negosiasi

- **Requirement/AC:** QTE-01–QTE-08; lihat §6.
- **Masalah/proses alternatif:** Harga berdasarkan ingatan, chat dan spreadsheet.
- **Pengguna dan penanggung jawab:** Owner; PIC product/finance.
- **Manfaat hipotesis:** Keputusan batas harga dapat dijelaskan dan biaya terlewat terlihat.
- **Beban/perubahan perilaku:** Mengisi komponen, sumber dan asumsi biaya; meninjau estimasi.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Komponen dapat diestimasi cukup cepat; owner bersedia mencatat biaya aktual.
- **Validasi dan batas janji:** Uji tugas negosiasi berpasangan; cek komponen terlupa dan waktu. Tidak menjamin laba.

### Request lintas kanal

- **Requirement/AC:** ORD-01–ORD-07; lihat §6.
- **Masalah/proses alternatif:** Telepon/chat dan pencatatan ulang.
- **Pengguna dan penanggung jawab:** Admin/customer; PIC dispatcher.
- **Manfaat hipotesis:** Satu referensi pekerjaan tanpa memaksa semua customer memasang app.
- **Beban/perubahan perilaku:** Admin mencatat kanal, pihak dan consent.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Operator mau memindahkan pencatatan inti ke aplikasi.
- **Validasi dan batas janji:** Amati request riil dengan izin; ukur duplikasi/kelengkapan. Tidak mendatangkan lead otomatis.

### Kapasitas, nearby dan penugasan

- **Requirement/AC:** FLT-01–FLT-06, FLT-09; lihat §6.
- **Masalah/proses alternatif:** Telepon driver dan kalender informal.
- **Pengguna dan penanggung jawab:** Admin/driver; PIC dispatcher.
- **Manfaat hipotesis:** Unit layak dan jadwal lebih jelas.
- **Beban/perubahan perilaku:** Menjaga spesifikasi, availability dan estimasi waktu.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Spesifikasi dan jadwal bisa dipelihara.
- **Validasi dan batas janji:** Uji unit terdekat tidak layak dan race; ukur salah pilih. Nearby bukan marketplace/jaminan ketersediaan.

### Delegasi dan tindakan harian

- **Requirement/AC:** FIN-04, FIN-05, TEN-07; lihat §6.
- **Masalah/proses alternatif:** Semua persetujuan menunggu owner.
- **Pengguna dan penanggung jawab:** Owner/admin; PIC owner.
- **Manfaat hipotesis:** Pekerjaan tetap diproses dalam mandat ketika owner mengemudi.
- **Beban/perubahan perilaku:** Owner menetapkan limit/masa berlaku; admin menindak daftar.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Ada keputusan yang aman didelegasikan.
- **Validasi dan batas janji:** Uji owner tidak tersedia; ukur eskalasi/hambatan. Tidak membuat workflow generik.

### Instruksi, readiness dan kendala

- **Requirement/AC:** OPS-01, OPS-05; lihat §6.
- **Masalah/proses alternatif:** Instruksi chat/telepon terpisah.
- **Pengguna dan penanggung jawab:** Driver/admin; PIC dispatcher.
- **Manfaat hipotesis:** Driver mengetahui tugas dan pihak yang harus dihubungi.
- **Beban/perubahan perilaku:** Update tahap saat berhenti, incident dan PIC.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Input singkat dapat dilakukan di lapangan.
- **Validasi dan batas janji:** Walkthrough penerima tidak siap; ukur salah tafsir. Sistem tidak menyimpulkan insiden dari GPS diam.

### GPS Map Camera

- **Requirement/AC:** CAM-01–CAM-06, OPS-04; lihat §6.
- **Masalah/proses alternatif:** Kamera/galeri/chat terpisah dari order.
- **Pengguna dan penanggung jawab:** Customer/driver/admin; PIC mobile.
- **Manfaat hipotesis:** Foto terhubung konteks dan mudah ditemukan.
- **Beban/perubahan perilaku:** Izin, foto tahap, catatan kondisi; upload ditunda bila offline.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Foto minimum cukup bermanfaat dan tidak membebani.
- **Validasi dan batas janji:** Uji capture sampai retrieval serta waktu dokumentasi. Bukan bukti anti-manipulasi atau jaminan hukum.

### Tracking

- **Requirement/AC:** OPS-02, OPS-03, OPS-06; lihat §6.
- **Masalah/proses alternatif:** Telepon menanyakan posisi.
- **Pengguna dan penanggung jawab:** Driver/owner/customer; PIC mobile.
- **Manfaat hipotesis:** Status dan kesegaran posisi terlihat.
- **Beban/perubahan perilaku:** Izin saat tugas, baterai/data, penjelasan batas background.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Ponsel driver cocok dan pengguna memahami stale.
- **Validasi dan batas janji:** Uji perangkat per OS dan pertanyaan status. Tidak menjanjikan pelacakan selalu aktif/ETA pasti.

### Invoice dan pembayaran manual

- **Requirement/AC:** PAY-01, PAY-02, PAY-05, PAY-06, PAY-09–PAY-12; lihat §6.
- **Masalah/proses alternatif:** Dokumen manual, screenshot, pengecekan penerimaan terpisah.
- **Pengguna dan penanggung jawab:** Customer/finance; PIC finance.
- **Manfaat hipotesis:** Tagihan, bukti, pemeriksaan dan saldo terhubung.
- **Beban/perubahan perilaku:** Petugas tetap memeriksa penerimaan; alasan koreksi wajib.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Review manual dapat ditangani tanpa integrasi bank.
- **Validasi dan batas janji:** Uji penuh/parsial/reject/lebih bayar/race. Tanpa gateway bukan verifikasi otomatis.

### Biaya aktual dan uang jalan

- **Requirement/AC:** FIN-01, FIN-02, QTE-08; lihat §6.
- **Masalah/proses alternatif:** Nota tercecer dan kas muka tercampur biaya.
- **Pengguna dan penanggung jawab:** Driver/finance/owner; PIC finance.
- **Manfaat hipotesis:** Selisih biaya terlihat, uang muka tidak dihitung dua kali.
- **Beban/perubahan perilaku:** Input/approval biaya dan settlement.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Biaya cukup lengkap untuk menilai kontribusi.
- **Validasi dan batas janji:** Cocokkan satu pekerjaan dengan catatan manual. Kontribusi bukan laba bersih.

### Program pelanggan bisnis

- **Requirement/AC:** BIZ-01–BIZ-06, BIZ-08; lihat §6.
- **Masalah/proses alternatif:** Tarif dan histori tersimpan di chat/spreadsheet.
- **Pengguna dan penanggung jawab:** Requester/approver/admin; PIC owner.
- **Manfaat hipotesis:** Repeat order dan mandat lebih jelas.
- **Beban/perubahan perilaku:** Setup akun/rate card/terms dan pemeriksaan expiry.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Ada volume berulang dan PIC pembelian dapat dijangkau.
- **Validasi dan batas janji:** Uji reorder dan PO/approval. Tidak menjamin repeat sales atau memberi kredit Solveit.

### Analytics dan laporan

- **Requirement/AC:** ANA-01–ANA-04, RPT-01, RPT-02, FIN-06; lihat §6.
- **Masalah/proses alternatif:** Rekap spreadsheet dan cari bukti manual.
- **Pengguna dan penanggung jawab:** Owner/finance/B2B; PIC product/data.
- **Manfaat hipotesis:** Angka dapat ditelusuri dan data kurang terlihat.
- **Beban/perubahan perilaku:** Kelengkapan transaksi dan review filter.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Owner menggunakan laporan untuk keputusan.
- **Validasi dan batas janji:** Uji interpretasi kas vs invoice vs kontribusi dan ekspor. Tidak membuktikan penghematan dari data sintetis.

### Dua plan SaaS

- **Requirement/AC:** SUB-01–SUB-06; lihat §6.
- **Masalah/proses alternatif:** Harga jasa/software dibicarakan manual.
- **Pengguna dan penanggung jawab:** Owner; PIC product.
- **Manfaat hipotesis:** Alternatif biaya mudah dibandingkan.
- **Beban/perubahan perilaku:** Memahami definisi success dan periode.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Preferensi harga berbeda menurut volume.
- **Validasi dan batas janji:** Eksperimen willingness to pay terpisah. Semua preview DEMO, bukan pembelian.

### Admin platform dan keamanan

- **Requirement/AC:** TEN-01–TEN-06, ADM-01–ADM-04, NFR-01; lihat §6.
- **Masalah/proses alternatif:** Pemeriksaan layanan melalui alat terpisah.
- **Pengguna dan penanggung jawab:** Solveit support/owner; PIC architect.
- **Manfaat hipotesis:** Monitoring terbatas tanpa akses bisnis berlebihan.
- **Beban/perubahan perilaku:** Owner mengizinkan support grant bila dibutuhkan.
- **Bukti tersedia:** brief founder/baseline saja; kebutuhan belum tervalidasi independen.
- **Asumsi belum terbukti:** Scope minimum mencukupi dukungan.
- **Validasi dan batas janji:** Negative tests dan simulasi support revoke. Empat dashboard atau integrasi bukan moat otomatis.

## 5. Workflow, status dan aturan bisnis

Request mobile/telepon/chat/manual → review kendaraan/lokasi/pihak → estimasi dan quote berversi → approval customer/B2B → reservasi atomik → assignment diterima → pickup/foto → perjalanan/kendala → handover/foto → invoice → payment request → bukti menunggu pemeriksaan → receipt demo → biaya/laporan/usage. Handover tidak melunasi invoice; invoice lunas tidak membuktikan bank settlement; closed boleh berpiutang.

| Domain | Enum kanonik |
|---|---|
| Request | draft, needs_review, ready_to_quote, quoted, converted, lost, canceled |
| Quote | draft, sent, accepted, rejected, expired, superseded |
| Execution | confirmed, assigned, en_route_pickup, arrived_pickup, loading, in_transit, arrived_delivery, handed_over, closed, canceled, aborted |
| Assignment | offered, accepted, rejected, revoked, completed |
| Reservation | confirmed, released |
| Evidence completeness | incomplete, complete, disputed |
| Invoice document | draft, issued, void, corrected |
| Payment request | active, expired, superseded, canceled, fulfilled |
| Payment proof | pending_review, flagged_review, rejected, verified, verification_reversed |
| Receipt | posted, reversed; refund parsial adalah record terpisah |
| Refund record | requested, approved, recorded, rejected, canceled |
| Collection (derived) | unpaid, partially_paid, settled; flag has_unapplied terpisah, bukan saldo negatif |
| Usage | not_eligible, eligible_pending_review, billable, billed_demo, credited |
| Local outbox | pending, sending, synced, needs_review, permanently_failed |

### Harga dan biaya

Money integer rupiah, JSON string; persen basis point; tidak float. P = pendapatan jasa setelah diskon/kredit komersial, bukan penerimaan kas. D = biaya langsung termasuk approach/loaded/reposition, tol/personel atau quote mitra. F = biaya SaaS per layanan dan biaya penanganan komersial eksplisit; A = alokasi tetap; R = cadangan; T = target surplus. Contribution = P−D−F; surplus estimasi = contribution−A−R. Margin=surplus/P (null jika P=0), markup=surplus/(D+F+A+R). Alokasi langganan tetap tidak dihitung lagi sebagai success fee.

F-01: D=2.400.000, A=300.000, R=100.000, success DEMO=10.000, biaya administrasi internal=4.000, P=3.200.000 → contribution 786.000, surplus 386.000, harga target untuk T=400.000 adalah 3.214.000. Angka sama dengan baseline; komponen 4.000 kini secara eksplisit biaya penanganan manual ilustratif, **bukan fee gateway**. F-01 kalkulator terisolasi, bukan transaksi F-09.

F-02 tetap uji matematika biaya komersial persentase ilustratif: D+A+R+f=2.810.000, r=1%, T=400.000 → ceil(3.210.000/0,99)=3.242.425. Ini bukan tarif provider. Berlaku hanya basis fee P, 0≤r<1, tanpa cap/minimum/pajak berbeda; rounding component memakai ceil IDR dan harga hasil wajib dihitung ulang. Missing biaya wajib bukan nol. Harga di bawah target memerlukan alasan; override owner hanya komersial, tidak meloloskan kapasitas tidak layak. Muatan pulang belum confirmed tidak mengurangi biaya dasar. Mitra memakai quote mitra plus biaya operator sendiri, tidak menduplikasi BBM mitra.

### Kapasitas, prioritas dan penugasan

Hard filter berat/dimensi/perlengkapan/kondisi/status unit/driver sebelum ranking biaya/waktu. Unknown → review. Quote tidak menahan slot; accept memeriksa expiry, versi, mandat, lalu lock unit+driver dan overlap [start,end) termasuk buffer 30 menit DEMO. Dua admin bersamaan hanya satu boleh berhasil. Nearby memakai aset tenant/mitra kelolaan yang layak; lokasi lama tidak dilabeli nearby live. Customer memilih preferensi, bukan otomatis dispatch.

Tarif prioritas membayar mobilisasi/komitmen jadwal yang terdefinisi dan disetujui, bukan janji kecepatan berkendara. Kapasitas harus ada. Ketentuan kegagalan komitmen dicatat dalam quote; refund demo mengikuti review. Tambahan biaya baru billable setelah approval; penolakan tidak mengubah invoice diam-diam. Cancel sebelum loading; sesudah loading gunakan abort dengan custody/lokasi/PIC/tindakan. Pergantian unit/driver mengunci resource lama+baru dan menyimpan histori.

### B2B, delegasi dan daftar harian

Tarif valid akun cocok → tarif standar → review. Snapshot rate/terms/PO policy pada quote; net-7 DEMO dihitung tanggal issued dalam zona operator. Requester tidak otomatis approver; assisted booking tidak melampaui mandat. Reorder membuat draft baru dan mengulang harga/jadwal/approval. Penerima bukan otomatis pembayar.

Delegasi PROTO berupa template izin tetap: quote.send, quote.override_within_limit, assignment.manage, expense.approve, invoice.issue; payment.verify hanya jika owner secara eksplisit memberi izin finance. Field delegator/delegate/scopes/limit IDR/effective_at/expires_at/reason/revoked_at/version. Default DEMO admin dapat quote sampai diskon 100.000 dari target dengan biaya lengkap; di luar batas eskalasi, tidak menambah izin rekening/grant/delegasi lanjutan. Maksimum masa demo 8 jam, dapat diubah melalui policy berversi. Revoke diperiksa kembali di transaksi. Self-approval bukti milik verifier ditolak; owner lain/finance berwenang memeriksa. Tidak ada mesin workflow generik.

Daftar harian query dari sumber: quote menunggu/expired, assignment belum diterima, readiness/incident, biaya tambahan menunggu, bukti kurang, handover belum invoice, proof pending, piutang jatuh tempo dan biaya belum final. PIC/tautan/alasan/due_at terlihat, dedupe (tenant,source,type); selesai ketika sumber resolved, bukan tombol yang mengubah status bisnis secara terselubung.

### GPS Map Camera

Asumsi istilah awal GPM Map Camera berarti GPS Map Camera. Tahap: request_condition, pickup_before_loading, incident, delivery_handover. Customer dapat capture pada draft sebelum order dibuat; upload terikat request lalu order mewarisi relasinya, original tidak dipindah ke tenant lain.

Capture → preview/retake/catatan → copy original ke app durable storage → metadata/outbox → derivative overlay → upload bertahap → server acknowledgement. Original = bytes hasil kamera/impor sebelum kompresi/overlay; kompresi hanya derivative. Hubungan parent_media_id, derivative_type, renderer_version dan hash per file jelas. Kamera Expo menyimpan hasil awal ke cache, sehingga cache URI saja belum berarti tersimpan aman.

Metadata: capture_origin camera/gallery, device_captured_at nullable untuk gallery, event_at (waktu kejadian dinyatakan), device_recorded_at, location_captured_at, server_received_at, timezone IANA, lat/lng nullable, accuracy_m nullable, location_source device/stale/manual/simulated/unknown, uploader_id, request_id, order_id nullable, customer_vehicle_id, stage, note, is_demo. EXIF gallery hanya petunjuk tidak dipercaya; waktu tidak diketahui null, jangan diganti waktu upload seolah waktu foto.

Overlay derivative: DEMO, waktu dan zona beserta sumber waktunya, koordinat atau “lokasi tidak tersedia”, label lama/manual/simulasi, referensi request/order dan tahap. Tidak memuat margin/telepon internal. Alamat reverse geocode opsional dengan provider/fetched_at dan label perkiraan; mini-map opsional jika tersedia, tanpa menghalangi capture. Foto perangkat nyata dalam proyek demo tetap DEMO tetapi source=device, bukan simulated. Hash memeriksa file sama, bukan kebenaran kejadian.

| Kegagalan | Perilaku wajib |
|---|---|
| Kamera denied/restricted | Penjelasan dan tombol pengaturan; lanjut catatan atau gallery jika diizinkan; tidak mengaku capture |
| GPS denied/timeout | Foto tetap tersimpan, koordinat null; titik manual opsional berlabel manual; lokasi lama harus berumur/akurasi |
| Offline/app ditutup | File/outbox tetap ada; status pending; foreground reconnect mencoba ulang, OS tidak dijanjikan upload saat terminated |
| Storage tidak cukup | Jangan tampil saved; minta ruang/retake kompresi derivative, pertahankan original yang sudah aman; jangan hapus pending lain otomatis |
| Geocode/peta gagal | Koordinat/unknown dan teks tetap ada; foto/upload tidak dibatalkan |
| Overlay gagal | Original durable/pending; retry renderer, jangan menandai paket complete sampai derivative wajib tersedia |
| Assignment dicabut saat offline | Bukti lama hanya dapat dikirim ke review khusus jika uploader memang bertugas saat kejadian; tidak memajukan status/order; tanpa otorisasi historis ditolak |

### Pembayaran tanpa gateway

A. Instruksi statis: identitas operator/penerima dan versi, hanya rekening bertuliskan DEMO-NONPAYABLE-A/B. Tidak memakai rekening numerik bank nyata. QR merchant statis resmi adalah NEXT. Menampilkan nominal invoice di samping QR tidak mengubah jenis QR.

B. Payment request internal: invoice issued/revisi sah, requested_amount dan outstanding_snapshot, ref unik, expires_at opsional (default DEMO 24 jam), history. Permintaan penuh atau sebagian <= saldo saat dibuat. Satu request active per invoice untuk prototype; mengganti request supersede yang lama. QR opsional hanya URI `tovv-demo://payment-request/<opaque-id>` yang memerlukan login dan scope, **bukan QRIS dan tidak memindahkan dana**. Expiry/status request tidak menjadi bukti ada/tidaknya dana.

C. QRIS dinamis nyata: QR pembayaran resmi melalui mekanisme penerbit/PJP, berbeda dengan referensi internal. Pada prototype hanya visual ilustrasi bertanda SIMULASI TIDAK DAPAT DIBAYAR tanpa payload QRIS. Lampiran QR resmi dari kanal merchant juga NEXT setelah izin/validitasnya jelas. Tidak ada API penerbitan, webhook, scraping mutasi atau pembacaan notifikasi bank dalam PROTO.

Alur: tampilkan invoice/request → customer upload bukti sintetis atau finance assisted mencatat tunai/transfer demo → proof pending_review → finance yang berwenang memeriksa → server membuat receipt posted dan alokasi → saldo dihitung. Screenshot atau “saya sudah membayar” tidak langsung melunasi. Tindakan verify harus menyebut jumlah diterima demo, metode, referensi/custody, waktu kejadian dan waktu pencatatan server. Tidak ada verifikasi bank otomatis.

Invoice net = issued amount − credit notes posted. Allocation net = alokasi posted − reversal. Outstanding = invoice net − allocation net, minimal 0 dengan invariant alokasi tidak melebihi net. Receipt available = jumlah posted − receipt reversal − refund recorded − allocation net; available yang belum dialokasikan disebut unapplied, bukan wallet. Receipt/reversal/refund tidak dihitung dua kali. Invoice yang fully credited mempunyai outstanding 0 dan flag fully_credited; collection settled tidak berarti pembayaran terjadi.

Full: alokasi hingga outstanding. Partial: sisa tetap piutang. Overpay: sisa receipt unapplied dengan review/refund demo. Rejected: alasan, saldo tetap. Referensi sama/mirip atau hash bukti sama memberi flagged_review; bukan otomatis fraud atau otomatis receipt kedua. Expired request dengan bukti terlambat tetap diperiksa; invoice corrected harus ditinjau ke dokumen sah, tidak diam-diam dialokasikan. Reverse verification membuat reversal receipt+allocation atomik dan proof verification_reversed, tidak menghapus histori. Jika ada refund/transfer alokasi, selesaikan dependant entries lebih dahulu atau tolak 409.

Contoh koreksi: invoice 1.000.000, receipt 1.000.000 → kredit 200.000 plus reversal alokasi 200.000 dan refund recorded 200.000 → invoice net/alokasi masing-masing 800.000, saldo/unapplied 0. Tunai petugas dapat melunasi customer secara demo jika petugas berwenang; custody “di driver” terpisah dari “diterima finance”. Penyerahan kas tidak membuat receipt customer kedua. Semua refund hanya pencatatan keputusan/bukti demo.

### Tracking dan SaaS

Tracking hanya selama accepted assignment dan tahap en_route_pickup sampai arrived_delivery; berhenti ketika handover/cancel/abort/reassign/logout sesuai konteks. Customer dapat melihat tahap relevan tersebut saja, bukan mobilisasi tugas lain. Before start hanya status/jadwal; sesudah handover histori tahapan, bukan posisi driver terkini. Target interval 10–30 detik, stale >90 detik; timestamp masa depan >120 detik dikarantina. Last updated, accuracy dan source selalu terlihat. Force-stop dapat menghentikan tracking; replay tidak menggantikan device diam-diam. ETA menyimpan source/fetched_at/warnings, tidak menjamin akses jalan truk. Kondisi perjalanan berasal dari status/incident, bukan interpretasi kecepatan nol.

Subscription atau pay-per-success adalah alternatif DEMO. Satu success = satu service unit satu kendaraan dengan handover+bukti minimum+acceptance/assisted sah; disputed → eligible_pending_review. Satu foto/status/receipt bukan activity tertagih. Plan snapshot saat confirm; subscription tidak ditambah fee success. Plan change periode berikutnya; reversal usage via credit; paket expired tidak menghentikan pekerjaan aktif atau akses dokumen/pembayaran. Preview SaaS berbeda issuer/nomor/tabel dari invoice operator dan tidak dapat dibayar.

## 6. Register requirement dan acceptance criteria

ID lama dipertahankan jika maksudnya masih sama. Detail normatif §5 dan §7–8 merupakan bagian AC setiap baris terkait. Requirement NEXT bukan pekerjaan wajib. Daftar perubahan ID terdapat §10; semua PROTO dipetakan dalam TEST_PLAN.

### TEN

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| TEN-01 | PROTO | Isolasi data per tenant pada API, file, cache, pekerjaan antrean, ekspor, dan realtime | Pengguna tenant A tidak dapat mengambil objek B lewat ID langsung, signed link, pencarian, event, atau ekspor; uji negatif lulus |
| TEN-02 | PROTO | Membership dan role diverifikasi server | Mengganti role/context pada client tidak menambah kewenangan; pengguna tanpa membership ditolak |
| TEN-03 | PROTO | Profil operator dan identitas pemberi jasa jelas | Quote/invoice menampilkan operator yang benar; biaya internal tidak ikut terlihat pelanggan |
| TEN-04 | PROTO | Undangan, pencabutan akses, dan pemulihan akun | Akun demo dibuat melalui seed/admin CLI; login, logout, expiry, dan revoke perangkat berfungsi. Reset akun demo hanya di nonproduction. Undangan email dan recovery mandiri ditunda; tidak ada login bypass publik. |
| TEN-05 | PROTO | Support access berdasarkan grant dan audit | Support grant berisi actor, tenant, scopes, alasan dan expires_at; grant kedaluwarsa/ditarik memutus akses API dan event berikutnya dalam batas 60 detik; setiap akses detail tercatat. |
| TEN-06 | PROTO | Onboarding beberapa tenant tanpa fork kode | Dua tenant sintetis dibuat dengan seeder yang sama dan berbeda tarif/paket; tidak ada fork kode. Onboarding self-service ditunda. |
| TEN-07 | PROTO | Konteks owner merangkap driver | Satu akun dapat punya dua kemampuan; mode driver hanya tugasnya, tindakan owner memerlukan perpindahan konteks eksplisit; driver lain tidak mendapat izin owner. |

### ORD

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| ORD-01 | PROTO | Booking mobile oleh pelanggan atau dibantu admin | Sumber permintaan tercatat; instalasi pelanggan tidak wajib untuk assisted booking |
| ORD-02 | PROTO | Data kendaraan/kondisi/lokasi/waktu | Kekurangan data kritis ditandai needs_review; berat/kapasitas tidak ditebak sebagai fakta |
| ORD-03 | PROTO | Segera, terjadwal, fleksibel | Fleksibel menyimpan rentang waktu; segera membutuhkan konfirmasi kemampuan; tidak semua opsi wajib tersedia setiap saat |
| ORD-04 | PROTO | Pihak pemesan, penyerah, penerima, pembayar terpisah | Pergantian penerima tidak otomatis mengubah pembayar; akses tiap pihak dibatasi |
| ORD-05 | PROTO | Pencegahan duplikat dan histori perubahan | Retry key yang sama dan payload sama menghasilkan satu request; payload berbeda pada key sama ditolak 409. Peringatan kemiripan ditunda; idempotensi tidak boleh ditunda. |
| ORD-06 | PROTO | Pembatalan dan perubahan kebutuhan | Alasan tercatat; setelah pickup memakai prosedur aborted; quote/reservation terkait dievaluasi ulang |
| ORD-07 | PROTO | Pesan ulang dan template | Draf baru memakai data relevan, tetapi harga, unit, jadwal dan penerima harus dikonfirmasi kembali |

### QTE

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| QTE-01 | PROTO | Cost template per layanan/unit/rute | Komponen biaya, asal nilai, tanggal, dan asumsi dapat diperiksa; biaya mitra tidak diduplikasi dengan biaya unit sendiri |
| QTE-02 | PROTO | Perhitungan contribution, surplus, target harga | Fixture nominal dan persentase menghasilkan nilai benar; total pelanggan dipisah dari penerimaan neto operator |
| QTE-03 | PROTO | Simulasi negosiasi dan tingkat kepastian | Harga di bawah target diberi alasan; biaya belum lengkap tidak diberi label pasti untung |
| QTE-04 | PROTO | Quote berversi dan masa berlaku | Penerimaan mengacu satu versi; versi lama tidak diterima setelah superseded/expired; dokumen historis tetap tersedia |
| QTE-05 | PROTO | Persetujuan pihak berwenang | Approval dari akun yang tidak berwenang ditolak; assisted consent memuat petugas, waktu, kanal, dan catatan pendukung |
| QTE-06 | PROTO | Biaya tambahan/change order | Perubahan disajikan terpisah dan tidak ditagih sebagai telah disetujui bila approval belum ada |
| QTE-07 | PROTO | Alternatif unit/jadwal yang ekonomis | Daftar minimal dua opsi layak menampilkan estimasi biaya dan jadwal; memilih alternatif membuat versi quote baru dan memeriksa reservasi. Optimasi otomatis ditunda. |
| QTE-08 | PROTO | Estimasi vs biaya aktual | Snapshot awal tidak berubah; selisih dapat ditelusuri per komponen; biaya belum final diberi penanda |

### FLT

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| FLT-01 | PROTO | Registry unit, driver, dan mitra | Ukuran, kapasitas, perlengkapan, biaya, ketersediaan, status operasional dan sumber spesifikasi tersimpan |
| FLT-02 | PROTO | Penyaringan kelayakan sebelum ranking | Unit yang kapasitas/kesesuaiannya tidak memenuhi syarat tidak menjadi opsi yang dapat dikonfirmasi |
| FLT-03 | PROTO | Ranking biaya dan waktu yang dapat dijelaskan | Rekomendasi menyebut alasan dan asumsi; data tidak cukup meminta review manusia |
| FLT-04 | PROTO | Reservasi dan konflik server-side | Konfirmasi memakai transaksi dan lock unit serta driver; dua interval tumpang tindih hanya satu berhasil. Quote prototype tidak menahan kapasitas; tentative hold ditunda dan UI menyatakannya. |
| FLT-05 | PROTO | Penerimaan assignment | Tawaran mitra/driver belum diterima tidak dianggap dispatch pasti; pergantian mencabut akses tugas lama |
| FLT-06 | PROTO | Tarif prioritas | Harga, manfaat, perkiraan waktu, dan ketentuan kegagalan komitmen disetujui sebelum konfirmasi |
| FLT-07 | NEXT | Dampak keterlambatan ke pekerjaan berikutnya | Sistem menunjukkan order terdampak dan pilihan; tidak memindahkan komitmen pelanggan otomatis tanpa kewenangan |
| FLT-08 | NEXT | Trip multi-order/multi-tahap | Kapasitas berat/dimensi/waktu dievaluasi per tahap; biaya bersama tidak dihitung penuh pada setiap order |
| FLT-09 | PROTO | Nearby kandidat layak | Filter tenant, mitra kelolaan, kelayakan dan freshness lebih dahulu; tampilkan jarak/ETA bersumber; pilihan customer adalah preferensi sampai reservasi terkonfirmasi. |

### OPS

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| OPS-01 | PROTO | Status pekerjaan dan readiness minimum | Kesiapan kontak/lokasi jemput/penerima dapat dicatat; exception darurat meninggalkan tugas susulan |
| OPS-02 | PROTO | Lokasi aktif dengan freshness | Owner dan customer yang berhak melihat lokasi tugas; last updated/akurasi tersedia; stale tidak berlabel live |
| OPS-03 | PROTO | Offline event queue | Event diberi waktu kejadian/waktu diterima dan ID unik; retry tidak menggandakan status/foto/biaya |
| OPS-04 | PROTO | Foto kondisi dan serah-terima | Foto terkait tahap dan kendaraan; penerima dapat mencatat keberatan; bukti tidak menjamin kebenaran absolut atau penerimaan klaim |
| OPS-05 | PROTO | Kendala dan penggantian pelaksana | PIC dan status kendala jelas; putus jaringan tidak otomatis ditafsirkan sebagai kendaraan berhenti/rusak |
| OPS-06 | PROTO | Batas akses lokasi | Pelanggan hanya melihat unit/tahap layanan yang relevan; akses aktif berhenti setelah layanan sesuai kebijakan |
| OPS-07 | NEXT | Pengingat readiness kedua ujung | Pengingat tidak menandai siap secara otomatis; ketidaksiapan memberi tindakan kepada admin |
| OPS-08 | NEXT | GPS perangkat armada | Sumber, timestamp dan prioritas data jelas; tidak menggabungkan sumber berbeda tanpa jejak |

### PAY

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| PAY-01 | PROTO | Invoice komersial bernomor unik per operator | Quote/change order menjadi sumber; versi terbit tidak dapat diedit diam-diam; koreksi mempunyai relasi ke dokumen asal |
| PAY-02 | PROTO | Transfer langsung dan tunai | Upload bukti berstatus pending; finance/owner memverifikasi penerimaan dengan waktu/metode/referensi |
| PAY-03 | NEXT | Adapter payment gateway | Dikeluarkan dari syarat prototype; keputusan provider, sandbox dan merchant baru dibuat setelah kebutuhan dan izin tersedia. |
| PAY-04 | NEXT | Webhook dan rekonsiliasi provider | Tidak ada endpoint webhook atau rekonsiliasi bank wajib pada prototype; kebutuhan integritas manual ditangani PAY-11. |
| PAY-05 | PROTO | Parsial, lebih bayar, terlambat, koreksi dan refund demo | Saldo dihitung dari alokasi/reversal immutable; expired tetap dapat ditinjau; lebih bayar menjadi unapplied; refund mencatat keputusan dan bukti demo tanpa transfer. |
| PAY-06 | PROTO | Penerimaan, biaya, dan penguasaan dana terpisah | Receipt demo bukan bukti settlement bank; tunai petugas menyimpan custody dan penyerahan; biaya operasional tercatat tanpa mengasumsikan fee gateway. Payout provider NEXT. |
| PAY-07 | NEXT | Merchant/provider per tenant | Konfigurasi multi-merchant ditunda; instruksi demo tenant mengikuti PAY-09, bukan merchant live. |
| PAY-08 | NEXT | Tagihan gabungan B2B | Setiap layanan hanya dialokasikan sekali; item yang sudah diinvoiskan tidak ditagih ulang |
| PAY-09 | PROTO | Instruksi pembayaran statis demo | Identitas operator/penerima, versi dan label nonpayable jelas; hanya DEMO-NONPAYABLE-A/B; instruksi tenant lain ditolak; nominal invoice tidak mengubah QR statis menjadi dinamis. |
| PAY-10 | PROTO | Permintaan pembayaran internal dinamis | Invoice issued, versi sah, requested_amount>0 dan <= saldo saat dibuat, referensi unik, expiry dan histori; penuh/parsial; QR internal hanya detail demo setelah auth, bukan QRIS. |
| PAY-11 | PROTO | Review bukti dan receipt atomik | Bukti pending tidak mengubah saldo; verifikasi berizin mengunci proof/invoice/receipt; retry/race satu receipt dan alokasi; alasan reject/reverse wajib; referensi mirip ditinjau. |
| PAY-12 | PROTO | Pengaman pembayaran nonpayable | Tidak ada credential bank, QRIS payload, gateway, escrow atau wallet; tombol sudah membayar hanya submit review; tunai assisted berizin; seluruh dokumen dan visual DEMO. |
| PAY-13 | NEXT | Lampiran QR merchant resmi dan QRIS dinamis nyata | Baru dipertimbangkan setelah kanal resmi PJP, izin merchant, masa berlaku dan mekanisme penerbitan jelas; bukan QR buatan internal. |

### BIZ

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| BIZ-01 | PROTO | Business account tenant-scoped | Organisasi pelanggan A tidak membaca histori B; orang yang punya beberapa organisasi memilih konteks eksplisit |
| BIZ-02 | PROTO | Requester dan approver | Requester tanpa mandat tidak menyetujui tarif/anggaran; kebijakan satu orang diperbolehkan jika disetujui admin organisasi |
| BIZ-03 | PROTO | Rate card berversi dan masa berlaku | Aturan tepat sesuai tanggal/layanan/kondisi/rute; expired/missing tidak memakai tarif lama tanpa review |
| BIZ-04 | PROTO | Rute favorit dan pesan ulang | Order baru tetap mengecek unit, jadwal, harga, dan approval; tidak auto-dispatch |
| BIZ-05 | PROTO | Referensi internal dan terms pembayaran | Nomor PO/referensi opsional atau wajib sesuai kontrak; assisted booking tidak melewati kewajiban approval |
| BIZ-06 | PROTO | Histori dan dokumen organisasi | Pemesan terbatas pada haknya; finance B2B melihat invoice organisasinya; penerima hanya melihat bagian serah-terima |
| BIZ-07 | NEXT | Batas kredit operasional operator | Outstanding/reservasi dihitung konsisten; bukan skor kredit publik atau pembiayaan Solveit; pengecualian tercatat |
| BIZ-08 | PROTO | Laporan layanan dan kontribusi | Owner melihat jumlah order, pendapatan neto, contribution provisional/final dan piutang per akun bisnis. Pelanggan hanya melihat order/invoice serta ringkasan layanan organisasi yang diizinkan. |
| BIZ-09 | NEXT | Kapasitas berkontrak/standing order | Slot berkontrak mengurangi available capacity; kejadian berulang menjadi draf sampai dikonfirmasi |

### FIN

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| FIN-01 | PROTO | Anggaran/uang jalan/pengeluaran | Catat uang muka driver, expense dengan bukti, dan pengembalian sisa; contoh advance 500.000, expense 420.000, sisa 80.000 tidak menghasilkan expense 920.000. Modul kas penuh ditunda. |
| FIN-02 | PROTO | Kontribusi aktual | Pendapatan/refund, biaya transaksi, mitra dan biaya langsung konsisten; missing expense ditandai provisional |
| FIN-03 | NEXT | Proyeksi kas sederhana | Saldo terverifikasi, alokasi, arus keluar dan penerimaan perkiraan dipisah; data lama diberi timestamp |
| FIN-04 | PROTO | Delegasi terbatas dan berbatas waktu | Owner memberi scope tindakan, batas nominal, masa berlaku dan penerima; perubahan/revoke diaudit, server memeriksa ulang saat commit; tidak mendelegasikan keselamatan atau hak lebih tinggi dari pemberi. |
| FIN-05 | PROTO | Daftar tindakan harian | Daftar turunan menampilkan quote menunggu, kapasitas konflik, dokumen kurang, approval biaya, invoice belum terbit dan piutang; tiap item memiliki alasan, PIC, tautan aksi; satu item per sumber/jenis. |
| FIN-06 | PROTO | Ringkasan pelanggan/rute/unit | Agregat deskriptif dengan sampel, konteks dan data lengkap/tidak lengkap; tidak memberi peringkat driver berdasarkan jumlah saja; prediksi/optimasi NEXT. Formula ANA-01–ANA-04. |

### SUB

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| SUB-01 | PROTO | Plan/version/entitlement eksplisit | Dua plan DEMO berversi dapat dipilih per tenant; nominal diberi label ilustrasi, tidak dipungut. Snapshot plan disimpan saat order confirmed. |
| SUB-02 | PROTO | Success event per service unit | Retry/duplikat/handover ulang tidak membuat biaya kedua; event mengacu bukti dan identitas layanan |
| SUB-03 | PROTO | Subscription dan pay-per-success alternatif | Tenant A subscription DEMO dan tenant B pay-per-success DEMO; layanan subscription tidak ditambah success fee. Perbandingan total untuk volume hipotetis diberi label simulasi. |
| SUB-04 | PROTO | Perubahan paket dan credit | Perubahan paket terjadwal periode berikutnya; order aktif tetap pada snapshot lama. Koreksi usage melalui credit entry dan tidak menghapus event historis; prorata ditunda. |
| SUB-05 | PROTO | Invoice SaaS terpisah | Preview invoice SaaS berwatermark DEMO terpisah dari invoice jasa; tidak membuat checkout langganan atau menagih uang nyata. |
| SUB-06 | PROTO | Limit dan tunggakan yang aman | Fixture paket kedaluwarsa menunjukkan warning dan memblokir order baru sesuai policy demo; penyelesaian order aktif, bukti, invoice dan pembayaran tetap dapat diakses. |

### MOB

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| MOB-01 | PROTO | Satu aplikasi, tampilan sesuai role | Core owner/admin/driver/customer dapat dilakukan di ponsel; tidak memerlukan desktop wajib |
| MOB-02 | PROTO | Notifikasi dan deep link aman | Link membuka objek setelah authz; push tidak membocorkan margin/data sensitif; token tenant lama dicabut |
| MOB-03 | PROTO | Draft, upload tertunda, retry | Keluar aplikasi tidak menghapus draf yang telah disimpan; status sinkronisasi terlihat |
| MOB-04 | PROTO | Bahasa Indonesia dan penggunaan lapangan | Tombol status utama mudah dijangkau; kesalahan punya tindakan pemulihan; tidak memerlukan input saat mengemudi |
| MOB-05 | PROTO | Preferensi dan pencegahan spam | Preferensi push umum dapat dimatikan; event bisnis tetap tersedia dalam inbox. Retry satu event tidak menciptakan banyak item inbox; delivery push tidak diklaim exactly-once. |
| MOB-06 | NEXT | Input suara/dokumen sebagai draf | Hasil ekstraksi ditinjau manusia; tidak otomatis menyetujui harga, kondisi atau dispatch |

### NFR

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| NFR-01 | PROTO | Isolasi dan akses | Seluruh tes negatif tenant, organisasi B2B, role, file, queue, dan channel wajib lulus; satu kebocoran memblokir demo dengan data pengguna. |
| NFR-02 | PROTO | Respons API | Pada profil beban TEST_PLAN: p95 read API umum ≤800 ms dan write ≤1.500 ms; error tak terduga <1%. Ukur server response, pisahkan jaringan dan provider; target eksperimen, bukan hasil. |
| NFR-03 | PROTO | Kesegaran lokasi | Sesi perangkat dengan izin/jaringan tersedia: target p95 captured_at-ke-render ≤60 detik; interval adaptif target 10–30 detik. Laporkan coverage dan gap seluruh sesi, jangan membuang kegagalan untuk menaikkan hasil. |
| NFR-04 | PROTO | Data stale | Pada umur data >90 detik tampil stale dan last updated; missing accuracy/time ditandai unknown. Batas waktu adalah konfigurasi prototype. |
| NFR-05 | PROTO | Integritas konkurensi | Race reservation, quote acceptance, payment allocation dan usage menghasilkan satu efek yang sah; retry tidak menggandakan transaksi. |
| NFR-06 | PROTO | Offline tahan restart | Draf/status/foto pending bertahan setelah aplikasi restart; replay aman. Reservation, quote acceptance dan paid tidak pernah final hanya berdasarkan cache. |
| NFR-07 | PROTO | Pemulihan | Backup database dan file demo dipulihkan ke instance uji bersih; verifikasi relasi, nominal dan file. Catat waktu restore; RPO/RTO komersial belum ditetapkan. |
| NFR-08 | PROTO | Kesiapan demo | Smoke test kritis lulus sebelum sesi; unavailable terlihat dan fallback simulasi diberi label. SLA availability bulanan ditunda sampai pilot. |
| NFR-09 | PROTO | Minimisasi data | Default data sintetis. Lokasi field test berdasarkan persetujuan peserta; retensi default raw location 7 hari, media 14 hari setelah sesi, audit teknis 30 hari untuk lingkungan prototype. Retensi produksi diputuskan terpisah. |
| NFR-10 | PROTO | Observabilitas | Error API, outbox/queue lag, upload gagal, pemeriksaan pembayaran tertunda, lokasi stale dan mode adapter terlihat; log tanpa token, foto, rekening atau koordinat mentah. |
| NFR-11 | PROTO | Usability mobile | Bahasa Indonesia; status memakai teks/ikon selain warna; touch target utama minimal 44 logical points; font scaling 1,3x tidak memotong aksi utama; loading/empty/error/offline tersedia. |
| NFR-12 | PROTO | Biaya dan performa perangkat | Laporkan ukuran release, startup, memory, baterai per jam dan data per jam pada Android/iPhone yang diuji; semua provider memiliki budget cap. Tidak mengklaim ringan tanpa hasil pengukuran. |

### PRO

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| PRO-01 | PROTO | Mode dan tingkat bukti jujur | Badge PROTOTYPE permanen; sumber device/replay/manual/import/unknown eksplisit; seluruh transaksi sintetis DEMO; tidak ada fallback simulasi diam-diam. |
| PRO-02 | PROTO | Seed dan reset deterministik | F-09 berisi 24 request, 14 order, 2 tenant, 3 organisasi B2B; reset CLI guarded, clock bisnis dapat diatur; analytics berasal dari baris transaksi yang sama. |
| PRO-03 | PROTO | Bukti perangkat | APK Android dan build iOS terpasang di perangkat nyata; skenario background/offline/revoke diuji. Simulator atau build sukses saja tidak memberi status verified-device. |
| PRO-04 | PROTO | Demo dan feedback | D-01–D-08 dapat dijalankan setelah reset; catat bantuan, pemahaman dan keterbatasan; demo sintetis tidak membuktikan ROI/retensi. |
| PRO-05 | PROTO | Artefak dan traceability agent | Requirement aktif mempunyai task, test dan bukti. Paket handoff berisi setup, exact versions, ADR, checkpoint, known limitations serta evidence index. |

### ADM

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| ADM-01 | PROTO | Dashboard Solveit Admin terbatas | Menu Tovv read-only via backend website → Tovv API; private data tidak diprerender; tanpa repo gunakan ADMIN STUB dan status integrasi aktual BLOCKED. |
| ADM-02 | PROTO | Identitas integrasi | Service credential tersimpan server-side; actor context ditandatangani, audience/expiry/nonce diperiksa; grant Tovv membatasi detail tenant. Browser tidak mendapat service secret. |
| ADM-03 | PROTO | Realtime Admin | Browser Admin menerima event hanya melalui tiket channel scoped dan berumur pendek; data tenant lain tidak muncul. Reconnect mengambil snapshot sebelum meneruskan event. |
| ADM-04 | PROTO | Monitoring pusat | Dashboard memisahkan health teknis, usage SaaS dan data operasional. Platform summary tidak memuat foto/koordinat; detail perjalanan memerlukan grant. |

### INT

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| INT-01 | PROTO | Batas lingkungan | Akun, database, bucket, queue prefix dan credentials demo terpisah dari production. PAYMENT_LIVE_ENABLED dan SAAS_BILLING_LIVE_ENABLED selalu false; tidak ada silent fallback dari provider real ke fake. |

### CAM

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| CAM-01 | PROTO | Kamera dalam aplikasi | Customer draft request, driver pickup/kendala/handover, admin/owner berizin dapat capture, preview, retake dan catatan; satu foto terkait request/kendaraan/tahap, order saat tersedia. |
| CAM-02 | PROTO | Metadata dan sumber | Simpan waktu kejadian, jam perangkat, server received, zona IANA, koordinat nullable, accuracy, location_captured_at, sumber device/stale/manual/simulated/unknown dan uploader; gallery tidak diklaim capture langsung. |
| CAM-03 | PROTO | Original dan overlay | Original immutable dan derivative berelasi; overlay waktu+zona+lokasi/sumber+job ref+DEMO terbaca; lokasi tak tersedia ditulis; reverse geocode opsional bersumber; mini-map gagal tidak membatalkan foto. |
| CAM-04 | PROTO | Durable upload | Salin file cache ke penyimpanan permanen app sebelum saved; SQLite outbox bertahan setelah terminate/restart; retry UUID/hash tidak menggandakan foto; dependency draft disinkronkan dahulu. |
| CAM-05 | PROTO | Permission dan kapasitas lokal | Kamera denied menawarkan catatan/impor dengan label; GPS denied tetap foto tanpa koordinat; low storage tidak menampilkan saved palsu; jaringan mati tetap pending dengan retry. |
| CAM-06 | PROTO | Akses dan ekspor foto | Policy tenant/order/role berlaku untuk original, derivative, thumbnail dan export; customer hanya bagian relevan; hash memeriksa integritas file, tidak membuktikan kebenaran kejadian. |

### ANA

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| ANA-01 | PROTO | Definisi dan audit metrik | M-01–M-12 mendefinisikan formula, sumber, tanggal, zona, filter, koreksi dan unknown; dashboard memakai query transaksi yang sama dengan report. |
| ANA-02 | PROTO | Pendapatan, penerimaan dan piutang | Invoice net, receipt verified demo, allocation, unapplied dan piutang ditampilkan terpisah; tidak disebut laba bersih atau kas bank. |
| ANA-03 | PROTO | Biaya dan kontribusi | Estimate snapshot vs actual approved; missing tidak nol; provisional/final jelas; tampil coverage dan sampel; tidak menyimpulkan ROI dari seed. |
| ANA-04 | PROTO | Konsistensi dan drill-down | Angka agregat dapat ditelusuri ke ID sumber pada snapshot as_of yang sama; koreksi/reversal terhitung sekali; scope per tenant dan organisasi ditegakkan. |

### RPT

| ID | Scope | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| RPT-01 | PROTO | Dokumen berbagi PDF | Template ringkasan pekerjaan, bukti pickup/handover, invoice dan receipt DEMO; issuer/scope/time/mode jelas, tidak mengandung margin di customer DTO. |
| RPT-02 | PROTO | Rekap CSV | Template biaya/kontribusi, piutang, layanan B2B dengan filter tanggal dasar; izin per kolom/baris, escape formula CSV, metadata cutoff dan DEMO; tanpa report builder. |

## 7. Analytics dan report: kamus metrik kanonik

Filter umum wajib: tenant, interval [from,to), as_of, zona IANA tenant (default Asia/Jakarta), business_account bila diizinkan, unit/driver bila relevan. UTC disimpan, batas tanggal bisnis dikonversi server. Dashboard/export menampilkan filter, cutoff dan versi formula. Snapshot status diambil as_of; jangan memakai status sekarang untuk laporan historis tanpa event history. Koreksi tidak menghapus histori. `null/unknown` berbeda dari 0; nol hanya setelah query lengkap memastikan tidak ada nilai. Pembatalan tidak menghapus request/quote dari cohort.

| ID/metrik | Formula dan sumber | Tanggal acuan/filter khusus | Koreksi, missing dan interpretasi |
|---|---|---|---|
| M-01 Request/status | count distinct requests.id per status as_of | request.created_at dalam periode | Canceled/lost tetap kategori; draft dihitung; tanpa order tetap request |
| M-02 Order/status | count distinct orders.id per execution as_of | order.confirmed_at dalam periode | Canceled/aborted tetap kategori; request belum converted bukan order |
| M-03 Konversi quote | request dalam cohort first_quote_sent_at yang memiliki accepted quote by as_of / request cohort yang pernah sent ×100% | first_quote_sent_at dalam periode; satu request dihitung sekali, bukan jumlah versi | Rejected/expired/lost tetap denominator; accepted lalu order canceled tetap conversion; denominator 0 → null |
| M-04 Selesai/batal/bermasalah | completed=count handed_over_at; canceled=count canceled_at; aborted=count aborted_at; problematic=count distinct order dengan incident opened dalam periode (dispute handover B03 juga memiliki incident) | Masing-masing event dalam periode, label terpisah; selesai includes handed_over/closed | Problematic dapat overlap completed; jangan dijumlah sebagai partition; status voided event lewat reversal bila ada |
| M-05 Nilai invoice net | sum issued invoice amount − credit posted linked | invoice.issued_at cohort periode; kredit sampai as_of | Void draft dikecualikan; corrected asal tetap net-of-credit, replacement dihitung jika issued; bukan omzet kas atau pendapatan akuntansi |
| M-06 Penerimaan demo | sum receipt.posted amount − receipt reversals | posted_at/reversed_at **masing-masing** dalam periode | Refund dilaporkan terpisah; bukti pending/rejected tak dihitung; bukan saldo rekening bank |
| M-07 Refund/net penerimaan demo | refund=sum recorded refunds dalam periode; net=M-06−refund | posted_at/refund.recorded_at, bukan upload_at | Refund decision approved belum recorded tidak mengurangi; tampil gross/refund/net |
| M-08 Piutang dan umur | outstanding per seluruh invoice issued sampai as_of; aging berdasarkan due_date dan tanggal lokal as_of | Snapshot, bukan hanya invoice cohort periode; due_date < tanggal lokal berarti overdue | Partial/kredit/reversal dipakai; missing due_date bucket unknown, bukan current; unapplied tak mengurangi invoice lain otomatis |
| M-09 Estimasi vs actual | per pekerjaan: approved actual D − frozen estimate D; persen variance bila estimate>0 | cohort completed_at dalam periode; costs posted sampai as_of | Sum per kelompok hanya pasangan biaya lengkap; tampil coverage; missing actual null, tidak nol |
| M-10 Kontribusi pekerjaan | commercial_net(order)=accepted quote+approved changes−commercial credits; contribution=commercial_net−approved actual D−F actual | cohort completed_at periode; transaksi sampai as_of | Bukan invoice net jika belum ditagih, bukan kas/laba bersih; final hanya biaya final dan fee diketahui; provisional tampil terpisah; missing D → nilai null |
| M-11 Aktivitas unit/driver/B2B | count distinct completed order; unit/driver adalah assignment aktif saat handover, reassign sebelumnya di histori | completed_at periode; B2B mengikuti order snapshot | Satu order tidak diduplikasi pada dua driver; tampil jenis/rute/jarak yang diketahui dan sampel; bukan ranking kinerja tunggal |
| M-12 Kelengkapan | completed order cost_final / completed; evidence complete / completed; completed order dengan sekurangnya satu invoice issued/current yang sah / completed (distinct order, bukan jumlah versi invoice); masing-masing ×100% | completed cohort dan as_of yang sama | Denominator 0 → null; alasan incomplete per record dapat dibuka; coverage tidak mengisi biaya yang hilang |

Financial date: event_at menyatakan kejadian; device_recorded_at jam perangkat; received_at sinkronisasi; posted_at saat posting keuangan server. Laporan arus memakai posted_at; kronologi operasi memakai occurred_at/event_at tervalidasi. Keterlambatan input ditandai, tidak backdate receipt diam-diam. Demo business clock boleh mengatur data/expiry bisnis; autentikasi/security TTL memakai clock server nyata, tidak ikut time-travel.

Report tetap: PDF ringkasan pekerjaan, pickup/handover, invoice dan receipt; CSV rekap biaya/kontribusi, piutang, layanan B2B. Header DEMO, operator sintetis, generated_at/as_of/zona/filter/version; row IDs untuk penelusuran. Customer PDF hanya kondisi relevan, tanpa margin/driver internal/cost; original foto tidak otomatis dibagikan. CSV termasuk metadata filter dan record_type bila perlu; sanitize awalan =,+,-,@, tab/CR agar tidak menjadi formula spreadsheet. Tidak ada report builder, analytics prediktif atau klaim ROI.

### 7.1 Kontrak isi template laporan

| Template ID/format | Isi wajib | Izin/filter |
|---|---|---|
| REP-01 PDF ringkasan pekerjaan | Operator, request/order/vehicle ref, pihak relevan, layanan, status timeline, jadwal dan actual event time, assignment history yang boleh dibagikan, incident/exception, DEMO | Own order customer atau staff; filter satu order; margin/cost internal dikecualikan |
| REP-02 PDF pickup/serah-terima | Kendaraan, tahap, petugas/penerima sesuai disclosure, foto overlay terpilih, waktu/sumber/akurasi lokasi atau unknown, catatan kondisi/keberatan, status bukti, DEMO | Order participant terkait; original tidak otomatis disertakan |
| REP-03 PDF invoice | Issuer operator sintetis, customer/B2B, nomor/issued/due, quote/change order ref, item approved, credit reference, total net/outstanding pada as_of, instruksi DEMO-NONPAYABLE, DEMO | Finance/own payer/B2B finance, satu invoice |
| REP-04 PDF receipt | Issuer, receipt/invoice ref, jumlah verified demo, metode/custody yang relevan, posted_at dan event_at, alokasi/unapplied, reversal/refund jika ada, verifier yang diizinkan, DEMO | Finance/own payer; bukan bukti bank settlement |
| REP-05 CSV biaya/kontribusi | order_id, completed_at, unit/driver/B2B ref, commercial_net, estimate_D, actual_D nullable, F, variance, contribution nullable, provisional/final, completeness | Owner/finance, completed cohort, filter unit/driver/account |
| REP-06 CSV piutang | invoice_id/order_id/account, issued_at/due_date, gross/credit/net/allocation/outstanding, aging_bucket, as_of, DEMO | Finance tenant atau B2B finance organisasinya; seluruh open invoice sampai cutoff |
| REP-07 CSV layanan B2B | business_account, order_id, layanan/rute, completed/status, PO ref, invoice net/outstanding, evidence status | Organisasi sendiri; owner dapat versi internal tambahan melalui REP-05, bukan margin di CSV customer |

Semua template memakai filter/cutoff/zona/formula version yang ditampilkan dan dapat ditelusuri ke ID sumber. Pembulatan hanya tampilan; nominal CSV/PDF sama dengan ledger. Export merupakan dokumen DEMO terautentikasi, bukan tautan publik tanpa batas. Bukti penerima/penyerah assisted menyebut bahwa petugas mencatat pernyataannya; tidak mengklaim tanda tangan digital tersertifikasi.

## 8. Fixture deterministik, oracle dan demo

### 8.1 Identitas dan clock

F-01–F-08 tetap sebagai fixture terisolasi untuk kalkulator/edge cases; **tidak dijumlah ke dashboard F-09**. F-09 adalah satu baseline analitik 24 request selama 30 hari (19 request pernah mendapat quote, 14 menjadi order). Demo clock C0 = **2026-10-21T05:00:00Z (12:00 WIB)**; periode 22 September–21 Oktober 2026, tanggal lokal [2026-09-22,2026-10-22). Day 1=22 September, Day 30=21 Oktober. Tanggal tiap baris d = tanggal day pada 08:00 WIB; quote sent 08:10, confirm 08:20, completed jika relevan 09:30, invoice issued 10:00, receipt posted 10:30, credit/refund day+1 11:00. Requests nonconverted tidak memiliki event confirm/complete. Semua kejadian <=C0. Quote expiry day+1; A11/B05 expired, A13 sent tetapi akan expired pada C0 jika tak diperbarui; demo membuat versi baru untuk acceptance. Seluruh corrected event menurunkan status derived, tanpa menghapus entry.

Tabel merupakan specification seed, **script seeder belum diimplementasikan**. ID di implementasi dapat UUIDv5(namespace TovvDemo2.1, alias) sehingga tetap deterministik. Alias di bawah dipertahankan pada fixture_key. Seed version `tovv-2.1-f09`, tidak random runtime untuk nilai bisnis.

| Fixture | Relasi dan isi |
|---|---|
| F-01 | Kalkulator nominal §5, terisolasi dari F-09 |
| F-02 | Kalkulator persentase/rounding §5 |
| F-03 | A=Operator Angkut Demo, subscription 500.000/30 hari; B=Operator Mobilitas Demo, success 10.000; seluruhnya DEMO |
| F-04 | A-U1 1.500kg/deck 4500×1900mm, A-U2 3.000kg/6000×2200mm, A-U3 out_of_service, A-P1 mitra 3.500kg/6500×2300mm; B-U1 3.000kg/6000×2200mm. Kendaraan demo 1.800kg/4500×1800mm. U1 terdekat tetapi ditolak; spesifikasi sintetis |
| F-05 | A: owner-A (juga driver), admin-A1/A2 dispatcher, finance-A, driver-A1/A2/partner-A, customer-A1/A2; BA1 Bengkel Demo, BA2 Dealer Demo, masing-masing requester/approver; B: owner-B/admin-B/finance-B/driver-B1/customer-B1, BB1 Bengkel B Demo. Tidak ada credential publik; dibuat CLI lokal |
| F-06 | Replay Surabaya–Sidoarjo (koordinat sintetis -7.2575,112.7521 → -7.4478,112.7183), time-zone fixture Asia/Makassar; jarak/ETA ilustratif. Tidak ada klaim jalur truk aman |
| F-07 | Branch fixture untuk expiry/conflict/stale/reject/overdue; dibuat dari snapshot F-09 dan reset sesudah tiap uji |
| F-08 | Uang muka 500.000, expense approved 420.000, return 80.000 → outstanding advance 0; expense hanya 420.000 |
| F-09 | Tabel transaksi utama dan oracle di bawah; 24 requests, 14 orders, 19 quoted requests |
| F-10 | Photo packet synthetic placeholder bertanda DEMO, sample camera output **hanya** setelah device capture; gallery origin, denied/stale/manual/unknown, offline reboot, original+overlay/hash; seeded image bukan bukti kamera |
| F-11 | Payment proof/requests/ledger variants terkait invoice F-09; belum ada bank/gateway |
| F-12 | Delegasi owner-A→admin-A1 8jam, limit100.000; admin-A2 tanpa grant; owner driver pada A06, driver lain tetap terbatas |
| F-13 | Matriks izin A/B, BA1/BA2, requester/approver/receiver; support granted/expired/revoked |

Setiap order O-<alias> terhubung request R-<alias>, kendaraan V-<alias>, quote Q-<alias>-v1, invoice I-<alias> hanya bila gross>0. P1/P2 pribadi A; BP1 pribadi B; BA1/BA2/BB1 organisasi. Semua order menggunakan unit eligible A-U2 atau B-U1; A03 memakai A-P1 mitra dengan actual partner cost sudah termasuk D. A06 owner-A mengemudi; A07 offered driver-A1 ditolak, pengganti driver-A2 masih offered sehingga execution tetap confirmed; B04 assignment accepted. Default historical completed A memakai driver-A1, A03 partner-A, dan seluruh B driver-B1. A08 assignment canceled sebelum loading; A09 driver-A2 aborted. Reservation confirmed untuk active A06/A07/B04, released untuk completed/canceled; A09 released hanya sesudah custody bebas tercatat. Timestamp intermediate status berurutan di antara confirm dan complete; actual detail steps seeder mengikuti state machine, tidak langsung melompat dari confirmed ke closed. Tanggal historis berbeda, sehingga tidak ada jadwal overlap baseline. Race dibuat branch A07 dengan pesaing baru dan interval sama. Kendaraan per request satu, termasuk draft.

Untuk completed: accepted commercial price = gross sebelum kredit kecuali A05=1.300.000 (selesai belum invoice). A10 net commercial=800.000 setelah credit. A06/07/08/09/B04 harga accepted masing-masing 1.400.000/1.250.000/1.000.000/1.600.000/1.500.000; tidak masuk kontribusi completed. Quote tanpa order A11/A12/A13/B05/B06 =1.200.000/1.100.000/1.500.000/1.300.000/1.000.000. A12/B06 rejected/lost, lainnya sent/expired sesuai clock. Draft lain belum punya quote.

### 8.1.1 Detail fixture relasional tambahan

Tanggal jatuh tempo memakai net-7 seluruh invoice F-09. Terms-version TA1/TB1 disnapshot saat quote; PO wajib BA1/BB1, opsional BA2. Requester dan approver masing-masing akun berbeda; PO sintetis `DEMO-PO-<alias>` untuk order B2B. Rate-card fixture terisolasi F-05: rute RC-LOCAL reguler BA1=1.000.000 valid day1–day30, standar A=1.200.000; BA2 rate lama expired sebelum day1 sehingga membutuhkan tarif standar atau manual review; BB1 RC-LOCAL=1.000.000. Rute/kondisi khusus tabel F-09 memakai negotiated override berversi dengan alasan, sehingga harga accepted tabel tidak diganti rate saat ini. F-05 test mengubah validity untuk membuktikan precedence, tidak menambah transaksi ke dashboard.

Semua completed F-09 memiliki packet pickup dua foto dan delivery satu foto per kendaraan: `MP-<alias>-PU1/PU2/DO1`, tiap packet original+overlay sintetis. B03 memiliki tiga packet tetapi delivery berkeberatan sehingga evidence disputed dan completeness M-12 false. A06 memiliki pickup dua foto dan incident satu; active lainnya belum memerlukan delivery. Media alias adalah fixture asset berlabel SIMULASI, capture_origin gallery, dimuat melalui seeder berizin, location_source simulated; tidak mengklaim berasal kamera device. Capture nyata pada D-08 membuat packet baru berlabel DEMO dengan capture_origin camera dan source menurut hasil izin/GPS.

Request status ready_to_quote/quoted/converted memiliki data minimum; A14 berat/dimensi unknown → needs_review; A15/B08 draft. Kanal phone adalah assisted recording oleh admin, kontak/nama semua sintetis (email example.invalid, tidak memakai nomor orang nyata). Setiap unit memiliki biaya-template version CT-A/B-1, status source synthetic dan availability; U3 tetap excluded. Location replay track punya event UUID deterministik per assignment dengan interval15detik, dapat dipause>90detik untuk stale; jangan menjalankan replay bersamaan device source pada assignment sama tanpa pergantian mode yang diaudit.

### 8.2 Tabel transaksi utama

Seluruh nominal IDR integer. `—` berarti belum ada/belum lengkap, **bukan nol biaya**. Kolom receipt adalah gross posted, refund recorded terpisah. Receipt dan invoice menggunakan ledger yang sama dengan layar/report. Invoice due=issued local date+7hari.

| Alias | Day | Kanal | Request | Execution | Akun | Invoice gross | Credit | Receipt gross | Refund | D estimasi | D aktual | Kelengkapan biaya |
|---|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| A01 | 1 | phone | converted | closed | BA1 | 1000000 | 0 | 1000000 | 0 | 650000 | 650000 | final |
| A02 | 3 | mobile | converted | closed | P1 | 1500000 | 0 | 500000 | 0 | 900000 | 950000 | final |
| A03 | 5 | b2b | converted | closed | BA1 | 2000000 | 0 | 2200000 | 0 | 1300000 | 1400000 | final |
| A04 | 7 | phone | converted | closed | BA2 | 1200000 | 0 | 0 | 0 | 800000 | — | provisional |
| A05 | 9 | mobile | converted | handed_over | P2 | 0 | 0 | 0 | 0 | 850000 | 900000 | final |
| A06 | 11 | b2b | converted | in_transit | BA2 | 0 | 0 | 0 | 0 | 900000 | — | provisional |
| A07 | 13 | phone | converted | confirmed | P1 | 0 | 0 | 0 | 0 | 800000 | — | provisional |
| A08 | 15 | mobile | converted | canceled | P2 | 0 | 0 | 0 | 0 | 700000 | — | provisional |
| A09 | 17 | phone | converted | aborted | BA1 | 0 | 0 | 0 | 0 | 1100000 | — | provisional |
| A10 | 19 | b2b | converted | closed | BA1 | 1000000 | 200000 | 1000000 | 200000 | 500000 | 550000 | final |
| A11 | 21 | phone | quoted | — | P1 | 0 | 0 | 0 | 0 | 0 | — | na |
| A12 | 23 | mobile | lost | — | P2 | 0 | 0 | 0 | 0 | 0 | — | na |
| A13 | 25 | b2b | quoted | — | BA2 | 0 | 0 | 0 | 0 | 0 | — | na |
| A14 | 27 | phone | needs_review | — | P1 | 0 | 0 | 0 | 0 | 0 | — | na |
| A15 | 28 | mobile | draft | — | P2 | 0 | 0 | 0 | 0 | 0 | — | na |
| A16 | 29 | phone | canceled | — | P1 | 0 | 0 | 0 | 0 | 0 | — | na |
| B01 | 2 | phone | converted | closed | BB1 | 1000000 | 0 | 1000000 | 0 | 650000 | 700000 | final |
| B02 | 6 | b2b | converted | closed | BB1 | 1800000 | 0 | 800000 | 0 | 1100000 | 1200000 | final |
| B03 | 10 | mobile | converted | handed_over | BP1 | 1400000 | 0 | 0 | 0 | 850000 | — | provisional |
| B04 | 14 | phone | converted | assigned | BP1 | 0 | 0 | 0 | 0 | 900000 | — | provisional |
| B05 | 18 | b2b | quoted | — | BB1 | 0 | 0 | 0 | 0 | 0 | — | na |
| B06 | 22 | phone | lost | — | BP1 | 0 | 0 | 0 | 0 | 0 | — | na |
| B07 | 26 | mobile | ready_to_quote | — | BP1 | 0 | 0 | 0 | 0 | 0 | — | na |
| B08 | 30 | phone | draft | — | BP1 | 0 | 0 | 0 | 0 | 0 | — | na |

A04 proof rejected 1.200.000 (tidak receipt); B03 proof flagged_review 1.400.000 pada request expired (tidak receipt); A02 partial500.000; A03 overpay200.000 unapplied; A10 credit/refund200.000; A01 full demo. A06 incident penerima belum siap, tambahan200.000 pending approval tidak menambah commercial/invoice. Financial event dan expense approved memakai finance-A/B; payment proof submitted oleh customer/admin-A1 atau admin-B, sehingga berbeda dari verifier. Delegasi F-12 efektif C0−1jam sampai C0+7jam; owner-A juga driver. Driver/default snapshot valid untuk jadwal yang berbeda tanggal. A09 incident abort custody; B03 handover disputed, biaya missing, usage pending review. A04 biaya provisional; final costs pada tabel semuanya approved dan lengkap. Completed lain evidence complete/accepted. A05 belum ditagih tetapi commercial net dan biaya diketahui.

Setiap receipt RC-<alias> satu proof PF-<alias> verified, kecuali rejected/pending tersebut. Alokasi AL-<alias> sebesar min(invoice net,receipt−refund). A10 entry historis: receipt1.000.000, allocation1.000.000, credit200.000, allocation reversal200.000, refund200.000; bukan satu row negatif tanpa asal. A03 available200.000. Payment request PR-<alias> punya amount awal gross dan reference DEMO-<alias>-01; fulfilled ketika requested amount sudah dialokasikan sah, A10 request lama superseded oleh correction. Reset branch untuk late/reverse/race tidak mengubah oracle utama.

### 8.3 Expected result baseline (bukan hasil uji aplikasi)

| Metrik | Tenant A | Tenant B | Total platform yang diizinkan |
|---|---:|---:|---:|
| Requests | 16 | 8 | 24 |
| Orders | 10 | 4 | 14 |
| Requests pernah quote | 13 | 6 | 19 |
| Requests accepted | 10 | 4 | 14 |
| Completed | 6 | 3 | 9 |
| Invoice gross | 6700000 | 4200000 | 10900000 |
| Credit | 200000 | 0 | 200000 |
| Invoice net | 6500000 | 4200000 | 10700000 |
| Receipt gross posted | 4700000 | 1800000 | 6500000 |
| Refund recorded | 200000 | 0 | 200000 |
| Allocation net | 4300000 | 1800000 | 6100000 |
| Piutang | 2200000 | 2400000 | 4600000 |
| Unapplied | 200000 | 0 | 200000 |

Total platform keuangan di tabel hanya oracle QA dengan kewenangan pengujian; endpoint platform summary **tidak otomatis boleh membagikan** semua kolom ke staff. Konversi A=10/13=76,9231%, B=4/6=66,6667%, gabungan QA=14/19=73,6842%, dibulatkan UI 2 desimal. Completed A=6 (A01–A05,A10), B=3 (B01–B03). Request states A: converted10, quoted2, lost1, needs_review1, draft1,canceled1; B: converted4,quoted1,lost1,ready_to_quote1,draft1. Order A: closed5,handed_over1,in_transit1,confirmed1,canceled1,aborted1; B: closed2,handed_over1,assigned1. Problematic=3 (A06,A09,B03), tidak dijumlah dengan status.

Net penerimaan A=4.500.000, B=1.800.000; gabungan6.300.000. Piutang A=2.200.000, B=2.400.000, seluruhnya overdue pada C0. Unapplied A=200.000, B=0. Due aging: A02 day3 due day10; A04 day7 due day14; B02 day6 due day13; B03 day10 due day17. Aging bucket 1–30hari=4.600.000; lainnya0. Upload pending/rejected tidak mengubah angka.

Refund adalah pengembalian penerimaan, bukan pengurang kontribusi kedua setelah commercial credit sudah mengurangi P. Kontribusi completed final A: A01=350.000, A02=550.000, A03=600.000, A05=400.000, A10=250.000; total **2.150.000, coverage5/6**. A04 null karena actual missing. B: B01=290.000, B02=590.000 (F success masing-masing10.000), total **880.000, coverage2/3**; B03 null/disputed. Total QA final known=3.030.000 pada7/9 completed, bukan kontribusi seluruh bisnis. A subscription fixed500.000 hanya preview, bukan F tiap order; tidak menguranginya lagi pada kontribusi pekerjaan. Actual D lengkap total A4.450.000/B1.900.000; estimate pasangan A4.200.000/B1.750.000; variance250.000/150.000 (total400.000). Provisional tidak ditotal sebagai nol.

Evidence coverage A6/6, B2/3; invoiced completed A5/6, B3/3. B03 invoice issued tetap sah walau dokumentasi disputed; penagihan dan usage eligibility terpisah. Usage B billable2=20.000, B03 pending_review, B04 belum eligible; A preview subscription500.000 tanpa success charge. Angka seed bukan harga jual/ROI.

### 8.4 Reset dan presentasi

Contract script target: `demo:seed --fixture=tovv-2.1-f09 --clock=<C0>`; `demo:reset --tenant-set=synthetic --confirm=<environment-id>` hanya CLI authenticated environment local/test/demo yang allowlisted, check database+bucket namespace, no production credentials, backup snapshot sebelum reset. Script belum tersedia. Stop worker/replay selama reset; transaction reset DB, hapus hanya prefix fixture, rebuild manifest, seed, start worker, assert oracle. Auth/security clock tetap real. Device outbox generasi seed lama tidak di-replay ke dataset baru: dataset_generation mismatch → review/archive, jangan hilang diam-diam.

| Demo | Aktor dan tindakan | Hasil yang harus terlihat |
|---|---|---|
| D-01 | Admin buat branch phone request; owner F-01 negosiasi; customer setuju versi baru; pilih U2, prioritas | U1 ditolak; estimasi/uncertainty; slot hanya setelah confirm; biaya prioritas eksplisit |
| D-02 | BA1 requester reorder A01; approver cek PO/tarif; admin confirm | Tidak bypass mandat atau capacity; rate expired review |
| D-03 | Driver branch A07 accept; capture pickup, replay/device perjalanan, offline foto, handover | Source/badge berbeda; stale jujur; upload setelah restart; receiver not ready dapat ditangani |
| D-04 | Finance invoice branch A05; customer proof; finance verify partial/full; coba reject/late/overpay | Pending bukan paid, receipt/alokasi satu, saldo dapat ditelusuri; tanpa API eksternal |
| D-05 | Owner dashboard F-09; lihat A04/B03 missing, A03 unapplied, dua SaaS preview | Oracle §8.3 cocok; contribution bukan laba; scope tenant tetap |
| D-06 | Staff ADMIN STUB/actual sesuai bukti; owner approve grant lalu revoke | Summary minimum; detail hanya grant; actual integration tidak diklaim dari harness |
| D-07 | Owner-A mode driver A06; admin-A1 delegasi sah, A2 mencoba override; expiry/revoke | Hanya tindakan dalam limit; daftar harian menampilkan eskalasi, driver lain tetap terbatas |
| D-08 | Customer capture draft A15; gallery, GPS denied, storage penuh; finance export CSV/PDF | Original/overlay terhubung; error dapat dipulihkan; DEMO dan scope export benar |

Demo memakai branch/reset antar cerita; angka setelah transaksi demo berubah secara sah, jangan dipaksa tetap oracle baseline. Rekam mode/perangkat/build, bantuan dan feedback; data rute perangkat peserta disimpan hanya untuk uji berizin dan bukan seed presentasi publik.

## 9. Calon moat, keputusan terbuka dan kelanjutan

Calon moat: kecocokan proses operator, data biaya aktual yang berguna bagi operator pemilik data, keterhubungan kanal pekerjaan, onboarding efisien, serta kepercayaan pada data/sistem. Semua harus dibuktikan melalui penggunaan berulang. Nearby, GPS camera, empat tampilan dan invoice adalah kemampuan produk, tidak otomatis moat. Tidak ada klaim efek jaringan atau penggunaan data lintas tenant tanpa dasar/izin.

| Keputusan | Default prototype | Bukti/keputusan lanjutan yang material |
|---|---|---|
| DEC-01 | Flatbed satu kendaraan, sendiri/mitra | Kapasitas/kondisi/jadwal nyata melalui observasi operator |
| DEC-02 | Biaya, prioritas, limit delegasi dan harga SaaS sintetis | Struktur biaya dan mandat yang diterima operator; WTP independen |
| DEC-03 | Stack baseline, exact SDK belum dikunci | Repo/lockfile, Android+iPhone, signing dan spike compatibility T-01 |
| DEC-04 | Manual-demo payment, no API bank | Mekanisme penerimaan nyata/policy correction bila kelak pilot; gateway bukan prasyarat otomatis |
| DEC-05 | Retensi raw lokasi7hari/media14hari setelah sesi/audit30hari | Persetujuan uji, TTL backup dan kebutuhan pilot; foto asli dapat sensitif |
| DEC-06 | Admin read-only contract harness | Akses repo/auth aktual, BFF dan test kedua commit sebelum verified-admin |
| DEC-07 | Net-7, B2B requester+approver | Terms/PO/mandat operator nyata dan biaya onboarding |
| DEC-08 | Provider peta/geocode/push opsional mode simulated yang jelas | Key, budget, ketentuan penyimpanan, device proof sebelum klaim aktual |
| DEC-09 | Foto dua pickup dan satu delivery atau exception beralasan | Minimum bukti lapangan yang cukup tanpa membebani driver |

VALIDATION_PLAN menentukan lanjut/perbaiki/tunda. Pilot berbayar berada setelah prototype dan memerlukan scope baru, persetujuan operator/data, keamanan/restore/dukungan serta kontrak; dokumen ini tidak mengotorisasi transaksi/transport nyata.

## 10. Migrasi requirement dan referensi

Riwayat penamaan: **Solveit Tow / Solveit Trow → Tovv**. Nama lama hanya dicatat di bagian migrasi ini. File standar tidak diganti. ID yang tidak tercantum sebagai perubahan berikut dipertahankan makna/scope-nya, dengan perapian bahasa dan penguatan AC terkait.

| Baseline | Paket2.1 | Alasan/pemetaan |
|---|---|---|
| PAY-03/PAY-04/PAY-07 PROTO | NEXT, ID dipertahankan | Gateway/webhook/merchant bukan syarat prototype; fungsi pengganti memakai PAY-09–PAY-12, bukan menyamakan semantik |
| PAY-01/02/05/06 | PROTO dipertegas | Invoice/manual receipt/correction/custody tetap; provider payout bagian PAY-06 ditunda NEXT |
| FIN-04/05 NEXT | PROTO terbatas | Delegasi fixed permissions dan daftar tindakan harian eksplisit diminta |
| FIN-06 NEXT | PROTO deskriptif | Ringkasan yang dapat ditelusuri; prediksi tetap NEXT |
| OPS-04 | PROTO + CAM-01–CAM-06 baru | Foto dasar tetap, GPS Map Camera dipisah requirement rinci |
| OPS-02/06, FLT-01–06 | Dipertahankan + FLT-09 | Freshness, lifecycle, nearby hanya own/managed |
| BIZ-08, FIN-02 | Dipertahankan + ANA-01–04, RPT-01–02 | Satu sumber metrik/report, bukan modul ganda |
| TEN-02 | Dipertahankan + TEN-07 | Izin aksi lebih rinci dan owner-driver context |
| PRO-02/04 | Dataset24, D-01–D-08 | Menggantikan seed minimum12 dan demo D-04 gateway |
| T-18; TC-032/033/034/063 | NEXT, bukan gate aktif | Jangan memakai ID lama untuk mengklaim pengujian pembayaran manual |
| F-01 fee4.000 | Administrasi internal ilustratif | Expected angka tetap, tanpa dependency gateway |
| VALIDATION_PLAN tidak ditemukan | Disusun kembali | Bukan klaim review versi lama |

Sumber resmi ditinjau 21 Oktober 2026: [Laravel13 releases](https://laravel.com/docs/13.x/releases) menyatakan dukungan PHP8.3–8.5; floor8.5.7 tetap keputusan baseline tim. [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) untuk CameraView/cache/config plugin; [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) untuk izin/background; [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/), [ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/), [ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/), [captureRef](https://docs.expo.dev/versions/latest/sdk/captureRef/), [Expo library compatibility](https://docs.expo.dev/workflow/using-libraries/). Halaman latest bukan instruksi menaikkan SDK baseline; exact versions baru dipin setelah uji.

[Bank Indonesia — QRIS](https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/ritel/kanal-layanan/qris/default.aspx) menjelaskan perbedaan MPM statis/dinamis dan penyelenggaraan melalui PJP. Keputusan Tovv: QR detail internal tidak disebut QRIS; tidak membuat QR pembayaran live pada prototype. Referensi memberi dasar desain, bukan bukti integrasi sudah berhasil.

## 11. Hasil pemeriksaan konsistensi paket dokumen

Pemeriksaan dokumenter 21 Oktober 2026: keenam file memakai Tovv/Solveit Indonesia dan paket2.1; tautan file lokal valid; 113 requirement tercatat (100 PROTO,13 NEXT); semua100 PROTO mempunyai task dan skenario; 30 task aktif dan T-18 ditunda; tidak ditemukan siklus dependensi task. Register test berisi76 skenario aktif NOT_RUN dan4 skenario provider historis DEFERRED. Requirement lama94 tetap tercatat,19 ID baru ditambahkan. Tidak ada payment gateway sebagai gate prototype.

Oracle fixture dihitung ulang secara independen dari baris transaksi: 24 request,14 order,19 request quoted; invoice net10.700.000, receipt gross6.500.000, refund200.000, allocation6.100.000, piutang4.600.000, unapplied200.000. Contribution final yang diketahui3.030.000 pada7/9 pekerjaan selesai; bukan total laba. Denominator conversion memakai19 request quoted, bukan18. Enam file menjadi isi ZIP tanpa file kode/helper/data pengguna.

Hasil ini memeriksa **dokumen, referensi dan aritmetika**, bukan implementasi, build mobile, perangkat, integrasi Admin, pengujian aplikasi atau validasi bisnis. Semua kemampuan tersebut tetap membutuhkan bukti sesuai TEST_PLAN/VALIDATION_PLAN.
