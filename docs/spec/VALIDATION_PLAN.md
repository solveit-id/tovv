# VALIDATION_PLAN — Tovv

## Provenance, versi dan batas bukti

Paket **2.1 — 21 Oktober 2026**. Produk **Tovv**; pemilik, pengembang dan penerbit **Solveit Indonesia**. Status dokumen: spesifikasi/rencana; bukan bukti aplikasi sudah dibuat atau diuji.

Baseline yang benar-benar dibaca: PRD v2.0 (file sumber PRD(2).md, identik dengan salinan PRD (1).md), ARCHITECTURE, IMPLEMENTATION_PLAN, INTEGRATION_PLAN dan TEST_PLAN masing-masing berlabel v1.0 dengan acuan PRD v2.0. Tidak ditemukan versi lebih baru. VALIDATION_PLAN.md tidak ditemukan setelah pencarian nama; dokumen itu **disusun kembali**, bukan hasil pemeriksaan file lama. Pesan pengguna terbaru mengungguli baseline. Seluruh enam dokumen kini memakai versi paket 2.1.

Urutan baca: [PRD](PRD.md) → [ARCHITECTURE](ARCHITECTURE.md) → [INTEGRATION_PLAN](INTEGRATION_PLAN.md) → [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) → [TEST_PLAN](TEST_PLAN.md) → [VALIDATION_PLAN](VALIDATION_PLAN.md). PRD menguasai scope/aturan bisnis; kontrak dan model harus mematuhinya. Perubahan mengharuskan pembaruan requirement, task, test, fixture dan keputusan terkait pada paket yang sama.
## Catatan implementasi (23 Oktober 2026)

Belum ada sesi validasi yang dijalankan. Prototype frontend dengan data sintetis berlabel DEMO sudah bisa dipakai untuk Fase B (uji kegunaan) dalam bahasa Indonesia atau Inggris, untuk tiga peran yang dibuka aplikasi (owner, driver, pelanggan). Hasil uji kegunaan nanti tidak boleh dibaca sebagai bukti backend atau manfaat operasional.

## 1. Status, tujuan dan batas kesimpulan

**Dokumen disusun kembali** dari PRD2.1, dokumen baseline yang ditemukan, dan instruksi pengguna. Tidak ditemukan VALIDATION_PLAN lama, sehingga tidak ada klaim mempertahankan ID hipotesis atau hasil riset dari file tersebut. Semua aktivitas di sini PLANNED/NOT_RUN; belum ada wawancara, observasi, pembayaran atau hasil eksperimen yang diklaim.

Tujuan keputusan: apakah masalah cukup nyata, sering/mahal bagi operator, apakah Tovv dapat dipakai dalam alur mereka, apakah manfaat operasional dapat diukur, dan apakah willingness to pay serta biaya melayani memungkinkan usaha SaaS. Keberhasilan teknis kamera/invoice/nearby tidak otomatis menjawab pertanyaan tersebut.

Pisahkan lima validasi: masalah, kegunaan, manfaat operasional, kemauan membayar, onboarding/dukungan. Demo sintetis hanya mendukung pemahaman, alur dan kegunaan; bukan bukti ROI/retensi/product-market fit. Pilot operasional berbayar adalah fase baru setelah prototype, bukan eksperimen transport/pembayaran nyata yang diizinkan paket ini.

## 2. Register hipotesis dan prioritas

Semua target angka berikut **target eksperimen awal**, bukan benchmark industri, temuan atau janji penjualan. Revisi target harus dicatat sebelum membaca hasil batch berikutnya agar tidak memilih hasil yang menguntungkan.

| ID | Hipotesis/masalah | Requirement | Bukti saat ini | Risiko bila salah | Metode |
|---|---|---|---|---|---|
| H-01 | Owner membutuhkan dasar negosiasi yang dapat dijelaskan | QTE-01–08 | Brief founder, belum observasi | Kalkulator membebani tanpa dipakai | Rekonstruksi3 pekerjaan terakhir + tugas negosiasi |
| H-02 | Admin sulit mengetahui kapasitas/jadwal/kelengkapan | ORD/FLT | Brief saja | Data armada tak terpelihara | Observasi dispatch dan benturan aktual |
| H-03 | Driver membutuhkan instruksi/dokumentasi sederhana | OPS/CAM | Hipotesis, perangkat belum dibuktikan | Kamera/input ditinggalkan | Walkthrough berhenti, task capture/offline |
| H-04 | Owner perlu delegasi saat tidak tersedia/mengemudi | FIN-04/05,TEN-07 | Instruksi founder, belum mandat operator | Owner tetap harus menyetujui semuanya | Observasi eskalasi dan tugas admin terbatas |
| H-05 | Pekerjaan, biaya, invoice dan penerimaan terputus | PAY/FIN/ANA/RPT | Hipotesis | Manfaat administrasi tidak cukup besar | Telusuri order→nota→invoice→receipt yang disamarkan |
| H-06 | Pelanggan bisnis berulang bernilai dan prosesnya berbeda | BIZ | Minat founder, volume belum diketahui | Setup B2B mahal untuk sedikit repeat | Histori repeat/PO/terms dan interview requester |
| H-07 | Manual verification tanpa gateway diterima | PAY-09–12 | Keputusan prototype, preferensi pasar belum ada | Review terlalu berat atau owner mengharapkan otomatis | Demo partial/late/reject; ukur waktu dan ekspektasi |
| H-08 | Laporan dipakai untuk tindakan, bukan sekadar dilihat | ANA/FIN-06 | Belum ada bukti | Dashboard sekali pakai | Minta owner menjelaskan angka dan memilih tindakan |
| H-09 | Subscription atau success pricing mempunyai pembeli | SUB | Harga seed ilustrasi | Keinginan fitur tidak menjadi pembelian | WTP decision-maker dengan trade-off konkret |
| H-10 | Onboarding/support bisa dilakukan dengan biaya wajar | TEN-06,MOB | Belum diketahui | Pendapatan habis untuk input/support | Rehearsal setup dan pencatatan waktu tim/peserta |

Kebutuhan isolasi tenant, otorisasi, integritas uang/reservasi/media wajib, tidak dilakukan voting pengguna untuk menghapusnya. Klaim pesaing/keunikan tidak ditanyakan dengan pertanyaan sugestif; tanyakan alternatif yang benar-benar dipakai dan mengapa dipilih.

## 3. Rekrutmen dan perlindungan terhadap bias

Target awal discovery **6 operator dari sekurangnya3 relasi sumber**, minimal4 tidak memiliki hubungan dekat founder. Koneksi Surabaya Towing boleh satu design partner; jangan menyebutnya pelanggan tervalidasi. Variasikan owner-driver, operator dengan admin terpisah, fleet kecil/lebih terstruktur, unit sendiri/managed partner dan proporsi B2B. Jumlah ini purposive discovery, bukan sampel representatif pasar Indonesia.

Calon dapat direkrut lewat direktori bisnis/asosiasi/rujukan bengkel atau jaringan profesional yang relevan setelah tim mendapat otorisasi untuk menghubungi. Dokumen ini tidak mengirim pesan atau menjanjikan insentif. Catat sumber, hubungan founder, karakter operasi, alasan ikut/menolak, decision-maker dan solusi kini. Hindari hanya operator yang menyukai teknologi atau sudah tertarik demo. Jika independent recruitment gagal, status external validity BLOCKED dan jangan mengklaim market validation.

Aktor: owner pembeli, admin/dispatcher, finance, driver dan bila memungkinkan requester/approver B2B. Target usability awal8–12 peserta dari3operator, mencakup setiap peran penting; peran ganda dicatat, bukan dihitung dua orang. Driver yang tidak nyaman teknologi penting untuk menguji beban input. Catat Android/iOS yang digunakan; mayoritas Android tidak menghapus kewajiban teknis iOS.

Bias mitigations: interviewer selain founder bila tersedia; pertanyaan masalah sebelum demo; minta contoh terakhir bukan opini “apakah bagus”; cari bukti yang bertentangan; pisahkan catatan kenalan vs independen; jangan menawar bantuan software lain agar peserta mengatakan bersedia bayar. Persetujuan perekaman dan penggunaan kutipan eksplisit; data transaksi disamarkan, tidak dicampur seed publik. Tidak menyimpan kredensial bank atau screenshot rekening sensitif tanpa kebutuhan/izin yang jelas.

## 4. Fase A — validasi masalah

Sesi45–60menit per operator (target desain). Awali tanpa demo. Minta peserta menceritakan3 pekerjaan terakhir: satu lancar, satu negosiasi/kendala, satu B2B jika ada. Telusuri kanal masuk, siapa menetapkan harga, apa yang diketahui tentang biaya, penugasan, foto, invoice, pemeriksaan penerimaan dan pencatatan biaya. Tanyakan langkah ketika owner tidak tersedia dan kapan data ditulis ulang.

| Data baseline | Cara mengumpulkan | Hindari |
|---|---|---|
| Frekuensi kejadian | Count kasus pada20pekerjaan terbaru atau30hari jika catatan tersedia; denominator terlihat | Mengubah “sering” menjadi persentase tanpa data |
| Waktu administrasi | Observasi/time log per tugas, pisahkan active work dan waiting | Mengalikan estimasi ingatan menjadi ROI pasti |
| Kesalahan/ulang kerja | Bukti koreksi harga, benturan, missing foto atau invoice dengan contoh anonim | Menganggap semua kesalahan dapat diselesaikan software |
| Dampak biaya | Nilai terdokumentasi/rework time; tandai estimate vs evidence | Menyebut gross revenue lost sebagai laba hilang |
| Alur keputusan | Aktor/mandat/approval/custody dan handoff | Menganggap owner selalu finance/driver |
| Alternatif | Chat, spreadsheet, software yang digunakan, biaya dan switching cost | Klaim pesaing tidak punya fitur tanpa verifikasi |

Output per operator: process map sederhana, pain episode, baseline dengan numerator/denominator, missing evidence, buyer/access path, alternative and switching cost, H IDs. Pernyataan peserta ≠ observasi; label interview_report/observed_record/time_measured. Skor prioritas masalah mempertimbangkan frekuensi, dampak, kemampuan software mengurangi, beban input dan akses pembeli; jangan menjumlah skor subjektif menjadi kepastian pasar.

Target lanjut A: setidaknya4/6 operator, termasuk2independen, menunjukkan contoh konkret dua masalah inti H-01/H-02/H-05 atau H-04 yang cukup penting untuk dicoba; minimal3 bersedia sesi tugas lanjutan. Jika hanya pujian atau tidak ada akses catatan, perbaiki hipotesis/rekrutmen. Jika tidak ada masalah berulang yang relevan, tunda perluasan fitur walau prototype menarik.

## 5. Fase B — kegunaan dengan prototype sintetis

Prasyarat G7-A untuk fitur yang diuji; daftar capability simulated/blocked dijelaskan sebelum sesi. Peserta diberi tujuan, bukan klik yang harus dilakukan. Data F-09, branch reset tiap peserta, orang yang memandu mencatat bantuan. Jangan meminta pengemudi mengoperasikan aplikasi ketika kendaraan berjalan.

| Tugas | Aktor | Keberhasilan yang diamati | Kesalahan kritis |
|---|---|---|---|
| U-01 Negosiasi harga dan pilih unit | Owner/admin | Menjelaskan biaya missing/target dan menolak U1 tidak layak | Menganggap estimasi jaminan laba atau override kapasitas |
| U-02 Telepon order/owner mengemudi | Admin/owner-driver | Mencatat request tanpa app customer, memakai mandat sah | Berbagi login owner atau driver melihat margin |
| U-03 Kamera dan offline | Customer/driver | Capture/retake, tahu original/overlay dan upload pending setelah reopen | Mengira GPS unknown adalah lokasi aktual atau pending sudah uploaded |
| U-04 Tracking | Owner/customer | Menjelaskan source, last updated, stale dan ETA | Mengira replay/stale sebagai live |
| U-05 Invoice/proof/review | Customer/finance | Memahami screenshot pending; finance verify partial; outstanding benar | Menganggap QR internal QRIS atau receipt bank otomatis |
| U-06 B2B repeat/approval | Requester/approver | Request baru dengan review tarif/jadwal/mandat | Order lama otomatis dispatch atau lintas org terbuka |
| U-07 Analytics/report | Owner/finance | Membedakan invoice, receipt, piutang, contribution/provisional | Menyebut missing sebagai nol atau contribution laba bersih |
| U-08 Daily actions | Admin | Menemukan bukti/approval/piutang berikutnya dan PIC | Menandai selesai tanpa sumber bisnis resolved |

Metrik: completion unaided = tugas selesai tanpa petunjuk / tugas attempted; assisted/gagal dilaporkan terpisah. Time on task active, error count, abandon, help count, comprehension rubric0/1 per konsep dan komentar. Tugas yang blocked perangkat tidak dihitung sebagai selesai; laporkan denominator attempted+blocked. Target eksperimen: >=80% tugas utama selesai tanpa bantuan setelah pengenalan<=10menit, >=90% peserta memahami perbedaan pending receipt/QR internal/replay, nol kesalahan kritis keamanan/keuangan yang tidak tertangani. Sampel kecil dilaporkan count, bukan kesimpulan statistik.

Urutan manual vs prototype diacak/counterbalanced untuk tugas setara, fixture berbeda tetapi kompleksitas sama; hindari learning effect. Jika tahap camera hanya simulated, nilai pemahaman alur saja; beban driver/permission/offline belum tervalidasi. Dua putaran perbaikan dengan peserta berbeda bila memungkinkan; retest perbaikan, jangan hanya meminta peserta yang sudah hafal.

## 6. Fase C — manfaat operasional (setelah izin fase lanjutan)

Pada fase prototype sekarang, lakukan rehearsal tugas berpasangan sintetis dan catat hasil sebagai task-level indication. Mengukur penghematan operasional nyata memerlukan shadow study/pilot baru, persetujuan data dan proses, bukan demo seed. Tidak ada transport berbayar atau penerimaan uang nyata dalam pengujian prototype.

Rancangan calon shadow study:2minggu baseline dan2minggu observasi dengan metode baru pada pekerjaan setara, target awal>=20pekerjaan/operator bila volume memungkinkan. Operator tetap menggunakan proses resminya; perubahan proses operasional/pilot perlu persetujuan dan assessment terpisah. Kategori own/partner, jarak, B2B/pribadi, jumlah insiden dan pengalaman staf dicatat agar perbandingan tidak bias.

| Metrik manfaat | Formula/baseline | Target eksperimen dan batas |
|---|---|---|
| Waktu quote | Median active minutes request lengkap→quote siap; waiting dilaporkan terpisah | Penurunan>=20% dengan completeness tidak turun; target belum terbukti |
| Admin per pekerjaan | Total active minutes pencatatan/ulang/input/review/export termasuk Tovv | Penurunan>=20%; jangan mengabaikan input driver/owner |
| Kelengkapan bukti | Pekerjaan dengan item minimum / eligible pekerjaan | >=90% tanpa waktu input berlebihan; validasi item minimum operator |
| Keterlambatan invoice | handed_over_at→issued_at; median dan p90 | Bandingkan baseline; tujuan bukan otomatis mempercepat cash collection |
| Salah alokasi/koreksi | Count kesalahan verified / jumlah penerimaan ditinjau | Tidak meningkat; setiap salah saldo kritis menghentikan evaluasi terkait |
| Biaya tercatat | Completed dengan actual final / completed | >=80% dalam3hari kerja; target eksperimen, bukan fakta perilaku |
| Delegasi | Tindakan dalam mandat tanpa owner / eligible tindakan | Ukur tanpa mengurangi kontrol; tidak menetapkan persentase universal |
| Beban foto/input | Median waktu per packet+tahap+rework | Target task capture<=60detik di kondisi uji; koneksi/upload time terpisah |

Analisis before/after menunjukkan asosiasi, bukan atribusi kausal pasti. Laporkan volume, distribusi/range, confounder dan biaya tambahan sistem. Potensi nilai tenaga kerja = selisih waktu terukur × biaya tenaga kerja yang disetujui; belum ROI jika tidak memperhitungkan subscription, onboarding, device/data, dukungan dan perubahan kualitas. Tidak mengekstrapolasi seluruh industri dari satu operator.

## 7. Fase D — willingness to pay

Hanya owner/decision-maker yang memiliki otoritas anggaran dihitung buyer; driver menyukai UI bukan sinyal pembelian. Tawarkan dua konsep yang sama manfaatnya: subscription atau per-success sesuai definisi PRD; jelaskan tidak ada double charge, success bukan foto/status, dan demo belum operasional komersial.

F-03 harga500.000 vs10.000 hanya angka uji, bukan harga pasar/final. Siapkan2–3 rentang harga berdasarkan baseline dampak dan biaya melayani, diacak urutan penawarannya. Tanyakan budget owner kini, alternatif yang akan diganti, siapa menyetujui, syarat beli, keberatan dan biaya switching. Hindari pertanyaan “bersedia bayar berapa” sebagai satu-satunya bukti.

Ladder bukti: stated interest < meminta proposal/rencana procurement < menyetujui jadwal/scope bersyarat dan budget tertulis < pembayaran kontrak pilot nyata di fase terpisah < renewal/penggunaan berulang. LOI bersyarat bukan revenue. Pada prototype cukup konsep penawaran/proposal dan komitmen nonbinding; tidak checkout, tagih atau menerima uang.

Target eksperimen awal:3decision-maker independen meminta proposal konkret;2 mengonfirmasi rentang budget dan syarat pilot secara tertulis/nonbinding setelah mengetahui batas produk. Jika hanya kenalan founder atau harga harus gratis, H-09 belum terdukung. Boleh menunda monetisasi sambil memperbaiki workflow; jangan menyebut SaaS validated dari subscription selector demo.

## 8. Fase E — onboarding dan dukungan

Rehearsal setup dari data contoh operator yang disamarkan jika diizinkan: tenant, users/scopes, units/specifications, biaya, satu B2B/rate card/terms dan payment instructions demo. Catat waktu operator **dan** tim Solveit untuk mapping data, pembersihan, training, perubahan policy dan penanganan kesalahan. Tidak perlu self-service onboarding penuh.

Target eksperimen: operator dapat menyelesaikan tugas inti setelah pengenalan<=30menit; total setup awal<=2jam kerja gabungan untuk dataset kecil yang telah siap. Angka ini harus dilaporkan menurut kelengkapan data; jika butuh1hari data cleanup, jangan menyembunyikannya dari biaya onboarding. Support log: issue type, severity, channel, response/work time, recurrence, root cause product/training/data/device.

Contribution margin SaaS hipotesis per tenant = revenue plan yang disepakati − biaya hosting/media/maps/push variabel − support labor − amortized onboarding − biaya lain yang relevan. Jangan memakai gross invoice operator sebagai revenue Tovv. Ukur biaya actual baru ketika tersedia; selama prototype gunakan range asumsi transparan. Success model punya pendapatan fluktuatif dan biaya support tetap, subscription punya affordability risiko; evaluasi kedua skenario tanpa double fee. Belum menghitung LTV/CAC/retention dari seed.

## 9. Calon moat dan indikator pembuktiannya

| Calon moat | Bukti yang perlu dicari | Hal yang tidak cukup |
|---|---|---|
| Kecocokan proses | Penggunaan tanpa banyak workaround pada operator independen | Daftar fitur panjang |
| Data biaya aktual berguna | Operator mengisi berulang dan memakai variance untuk keputusan | Banyak data seed atau raw GPS |
| Kanal pekerjaan terhubung | Request assisted/mobile/B2B tetap tertelusuri tanpa pencatatan ganda | Integrasi WhatsApp yang belum dibuat |
| Onboarding efisien | Waktu setup/support menurun tanpa mengorbankan kualitas | Sekali berhasil pada founder connection |
| Kepercayaan data/sistem | Rekonsiliasi tepat, transparansi missing/stale, pemulihan terbukti | Foto GPS/hash atau badge keamanan saja |

Tidak mengklaim network effects, harga AI, data moat lintas tenant atau keunggulan eksklusif tanpa izin/bukti. Data setiap operator tetap miliknya sesuai kebijakan yang akan disepakati; benchmark lintas tenant bukan fitur PROTO dan tidak diasumsikan legal/berizin.

## 10. Kriteria lanjut, perbaiki, tunda

| Keputusan | Bukti minimum | Tindakan |
|---|---|---|
| Lanjut discovery ke demo | Masalah konkret lintas operator, akses aktor dan G7-A untuk alur ditunjukkan | Usability dengan disclosure mode |
| Perbaiki prototype | Masalah didukung tetapi task gagal, input berat atau konsep pembayaran/tracking disalahpahami | Perbaikan targeted, bukan tambah scope luas; ulang tugas |
| Pertimbangkan pilot terpisah | Masalah/usability terdukung, buyer+budget konkret, biaya support masuk akal, gate teknis kemampuan pilot lulus | Buat scope/kontrak/data/security/support plan baru; keputusan manusia |
| Tunda fitur | Masalah jarang/tidak mahal atau alternatif manual memadai | Pindahkan kandidat ke NEXT melalui change log |
| Tunda arah komersial | Tidak ada buyer independen, biaya melayani tak tertutup, atau operator tidak mau input data inti | Revisi segmen/solusi; jangan memaksa semua Orbit ke Tovv |
| Hentikan sesi terkait | Kebocoran, saldo salah, kehilangan data, risiko mengemudi atau persetujuan dicabut | Catat incident, pulihkan dan uji sebelum lanjut |

Keputusan memakai kombinasi kualitas bukti dan target, bukan skor otomatis. Satu pelanggan pilot tidak membuktikan PMF; retention memerlukan observasi cohort berulang di fase yang sesuai. Scope yang benar-benar diuji pada Android tidak dianggap bukti iOS.

## 11. Format catatan dan handoff

Catatan observasi: study_id/date/researcher, operator pseudonym, recruitment source/founder relationship, actor/authority, consent, hypothesis IDs, current process, episode/artifact, measured vs reported, numerator/denominator, task/build/mode/platform, errors/assistance/time, exact paraphrased finding, disconfirming evidence, limitation, next action/PIC.

Ledger keputusan: hypothesis → evidence IDs → confidence low/medium dengan alasan → lanjut/perbaiki/tunda → requirement/task/test yang berubah → tanggal review. Bukti bisnis disimpan terpisah dari test engineering; tautkan jika masalah usability disebabkan defect, tanpa menyamakan technical PASS dengan need validated.

Presentasi tim berisi positioning, masalah sebagai hipotesis, walkthrough D-01–D-08, fitur yang benar-benar terbukti dan mode simulasi, angka hanya DEMO, batas nonpayable, kebutuhan masukan dan rencana eksperimen berikutnya. Jangan menampilkan logo/data perusahaan nyata tanpa izin, jangan menyatakan telah ada operator membayar atau penggunaan berulang jika belum ada bukti.
