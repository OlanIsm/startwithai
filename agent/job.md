# Master Job Specification: Multi-Agent Division of Labor

Dokumen ini membagi tugas pengembangan **CodeWithAI** menjadi 2 Agent utama agar pengerjaan dapat berjalan paralel tanpa tumpang tindih (*zero-conflict boundaries*).

---

## 🤖 Overview Tim Agent

| Agent | Peran / Spesialisasi | Fokus Utama |
|---|---|---|
| **Agent 1** | **Frontend & Interactive Canvas Engineer** | Chatbot UI, Dynamic Multiple-Choice Questionnaire, Infinite Canvas Workflow (`@xyflow/react`), PRD Viewer Modal, dan UI Telemetry Listener. |
| **Agent 2** | **Backend, AI Engine & CLI Telemetry Engineer** | Gemini API prompt engineering (Questions, Workflow JSON, PRD Generator), Session Store, Real-time SSE / Update API, dan paket CLI `npx codewithai`. |

---

## 📋 Detail Tugas Agent 1: Frontend & Interactive Canvas

### 1. Tanggung Jawab Utama
* Membangun antarmuka web modern, clean, dan responsif menggunakan Next.js App Router & Tailwind CSS.
* Mengimplementasikan kanvas interaktif berbasis `@xyflow/react` (React Flow) yang mendukung:
  * Pan (geser kanvas) & Zoom in / Zoom out (mouse wheel, pinch, control buttons).
  * Mini-map & Fit-view button.
  * Custom Node Component yang menampilkan icon, judul fitur, deskripsi singkat, tag fase/milestone, dan status (*Pending*, *In Progress*, *Done*, *Blocked*).
  * Smooth animations pada edge/koneksi antar node saat status berubah.
* Membangun Dynamic Multiple-Choice Questionnaire UI:
  * Tampilan kartu pertanyaan interaktif yang mudah dipilih user (single-select / multi-select).
  * Label `(Recommended)` untuk mempermudah user awam.
* Membangun Modal / Drawer PRD Preview:
  * Markdown previewer dengan syntax highlighting.
  * Tombol Download `prd.md` dan Copy to Clipboard.
* State Management (Zustand):
  * Menyimpan status session, daftar pertanyaan & jawaban, graph nodes & edges.
  * Mengintegrasikan hook real-time (SSE/polling) untuk memperbarui warna/status node saat ada update dari API.

### 2. File & Direktori Kerja Agent 1
```
src/
├── app/
│   ├── page.tsx                       # Halaman utama (Hero, Chat Input, Questionnaire)
│   ├── canvas/[sessionId]/page.tsx    # Halaman Canvas View (Full screen canvas)
│   └── globals.css                    # Styling Tailwind & React Flow canvas
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx              # Input ide aplikasi awal
│   │   └── ChatMessage.tsx            # Bubble chat AI & User
│   ├── questions/
│   │   ├── QuestionCard.tsx           # Kartu pilihan ganda dinamis
│   │   └── QuestionStepper.tsx        # Indikator progres pertanyaan (1/4, 2/4, dst.)
│   ├── canvas/
│   │   ├── WorkflowCanvas.tsx         # Main React Flow Canvas wrapper
│   │   ├── CustomStepNode.tsx         # Custom Node dengan badge status & info
│   │   ├── CanvasToolbar.tsx          # Zoom in, Zoom out, Fit view, Filter status
│   │   └── NodeDetailModal.tsx        # Detail saat node diklik (acceptance criteria, CLI command)
│   └── prd/
│       ├── PrdPreviewModal.tsx        # Modal preview markdown
│       └── DownloadButton.tsx         # Download prd.md generator
└── lib/
    └── store/
        └── useAppStore.ts             # Zustand state (UI, answers, nodes, edges)
```

---

## 📋 Detail Tugas Agent 2: Backend, AI Engine & CLI Telemetry

### 1. Tanggung Jawab Utama
* Mengintegrasikan Google Gemini API (menggunakan Gemini 2.5/3.0 Flash) untuk 3 pipeline utama:
  1. **Dynamic Question Generator (`/api/ai/questions`):**
     Menganalisis ide awal user dan menghasilkan 3–5 pertanyaan pilihan ganda spesifik berserta opsi jawaban dan rekomendasi dalam format JSON terstruktur.
  2. **Workflow Graph Synthesizer (`/api/ai/workflow`):**
     Mengubah ide awal + jawaban kuesioner user menjadi graph dependensi fitur (list nodes & edges dengan phase, id unik, dependensi, dan perintah CLI).
  3. **PRD Markdown Compiler (`/api/ai/prd`):**
     Menghasilkan dokumen `prd.md` komprehensif berstandar industri yang memuat arsitektur, schema, task breakdown bertahap, dan instruksi agar coding agent memanggil `npx codewithai update`.
* Membangun Session Management & Sync API:
  * In-memory / lightweight key-value store untuk menyimpan state session berdasarkan ID unik (`sessionId`).
  * Endpoint `POST /api/session/update`: Endpoint yang menerima pemicu update status dari CLI.
  * Endpoint `GET /api/session/[id]/stream`: Server-Sent Events (SSE) yang memancarkan event ke frontend saat ada node yang statusnya berubah.
* Membangun Paket Companion CLI (`cli/`):
  * Script Node.js executable yang dapat dijalankan langsung via `npx codewithai <command>`.
  * Fitur:
    ```bash
    npx codewithai update <step-id> --session <session-id> --status done
    ```
  * Menampilkan respon terminal yang rapi dan elegan (spinner, success checkmark).

### 2. File & Direktori Kerja Agent 2
```
src/
├── app/
│   └── api/
│       ├── ai/
│       │   ├── questions/route.ts     # POST: Generate 3-5 dynamic questions (JSON)
│       │   ├── workflow/route.ts      # POST: Generate workflow nodes & edges (JSON)
│       │   └── prd/route.ts           # POST: Generate formatted prd.md (Markdown)
│       └── session/
│           ├── [id]/route.ts          # GET: Fetch full session state
│           ├── [id]/stream/route.ts   # GET: SSE real-time stream endpoint
│           └── update/route.ts        # POST: Receive telemetry status update from CLI
├── lib/
│   ├── ai/
│   │   ├── gemini.ts                  # Gemini client configuration
│   │   └── prompts.ts                 # System prompts (Questions, Graph, PRD)
│   ├── db/
│   │   └── sessionStore.ts            # Session storage (In-memory / SQLite / KV)
│   └── utils/
│       └── layoutGraph.ts             # Auto-layout calculation (Dagre / Elk coordinates)
└── cli/
    ├── package.json                   # "bin": { "codewithai": "./bin/index.js" }
    └── bin/
        └── index.js                   # CLI logic (Commander/Clack + HTTP request to web API)
```

---

## 🤝 Protokol Komunikasi & Kontrak Antar Agent

### Kontrak Data 1: API `/api/ai/questions`
**Request:**
```json
{ "idea": "Bikin SaaS invoice generator untuk freelancer dengan pembayaran Midtrans" }
```
**Response:**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Metode penyimpanan dan database apa yang ingin digunakan?",
      "options": [
        { "id": "opt-supabase", "label": "Supabase (PostgreSQL + Auth)", "recommended": true },
        { "id": "opt-firebase", "label": "Firebase Firestore", "recommended": false },
        { "id": "opt-sqlite", "label": "Local SQLite / Turso", "recommended": false }
      ]
    }
  ]
}
```

### Kontrak Data 2: API `/api/session/update` (Dipanggil oleh CLI)
**Request:**
```json
{
  "sessionId": "sess_abc123",
  "stepId": "feat-auth",
  "status": "done",
  "notes": "Supabase auth configuration completed"
}
```
**Response:**
```json
{
  "success": true,
  "updatedNode": { "id": "feat-auth", "status": "done" }
}
```

---

## 🚀 Alur Kerja Eksekusi (Checklist)

1. **Inisialisasi Shared Contracts:** Pastikan interface TypeScript di `src/types/index.ts` sudah disepakati kedua agent.
2. **Agent 1:** Memulai setup UI layout, canvas visualizer dengan mock data, dan form pertanyaan.
3. **Agent 2:** Memulai implementasi Gemini prompt engine dan API route `/api/ai/*`.
4. **Integrasi:** Hubungkan Agent 1 frontend ke endpoint Agent 2 backend.
5. **CLI Test:** Jalankan `npx codewithai update` dari terminal lokal dan saksikan node di kanvas web berubah statusnya secara otomatis!
