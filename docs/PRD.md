# Product Requirements Document

**Product:** ESG Together (Siloam ESG Horizon)  
**Owner:** Siloam Hospitals — ESG / Procurement  
**Status:** Draft v1.1 — living spec, synced to repo 27 Aug 2026  
**Audience:** Product, engineering, ESG program owner  
**Language of product:** ID (default) + EN

> Jangan kerjakan ulang yang sudah Postgres SoT. Jangan tarik P4 (SSO / SMTP / PDF / GCS) ke demo. Copy tender / SG-PTS = aspirasional (keputusan Siloam #2). Login vendor = undangan VOB/Nerissa, bukan daftar sendiri (keputusan Siloam #1, Heldra 27 Aug 2026).

### Status implementasi vs PRD

| Area | Kontrak PRD | Status kode (lokal) |
|---|---|---|
| F1 Auth Google + allowlist | Email harus ada di roster VOB/Nerissa; login langsung ke vendor itu. Domain email bebas. Security setara domain Siloam. | Ada (`vendor_allowed_emails`). Lokal demo: `ESG_ALLOW_DEMO=true`, `ESG_ENFORCE_ALLOWLIST=false`. Production: keduanya kebalikan. Sinkron live VOB belum. |
| F1 Role | `vendor_admin` / `vendor_member`, bukan string `vendor` | Dropdown + default DB `vendor_member`. Alias `vendor` → `vendor_member`. |
| F1 Admin vs Super Admin | `admin` tidak lihat Super Admin / Excel | Grid + audit untuk `admin`. Excel/role/CMS/katalog/learn studio: `super_admin`. |
| F2 Onboarding 5 langkah | Persist + mapping familiaritas → badge awal | Persist `company_size`, `contact_email`, `esg_familiarity`, `esg_objectives`. Badge awal hanya jika `esg_score = 0`. |
| F3 Assessment 15 soal | Bank di DB, history, bukan sertifikasi | Tabel `assessment_questions` + hasil di `assessment_results`. Copy diagnostik, bukan tender. |
| F4 Learn | 5 modul, 4 lesson, progress | Katalog + progress di Postgres. Lesson di-strip di list. |
| F5–F6 Aksi + bukti | Commit, evidence disk, audit | Postgres + file disk. Bukan base64 di DB. |
| F7 CoC | Versi `2026.1`, +1 tahun | Ada. PDF generate = P4, belum. |
| F8 Corporate grid | 1 baris / vendor | Ada. |
| F10 CMS publik | Landing tanpa login | Ada. |
| Skor §7 | 0–35 / 36–60 / 61–85 / 86–100 → Starter/Bronze/Silver/Gold | Rumus assessment + badge vendor. Home path memakai badge, bukan palang 20 poin. Champion = manual. |
| URL §3 | `/app/...` deep-link | **Belum** — masih React state. P1 sisa. |
| P4 | Email kirim, PDF CoC, SSO, GCS | Outbox + CSV ada. SMTP/PDF/SSO/GCS **bukan scope demo**. |

---

## 1. Ringkasan

ESG Together adalah portal ESG rantai pasok Siloam. Vendor rumah sakit mengukur kematangan ESG, belajar, mengambil aksi praktis, mengunggah bukti, dan menandatangani kode etik. Tim Siloam melihat grid korporat, memverifikasi bukti, dan mengelola katalog + konten publik.

Ini **bukan** sertifikasi ESG formal. Skor assessment adalah diagnostik operasional untuk improvement, bukan audit.

### Masalah

Vendor Siloam (logistik, F&B, fasilitas, alat kesehatan, dll.) diminta patuh ESG tapi tidak punya jalur yang sederhana: apa yang harus dilakukan, bagaimana membuktikan, dan bagaimana Siloam meninjau.

### Tujuan

1. Vendor kecil–menengah bisa mulai ESG tanpa konsultan.
2. Siloam punya visibilitas progres vendor di satu grid.
3. Aksi ESG terhubung ke bukti yang bisa diaudit.
4. Publik melihat inisiatif Siloam (newsletter / galeri / spotlight).

### Bukan tujuan (v1)

- Sertifikasi ISO / GRI / CSRD lengkap
- Native mobile app
- Multi-hospital tenancy per cabang
- Chat AI bebas (hanya rekomendasi, verifikasi bukti, generate course, generate report)

---

## 2. Pengguna & role

Satuan kerja = **perusahaan vendor**, bukan login individu.

| Role | Siapa | Bisa apa |
|---|---|---|
| Publik | Siapa saja | Baca landing, artikel, galeri, guide, subscribe newsletter |
| `vendor` / `vendor_member` | Staff vendor | Assessment, belajar, commit aksi, unggah bukti, tanda tangan CoC |
| `vendor_admin` | Owner akun perusahaan | Semua milik vendor + kelola profil perusahaan |
| `admin` | Reviewer Siloam (regional / hospital ESG) | Corporate grid, review bukti |
| `super_admin` | Program owner + procurement master data | Role user, Excel roster, verifikasi vendor, CMS, katalog aksi, AI course studio |

**Volume rencana**

| Fase | Vendor companies | User login | Operator Siloam |
|---|---|---|---|
| Pilot | 30–50 | ~90 | 3–8 |
| Group | 150–400 | ~700 | 8–15 |
| Mature | 400–800 | ~1.600 | 15+ |

Dropdown admin: Superadmin, Admin, Vendor Admin, Vendor Member. Jangan pakai string generik `vendor` di production.

---

## 3. Permukaan produk

| Surface | URL target (belum ada di prototype) | Auth |
|---|---|---|
| Public landing | `/` | Tidak |
| Onboarding | `/onboarding` | Opsional, wajib sebelum portal |
| Vendor portal | `/app/{home,assessment,learn,actions,impact,declaration,profile}` | Wajib, terhubung ke vendor |
| Admin | `/admin/{grid,users,audit,catalog,learning,cms}` | `admin` atau `super_admin` |

Prototype sekarang memakai React state, bukan URL. Production wajib deep-link.

---

## 4. Alur utama

### 4.1 Vendor baru (diundang — satu-satunya jalur)

Daftar vendor ada di **Nerissa / VOB**. ESG tidak menerima pendaftaran mandiri.

1. Roster VOB (Excel sementara, API VOB nanti) masuk `vendors` + `vendor_allowed_emails`.
2. User login Google dengan **email yang sudah terdaftar di VOB** (domain bebas: Gmail, domain perusahaan, dll.).
3. Sistem tautkan user ke `vendor_id` tempat email itu terdaftar. Langsung masuk portal vendor itu. Tidak pilih perusahaan.
4. Email tidak di roster → ditolak (`not_invited`). Tidak buat akun tanpa vendor.
5. Jika profil perusahaan belum lengkap → onboarding 5 langkah (lengkapi data, bukan daftar vendor baru).
6. Assessment 15 soal → skor + rekomendasi aksi & modul.
7. Vendor pilih aksi → kerjakan → unggah bukti → status Submitted.
8. Admin Siloam verifikasi atau minta info tambahan.
9. Poin + metrik impact masuk grid korporat.
10. Tanda tangan Code of Conduct (berlaku 1 tahun).

Security: standar sama seperti login domain Siloam (token Firebase, tenant scope, allowlist). Bukan lebih longgar hanya karena mailbox-nya bukan `@siloamhospitals.com`.

### 4.2 Vendor walk-in — ditutup

Tidak ada self-signup. Tidak ada “Google dulu, pilih/buat perusahaan kemudian.” CTA publik “gabung mitra” = login, bukan form aplikasi.

### 4.3 Publik

Landing → baca artikel / guide / spotlight → subscribe email → login jika email sudah di VOB.

---

## 5. Fitur

### F1 — Autentikasi & akses

- Login SSO via Firebase: **Google** dan **Microsoft**. Tidak ada password, tidak ada sign-up vendor. IdP Siloam/SAML = P4.
- Sumber undangan: roster VOB (Nerissa). SoT sementara: `vendor_allowed_emails`.
- Sumber undangan: roster VOB (Nerissa). SoT sementara: `vendor_allowed_emails`.
- Domain email bebas; yang diizinkan hanya alamat yang ada di roster.
- Setelah login, user masuk ke vendor tempat email itu terdaftar.
- Email Siloam (`@siloamhospitals.com`) tidak otomatis super admin kecuali di-assign.
- Production: `ESG_ALLOW_DEMO=false`, `ESG_ENFORCE_ALLOWLIST=true`. Tidak auto-promote dari substring email.
- Session: Firebase ID token ke API. Bar keamanan setara domain Siloam.

**Acceptance:** email tidak di VOB/allowlist tidak bisa masuk portal. Login sukses land di vendor yang benar. `admin` tidak melihat tab Super Admin.

### F2 — Onboarding vendor

5 langkah: identitas perusahaan, kontak, familiaritas ESG, tujuan ESG, konfirmasi.

Setelah simpan: `hasCompletedOnboarding = true`, mapping familiaritas → level awal (lihat §7).

### F3 — Assessment diagnostik

15 pertanyaan (5 E, 5 S, 5 G). Jawaban: `yes` / `partially` / `not_yet` / `na`.

Hasil: persentase, level kematangan, breakdown pilar, rekomendasi aksi & modul, riwayat pengerjaan ulang.

Bukan sertifikasi. Copy wajib menyatakan itu.

### F4 — Learn

Katalog modul mikro (PLANS: Pioneer / Locate / Action / Navigate / Scale). Tiap modul 4 lesson + kuis per lesson.

Progress per user: completed, quizScore. Bisa di-link ke aksi katalog.

Super admin: AI Course Creator Studio (generate modul dari topik + industri + pilar).

### F5 — Actions

Katalog aksi ESG (E/S/G), commit, lacak status, ajukan aksi baru (proposal).

Admin: approve/reject proposal → masuk katalog. Super admin: CRUD katalog + Excel import aksi.

### F6 — Impact & evidence

Unggah foto dan/atau dokumen sesuai `requiredEvidenceType`. AI verifikasi (opsional) memberi `confidenceScore` + feedback. Admin audit queue: Verified / Needs Info.

Metrik impact dihitung dari `quantityReported × impactMultiplier` ke bucket ekosistem.

Generate laporan ESG (ringkasan AI + angka).

### F7 — Code of Conduct

Tanda tangan digital: nama, jabatan, alamat. Versi dokumen, berlaku 1 tahun, status active / expired / pending_renewal.

### F8 — Admin corporate grid

Satu baris per vendor: industri, jumlah karyawan, verification status, skor assessment, jumlah aksi, status aksi. Filter & drill-down.

### F9 — Super admin master data

- Excel bulk upload vendor + email.
- Assign role + tautkan vendor.
- Set `verificationStatus`: Pending / Verified / Needs Review.

### F10 — Public CMS

Hero carousel, artikel newsletter, galeri sustainability, learning guide publik, vendor spotlight, subscriber list.

---

## 6. Data yang dibutuhkan

Semua field di bawah adalah kontrak produk. Nama mengikuti kode saat ini. Yang bertanda **baru** belum ada di Postgres prototype.

### 6.1 Identitas & akses

#### `users`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| id | serial | ya | PK |
| uid | text unique | ya | Firebase UID |
| email | text | ya | lowercase |
| name | text | tidak | dari Google atau input |
| role | enum | ya | `super_admin` \| `admin` \| `vendor_admin` \| `vendor_member` |
| vendor_id | fk vendors | tidak | null untuk operator Siloam |
| created_at | timestamptz | ya | |

Default role login vendor: `vendor_member`. Owner perusahaan: `vendor_admin`. Jangan pakai string generik `vendor` di production.

#### `vendors`

| Field | Tipe | Wajib | Sumber |
|---|---|---|---|
| id | serial | ya | |
| company_name | text unique | ya | Onboarding / Excel |
| industry | enum | ya | lihat lookup |
| company_size | enum | ya | Micro / Small / Medium / Large |
| employee_count | text | ya | bebas, contoh `25-50` |
| location | text | ya | kota / wilayah |
| contact_person | text | ya | |
| contact_email | text | ya | |
| phone | text | tidak | |
| address | text | tidak | |
| logo_url | text | tidak | object storage |
| verification_status | enum | ya | `Pending` \| `Verified` \| `Needs Review` |
| esg_maturity_level | enum | ya | lihat §7 |
| esg_score | int 0–100 | ya | dari assessment terakhir |
| sustainability_goal | text | tidak | |
| esg_familiarity | enum | tidak | onboarding |
| esg_objectives | text[] | tidak | onboarding |
| has_completed_onboarding | bool | ya | default false |
| onboarding_completed_at | timestamptz | tidak | |
| joined_date | date | ya | |
| created_at / updated_at | timestamptz | ya | |

#### `vendor_allowed_emails`

| Field | Tipe | Wajib |
|---|---|---|
| id | serial | ya |
| vendor_id | fk | ya |
| email | text | ya, unique globally |
| created_at | timestamptz | ya |

Satu email hanya boleh terikat ke satu vendor.

#### Excel roster (input super admin)

Kolom file `.xlsx` / `.csv`:

| Kolom | Wajib | Contoh |
|---|---|---|
| companyName | ya | Apex Precision Logistics |
| industry | ya | Freight, Logistics & Warehousing |
| employeeCount | ya | 25-50 |
| contactPerson | tidak | Budi Santoso |
| phone | tidak | 0812… |
| address | tidak | Jakarta |
| allowedEmails | ya |  |

`allowedEmails` dipisah koma. Baris tanpa `companyName` di-skip. Nama perusahaan unique → update jika sudah ada.

---

### 6.2 Onboarding — lookup

**Industry**

- Agriculture & Farming
- Manufacturing & Industrial
- Retail & Consumer Goods
- Professional & Business Services
- Technology & IT
- Freight, Logistics & Warehousing
- Food & Hospitality
- Construction & Real Estate
- Other

*(Rekomendasi pilot Siloam: tambah Healthcare Supplies, Facilities & Cleaning, Medical Waste, Laundry, F&B Catering sebagai nilai eksplisit, jangan semua masuk Other.)*

**Company size**

- Micro (1-9 employees)
- Small (10-49 employees)
- Medium (50-249 employees)
- Large (250+ employees)

**ESG familiarity** (`esg_familiarity`)

| id | Arti | Level awal |
|---|---|---|
| getting_started | Baru mulai | Starter |
| several_activities | Sudah beberapa aksi | Bronze |
| structured_programs | Sudah ada program | Silver |
| publish_reports | Sudah publish laporan | Gold |

**ESG objectives** (multi-select)

| id | Label |
|---|---|
| env_impact | Reduce environmental impact |
| employee_wellbeing | Improve employee wellbeing |
| community_support | Support local communities |
| governance | Improve company governance |
| customer_reqs | Meet customer requirements |
| capability_building | Build ESG capability |
| esg_report | Create an ESG report |

---

### 6.3 Assessment

#### Bank soal (`assessment_questions`)

15 soal seed (lihat lampiran A). Sudah di Postgres, bukan hardcoded-only. Field per soal:

| Field | Tipe |
|---|---|
| id | text (`q1`…`q15`) |
| pillar | E \| S \| G |
| question_number | 1–15 |
| question_text / question_text_id | text EN / ID |
| why_we_ask / why_we_ask_id | text |
| category / category_id | text |
| linked_action_ids | text[] |
| linked_module_ids | text[] |

**Opsi jawaban**

| Nilai | Poin | Arti |
|---|---|---|
| yes | 10 | Sudah dilakukan |
| partially | 5 | Sebagian |
| not_yet | 0 | Belum |
| na | excluded | Tidak relevan, tidak masuk penyebut |

#### `assessment_results`

| Field | Tipe |
|---|---|
| id | serial |
| vendor_id | fk |
| user_id | fk, siapa yang mengisi |
| overall_percentage | real |
| maturity_level | Starter \| Contributor \| Practitioner \| Leader |
| total_earned_points | int |
| total_max_points | int |
| pillar_results | jsonb |
| answers | jsonb `{ q1: "yes", ... }` |
| recommended_actions | jsonb |
| recommended_modules | jsonb |
| assessment_count | int |
| completed_at | timestamptz |

Simpan **setiap** pengerjaan (history), jangan overwrite. Grid pakai hasil terbaru.

---

### 6.4 Katalog aksi & komitmen

#### `action_catalog`

Sudah di Postgres (bukan IndexedDB sebagai SoT). Field:

| Field | Tipe | Keterangan |
|---|---|---|
| id | text | `act_led_retrofit` |
| title / title_id | text | EN / ID |
| description / description_id | text | |
| pillar | E \| S \| G | |
| category / category_id | text | |
| difficulty | Starter \| Moderate \| Advanced | |
| estimated_days | int | |
| impact_metric_unit / _id | text | contoh `kWh Energy Saved / yr` |
| impact_metric_label / _id | text | |
| default_metric_name | enum | lihat impact totals |
| impact_multiplier | real | 1 unit laporan × multiplier |
| icon_name | text | Lucide icon |
| image_url | text | |
| practical_tips / _id | text[] | |
| required_evidence_type | photo \| document \| both | |
| points | int | poin ke vendor saat verified |
| is_active | bool | |
| source | system \| partner_proposal \| excel_import | |
| linked_module_ids | text[] | |
| related_assessment_question_ids | text[] | |
| created_at / updated_at | timestamptz | |

**Seed katalog (12 aksi)**

| ID | Pilar | Judul |
|---|---|---|
| act_led_retrofit | E | LED Lighting & Smart Switch Retrofit |
| act_digital_invoicing | E | 100% Digital Invoicing & Paperless Workflow |
| act_plastic_elimination | E | Eliminate Single-Use Plastic Wrapping & Packaging |
| act_waste_recycling | E | Supply Chain Waste Stream Sorting & Circular Recycling |
| act_tree_planting | E | Ecosystem Coastal Mangrove & Tree Planting Initiative |
| act_water_aerators | E | Low-Flow Tap Aerators & Rainwater Harvesting System |
| act_solar_pv_rooftop | E | Solar PV Rooftop Installation & Clean Energy Adoption |
| act_fair_living_wage | S | Living Wage & Equal Pay Policy Audit |
| act_safety_training | S | Comprehensive Workplace Safety & First Aid Training |
| act_community_mentorship | S | Local Vocational Youth Mentorship & Healthcare Internship |
| act_code_of_conduct | G | Code of Ethics & Anti-Corruption Governance Policy |
| act_data_privacy | G | Medical Data Protection & Cybersecurity Hardening |

Ada 1 contoh proposal seed: EV Cold-Chain Delivery Transition.

#### `proposed_actions`

Sudah di Postgres.

| Field | Tipe |
|---|---|
| id | text |
| vendor_id / vendor_name | |
| title, description, pillar, category, difficulty | |
| estimated_days, impact_metric_unit, impact_multiplier | |
| suggested_points | int |
| rationale | text |
| proposed_by_email / name | |
| suggested_evidence_type | photo \| document \| both |
| status | Pending \| Approved \| Rejected \| Needs Revision |
| admin_feedback | text |
| submitted_at / reviewed_at / reviewed_by | |
| approved_action_id | fk catalog setelah approve |

#### `vendor_actions` (commitments)

| Field | Tipe |
|---|---|
| id | serial |
| vendor_id | fk |
| action_id | text fk catalog |
| title | text denormalized |
| pillar | E \| S \| G |
| status | Not Started \| In Progress \| Submitted \| Verified \| Needs Info |
| quantity_reported | real |
| notes | text |
| committed_date | date |
| completed_date | date |
| submitted_at / verified_at | timestamptz |
| verified_by | user id |
| verification_feedback | text |
| ai_verification_score | real 0–100 |
| points | int | diisi saat Verified |

#### `evidence_files` (file di disk / object storage, jangan base64 di DB)

Sudah: metadata + file di `ESG_UPLOAD_DIR`. GCS signed URL = P4.

| Field | Tipe |
|---|---|
| id | uuid |
| commitment_id | fk vendor_actions |
| file_name | text |
| storage_key | text | path di GCS/S3 |
| file_url | text | signed URL, jangan persist jangka panjang |
| file_type | image \| document |
| mime_type | text |
| size_bytes | int |
| uploaded_at | timestamptz |
| uploaded_by | fk users |
| ai_notes | text |

Batas usulan: gambar ≤ 10 MB (jpg/png/webp), dokumen ≤ 20 MB (pdf). Scan virus di upload path.

---

### 6.5 Learn

#### `learning_modules`

Sudah di Postgres.

| Field | Tipe |
|---|---|
| id | text | `mod_esg_101` |
| title / title_id | |
| description / description_id | |
| pillar | E \| S \| G |
| duration_minutes | int |
| points | int |
| background_problem / esg_benefit | text |
| badge_icon | text |
| cover_image_url | text |
| industry_sector | text |
| difficulty | Starter \| Moderate \| Advanced |
| linked_action_ids | text[] |
| related_assessment_question_ids | text[] |
| author | text |
| status | published \| draft |
| tags | text[] |
| lessons | jsonb atau tabel anak |

**Lesson**

| Field | Tipe |
|---|---|
| id | text |
| title | text |
| text_content | text |
| example | text |
| media_url / media_type | image \| video |
| quiz.question | text |
| quiz.options | text[4] |
| quiz.correct_answer_index | 0–3 |
| quiz.explanation | text |

**Seed modul (5)**

| ID | Judul |
|---|---|
| mod_esg_101 | ESG 101: Practical ESG for Vendor Success |
| mod_green_logistics | Green Logistics: Fuel Efficiency & Route Optimization |
| mod_catering_waste | Food Waste & Eco-Packaging for Catering Partners |
| mod_facility_safety | Occupational Health & Safety (K3) for Facility & Cleaning |
| mod_data_governance | Data Privacy & Anti-Corruption in Healthcare Supply Chain |

Tiap modul 4 lesson (kerangka PLANS).

#### `learning_progress`

| Field | Tipe |
|---|---|
| vendor_id | fk |
| user_id | fk |
| module_id | text |
| completed | bool |
| quiz_score | int 0–100 |
| completed_at | timestamptz |

Unique `(user_id, module_id)`.

---

### 6.6 Impact

#### `impact_records`

| Field | Tipe |
|---|---|
| vendor_id | fk |
| metric_key | enum di bawah |
| value | real |
| unit | text |
| period | text | contoh `2026-Q3` atau `lifetime` |
| source_commitment_id | fk | **baru** |
| created_at | timestamptz |

**`metric_key` / EcosystemImpactTotals**

| Key | Unit |
|---|---|
| treesPlanted | trees |
| peopleBenefited | people |
| employeesTrained | people |
| wasteRecycledKg | kg |
| plasticReducedKg | kg |
| paperReducedKg | kg |
| energySavedKwh | kWh |
| renewableGeneratedKwh | kWh |
| waterSavedLiters | L |
| communityBeneficiaries | people |

Aggregate publik = SUM verified records. Jangan hardcode 148 vendors.

---

### 6.7 Code of Conduct

#### `declarations` (`coc_declarations`)

Sudah di Postgres. `document_pdf_url` / generate PDF = **P4, belum**.

| Field | Tipe |
|---|---|
| id | text/uuid |
| vendor_id | fk |
| vendor_name | snapshot |
| signer_name | text |
| signer_title | text |
| signer_address | text |
| declared_date | timestamptz |
| valid_until | timestamptz | +1 tahun |
| status | active \| expired \| pending_renewal |
| signature_confirmed | bool |
| version | text | seed `2026.1` |
| document_pdf_url | text | **baru**, generate PDF |

Konten pasal CoC adalah master content berversi (CMS atau file markdown ber-tag versi). Ganti versi → vendor lama `pending_renewal`.

---

### 6.8 Konten publik (CMS)

Semua butuh `is_published`, audit `updated_by`, `updated_at`.

#### `hero_slides`

id, title, subtitle, badge_text, category (`Siloam Initiative` \| `Green Hospital` \| `Vendor Milestone` \| `Community Impact` \| `Circular Economy`), image_url, overlay_gradient (`emerald` \| `sapphire` \| `forest` \| `dark` \| `sunset`), impact_badge {value, label}, cta_primary_text / action (`article` \| `onboarding` \| `vendor` \| `custom`), target_article_id, cta_secondary_*, order, is_published.

#### `newsletter_articles`

id, title, subtitle, content (markdown), category (`Environmental` \| `Social` \| `Governance` \| `Siloam Initiative` \| `Vendor Spotlight`), author, author_role, published_date, edition, read_time_minutes, cover_image_url, featured, is_published, tags[], vendor_name, impact_highlight {metricValue, metricLabel}, likes_count.

#### `sustainability_gallery`

id, title, hospital_unit, category (`Energi Bersih` \| `Manajemen Limbah` \| `Konservasi Air` \| `K3 & Sosial` \| `Fasilitas Hijau`), image_url, caption, year, metric_tag, is_published.

#### `public_learning_guides`

id, title, pillar (E \| S \| G \| General), category, summary, content, key_takeaways[], read_time_minutes, icon_name, target_audience.

#### `public_vendor_spotlights`

id, vendor_name, industry, location, maturity_level, badge_title, achievement_summary, metric_achieved, metric_label, quote, quote_person, facility_image_url, logo_url, is_published.

#### `newsletter_subscribers`

id, email unique, name, organization, subscribed_at. **Baru:** consent_at, unsubscribed_at.

Seed awal prototype: 4 hero, 5 artikel, 6 galeri, 4 guide, 3 spotlight.

---

### 6.9 AI & audit

#### `ai_logs`

id, timestamp, user_id, vendor_id, model, action_type (`recommendation` \| `evidence_verification` \| `report_generation` \| `course_generation` \| `chat`), tokens_used, estimated_cost, request_meta jsonb (tanpa PII file mentah).

#### `audit_log`

Sudah ditulis untuk aksi admin utama. Lengkapi event bila ada aksi baru.

id, actor_user_id, action (`role_change` \| `vendor_verify` \| `excel_import` \| `evidence_verify` \| `proposal_review` \| `cms_publish`), entity_type, entity_id, before jsonb, after jsonb, created_at.

Input AI:

- Recommend actions: `{ vendorProfile, currentLevel }` → 3 rekomendasi {title, reason, priority High/Medium/Low}
- Verify evidence: `{ actionTitle, notes, photoBase64 or storage_key }` → {status, confidenceScore, feedback, estimatedValue?}
- Generate report: `{ vendorName, level, impacts, completedActionsCount }` → {summary, keyHighlights[], nextStepRecommendation}
- Generate course: `{ topic, industry, pillar, linkedActionTitle? }` → LearningModule JSON
- Match or create actions: `{ topic, pillar, industry, courseTitle, existingActions[] }`

Semua route AI wajib auth + rate limit.

---

## 7. Aturan skor & level

Dua skala yang harus distandarkan (sekarang campur di kode):

### Assessment (diagnostik)

| Persentase | Maturity |
|---|---|
| 0–35 | Starter |
| 36–60 | Contributor |
| 61–85 | Practitioner |
| 86–100 | Leader |

`NA` tidak masuk penyebut. Pilar E/S/G dihitung terpisah dengan rumus yang sama.

### Badge vendor (profil / spotlight)

Mapping dari assessment:

| Maturity | ESGLevel badge |
|---|---|
| Starter | Starter |
| Contributor | Bronze |
| Practitioner | Silver |
| Leader | Gold |
| (manual / program khusus) | Champion |

Jangan pakai label ketiga (`Progressing` / `Advanced`) di API.

Poin aksi hanya bertambah saat status **Verified**.

---

## 8. Integrasi & infrastruktur data

| Sistem | Fungsi | Data yang mengalir |
|---|---|---|
| Firebase Auth | Identitas | uid, email, name, idToken |
| PostgreSQL | Source of truth semua domain | lihat §6 |
| Object storage (GCS/S3) | Evidence, logo, cover, galeri | file biner + metadata |
| Gemini | AI features | prompt JSON, bukan file mentah jangka panjang |
| Email (belum ada) | Invite allowlist, “needs info”, CoC expiry | email, vendor_id, template_id |
| Excel | Import vendor & (nanti) aksi | file di-parse di client, JSON ke API |

Tidak ada integrasi SG-PTS / ERP Siloam di v1. Copy yang menyebut “poin tender Siloam” harus ditandai aspirasional sampai ada kontrak data dengan procurement.

---

## 9. Non-fungsional

- Bahasa default ID, toggle EN. Semua konten user-facing punya pasangan `*Id` atau row terjemahan.
- Multi-tenant ketat: setiap query vendor-scoped kecuali admin.
- Evidence tidak boleh base64 di IndexedDB / JSONB.
- Backup Postgres harian. Retention evidence: 5 tahun (usulan legal, konfirmasi Siloam).
- Availability target pilot: 99% jam kerja WIB.
- Audit trail untuk semua aksi admin.
- Tidak ada PII pasien. Data privacy action = data operasional vendor, bukan rekam medis.

---

## 10. Sukses (pilot)

| Metrik | Target 90 hari |
|---|---|
| Vendor onboarded (profil lengkap) | ≥ 30 |
| Assessment selesai ≥ 1× | ≥ 80% vendor aktif |
| Minimal 1 aksi Submitted | ≥ 50% |
| Evidence Verified | ≥ 20 komitmen |
| CoC ditandatangani | ≥ 70% vendor verified |
| Operator Siloam memakai grid mingguan | ≥ 4 orang |

---

## 11. Rilis

| Fase | Isi | Kapan |
|---|---|---|
| Demo | Prototype sekarang | siap |
| P1 Foundation | Auth ketat, Postgres SoT, storage, URL | 4 minggu |
| P2 Closed loop | Assessment→aksi→bukti→audit server-side | 8–10 minggu |
| P3 Pilot ready | CMS, CoC versi, i18n, AI auth, UAT 10 vendor | 12–14 minggu |
| P4 Scale | Email, report PDF/CSV, SSO Siloam, 150+ vendor | setelah pilot |

---

## 12. Keputusan yang harus diambil Siloam

1. **Diputuskan (Heldra, 27 Aug 2026):** undangan-only. Daftar vendor di Nerissa/VOB. Login pakai email terdaftar; langsung masuk ke vendor itu. Domain email bebas. Security setara domain Siloam. Bukan self-signup.
2. Apakah skor assessment boleh terlihat di tender / vendor scorecard, atau internal ESG saja?
3. Daftar industri resmi procurement (jangan 9 opsi generik).
4. Siapa yang berwenang `Verified` evidence — ESG pusat, hospital, atau procurement?
5. Retensi file bukti dan apakah perlu e-meterai CoC.
6. Champion: manual award atau formula otomatis.

---

## Lampiran A — Bank soal assessment (seed)

Jawaban: Yes / Partially / Not yet / N/A.

**Environmental (q1–q5)**

1. Apakah perusahaan mencatat dan memantau penggunaan listrik secara berkala? (Energy Management)
2. Apakah sudah ada praktik efisiensi energi (LED / SOP hemat listrik)? (Energy Efficiency)
3. Apakah sampah dipilah organik / anorganik / daur ulang? (Waste & Recycling)
4. Apakah ada inisiatif kurangi plastik sekali pakai? (Plastic Reduction)
5. Apakah konsumsi air dipantau / ada konservasi air? (Water Conservation)

**Social (q6–q10)**

6. Apakah ada pelatihan K3 untuk karyawan? (Workplace Safety)
7. Apakah karyawan mendapat jaminan kesehatan / dukungan kesejahteraan (BPJS/asuransi)? (Employee Wellbeing)
8. Apakah aktif di program sosial / CSR lokal? (Community Engagement)
9. Apakah ada pelatihan keterampilan atau pengembangan karier staf? (Human Capital)
10. Apakah jam kerja, upah lembur, dan kompensasi adil diatur tertulis? (Labor Standards)

**Governance (q11–q15)**

11. Apakah ada Kode Etik dan SOP integritas bisnis tertulis? (Ethics & Compliance)
12. Apakah karyawan paham anti-penyuapan / bebas gratifikasi / pakta integritas? (Anti-Corruption)
13. Apakah ada saluran whistleblowing rahasia? (Whistleblowing)
14. Apakah ada praktik perlindungan data (UU PDP) dan keamanan informasi? (Data Protection)
15. Apakah standar etika/ESG disosialisasikan ke sub-vendor? (Supply Chain Integrity)

Copy ID/EN lengkap: `backend/internal/seed/questions.json` (tabel `assessment_questions`).

---

## Lampiran B — Data yang Siloam harus sediakan sebelum UAT

Tanpa ini, app jalan tapi kosong / pakai seed demo (Apex Precision Logistics).

1. Daftar 30–50 vendor pilot: nama perusahaan, industri, kontak, email yang diizinkan (Excel sesuai §6.1).
2. Siapa super_admin dan admin (nama + email Google Workspace / Gmail).
3. Logo Siloam, palet, dan disclaimer legal assessment.
4. Naskah Code of Conduct versi `2026.1` (ID + EN) yang boleh ditandatangani.
5. Foto/konten landing: 4 slide hero, 3–5 artikel, 6 foto galeri rumah sakit (izin pakai).
6. Konfirmasi 12 aksi seed: mana yang live, mana yang di-nonaktifkan untuk industri tertentu.
7. Gemini API key + budget bulanan, atau matikan AI di pilot.
8. Domain production + who can access Firebase project `ai-procurement-473702` (atau project baru).
9. Bucket storage + kebijakan retensi.
10. 10 vendor UAT yang bersedia isi assessment dan unggah 1 bukti palsu/nyata.
