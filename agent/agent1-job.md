# Agent 1 Job Sheet: Frontend & Interactive Canvas Engineer

## 🎯 Role Summary
Anda adalah **Agent 1: Frontend & Interactive Canvas Engineer**.
Tugas utama Anda adalah membangun antarmuka web interaktif yang intuitif, visual workflow canvas ala Cisco/Figma menggunakan `@xyflow/react`, kuesioner pilihan ganda adaptif, dan modal preview/download `prd.md`.

---

## 📂 Scope Direktori & File Kerja
Anda memiliki hak penuh untuk membuat dan memodifikasi file di dalam:
* `src/app/page.tsx` (Landing, Chat Ingestion, Questionnaire Stepper)
* `src/app/canvas/[sessionId]/page.tsx` (Interactive Canvas View)
* `src/app/globals.css` (Tailwind & canvas animation styling)
* `src/components/chat/*` (Chat bar & prompt input)
* `src/components/questions/*` (Interactive Multiple-Choice cards)
* `src/components/canvas/*` (React Flow components: Custom nodes, toolbar, minimap, inspector)
* `src/components/prd/*` (Markdown viewer & download button)
* `src/lib/store/*` (Zustand state store untuk UI, canvas nodes, dan session)

---

## 🛠️ Key Deliverables

### 1. Chat & Ide Ingestion Bar
- Input field elegan dengan placeholder inspiratif.
- Mengirim ide awal user ke backend via `POST /api/ai/questions`.
- Loading spinner / skeleton saat AI sedang merumuskan pertanyaan pilihan ganda.

### 2. Adaptive Multiple-Choice Questionnaire
- Menampilkan kartu pertanyaan dinamis (3-5 pertanyaan).
- Dukungan single-select atau multi-select dengan checklist.
- Highlight visual untuk opsi yang bertanda `(Recommended)`.
- Navigasi "Lanjut", "Kembali", dan ringkasan jawaban.
- Saat pertanyaan selesai, otomatis trigger `POST /api/ai/workflow` untuk membangun graf alur.

### 3. Infinite Workflow Canvas (`@xyflow/react`)
- Canvas layar penuh dengan fitur:
  - **Pan:** Drag kanvas dengan mouse/trackpad.
  - **Zoom:** Mouse wheel & kontrol tombol (+ / - / fit view).
  - **Minimap:** Tampilan peta kecil di pojok kanan bawah.
  - **Background Grid:** Dot pattern ala blueprint/Cisco.
- **Custom Step Node (`CustomStepNode.tsx`):**
  - Menampilkan ID node, nama fitur, fase (Phase 1 MVP, Phase 2 Core, dll.), dan status.
  - Indikator status warna:
    - ⚪ `pending` (Border abu-abu netral)
    - 🟡 `in_progress` (Border kuning/biru dengan efek animasi glow/pulse)
    - 🟢 `done` (Border hijau dengan icon checkmark)
    - 🔴 `blocked` (Border merah)
  - Klik node membuka detail drawer/modal (deskripsi task, acceptance criteria, dan perintah CLI).

### 4. PRD Preview & Exporter Modal
- Modal dialog untuk menampilkan isi `prd.md` yang digenerate oleh AI.
- Markdown viewer dengan styling rapi (headings, checklists, code blocks).
- Tombol:
  - **Copy Markdown:** Salin langsung ke clipboard.
  - **Download `prd.md`:** Unduh file fisik langsung ke komputer user.

### 5. Live Telemetry Listener
- Hook React (`useSessionStream`) yang mendengarkan event Server-Sent Events (SSE) dari `/api/session/[sessionId]/stream` (atau polling interval ringan jika SSE belum terhubung).
- Saat agent menjalankan CLI dan mengubah status fitur menjadi `done`, node di kanvas langsung berubah warna secara realtime tanpa perlu reload halaman!
