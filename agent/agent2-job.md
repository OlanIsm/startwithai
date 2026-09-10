# Agent 2 Job Sheet: Backend, AI Engine & CLI Telemetry Engineer

## 🎯 Role Summary
Anda adalah **Agent 2: Backend, AI Engine & CLI Telemetry Engineer**.
Tugas utama Anda adalah mengintegrasikan Google Gemini API untuk menghasilkan pertanyaan adaptif, merangkai graf alur fitur dalam bentuk JSON node & edge, menyusun dokumen `prd.md` yang lengkap dan terstandarisasi, menyediakan API session/SSE untuk real-time update, dan membangun paket executable CLI `npx codewithai`.

---

## 📂 Scope Direktori & File Kerja
Anda memiliki hak penuh untuk membuat dan memodifikasi file di dalam:
* `src/app/api/ai/*` (Routes untuk generate pertanyaan, workflow graph, dan PRD)
* `src/app/api/session/*` (Routes untuk data session, SSE stream, dan status update)
* `src/lib/ai/*` (Gemini API client, structured output schemas, dan system prompts)
* `src/lib/db/*` (Session storage: In-memory store / SQLite / KV store)
* `src/lib/utils/layoutGraph.ts` (Algoritma perhitungan posisi X, Y node pada graf)
* `cli/*` (Package CLI `npx codewithai` yang dijalankan di terminal)

---

## 🛠️ Key Deliverables

### 1. AI Prompt Engineering & API Endpoints

#### A. Question Generator (`POST /api/ai/questions`)
* Menerima payload: `{ idea: string }`.
* Menghasilkan 3-5 pertanyaan pilihan ganda yang cerdas, teknis namun mudah dimengerti, untuk menyempurnakan spesifikasi proyek (Tech stack, Database, Auth, Core features, Skala).
* Format output berupa JSON terstruktur (menggunakan Gemini Structured Output / JSON mode).

#### B. Workflow Graph Synthesizer (`POST /api/ai/workflow`)
* Menerima payload: `{ idea: string, answers: Record<string, any> }`.
* Menghasilkan struktur Graph (Nodes & Edges):
  * Node memiliki `id` unik (misal: `setup-db`, `auth-flow`, `core-invoice-editor`).
  * Dependensi antar fitur (`dependencies: ["setup-db"]`).
  * Fase pengerjaan (`phase: 1, 2, 3`).
  * Target perintah CLI: `npx codewithai update <node-id> --status done`.
* Menjalankan kalkulasi koordinat otomatis (auto-layout X & Y) agar node tersusun rapi dari kiri ke kanan atau atas ke bawah.

#### C. PRD Compiler (`POST /api/ai/prd`)
* Menghasilkan dokumen markdown komprehensif (`prd.md`) yang siap dibaca oleh AI Coding Agent (Cursor, Claude Code, Antigravity, dll.).
* Wajib menyertakan:
  1. Executive Summary & Goals.
  2. Tech Stack & Recommended Architecture.
  3. Database Schema / Data Contract.
  4. Phased Step-by-Step Task Breakdown (lengkap dengan checklist markdown `[ ]` dan ID node).
  5. **Agent Telemetry Hook Protocol:** Instruksi eksplisit kepada AI agent untuk menjalankan:
     ```bash
     npx codewithai update <step-id> --session <sessionId> --status done
     ```
     setiap kali menyelesaikan satu fitur/tugas.

### 2. Session Management & Real-time Telemetry API
* **Session Store (`src/lib/db/sessionStore.ts`):**
  * Menyimpan status proyek berdasarkan `sessionId`.
* **Telemetry Update Route (`POST /api/session/update`):**
  * Menerima request dari CLI `npx codewithai`:
    ```json
    { "sessionId": "sess_123", "stepId": "feat-auth", "status": "done", "notes": "Auth selesai" }
    ```
  * Memperbarui status node di session store.
  * Memancarkan event pembaruan ke client yang sedang terhubung melalui Server-Sent Events (SSE).
* **SSE Stream Route (`GET /api/session/[id]/stream`):**
  * Menyediakan stream real-time ke browser pengguna agar kanvas ter-update instan.

### 3. Companion CLI Package (`npx codewithai`)
* Berada di folder `cli/` dengan file `package.json` dan `bin/index.js`.
* Konfigurasi `package.json` memiliki field `"bin": { "codewithai": "./bin/index.js" }`.
* Menggunakan library CLI modern (misal: `commander` atau `clack`).
* Perintah utama:
  ```bash
  # Mengirim pembaruan status ke backend web app
  npx codewithai update <step-id> --session <session-id> --status <pending|in_progress|done|blocked>
  ```
* Output terminal interaktif: menampilkan status sukses, nama fitur, dan link kembali ke web dashboard.
