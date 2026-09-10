# Product Context: CodeWithAI

> **Tagline:** Web-based PRD Generator, Interactive Workflow Canvas, and Real-time AI Agent Progress Companion.

---

## 1. Vision & Architecture Overview

**CodeWithAI** dirancang sebagai aplikasi **Fullstack Web-Based** (Next.js) yang simpel, cepat, dan terintegrasi langsung:
1. **User Side (Web UI):**
   - User mengetik ide aplikasi.
   - Chatbot memberikan pertanyaan pilihan ganda adaptif untuk memperjelas spesifikasi teknis dan fitur.
   - Sistem merender visualisasi alur (workflow graph) interaktif ala Cisco Packet Tracer / Figma canvas (zoom in/out, pan, status node).
   - User me-review dan mendownload `prd.md` yang siap pakai untuk AI Coding Agent (Cursor, Claude Code, Antigravity, Roo Code, dll.).
2. **Agent Execution & Telemetry Side:**
   - Di dalam `prd.md`, terdapat instruksi otomatis bagi AI coding agent untuk menjalankan perintah terminal seperti:
     ```bash
     npx codewithai update --session <ID> --step <STEP_ID> --status done
     ```
   - Web app menyediakan endpoint API ringan (`/api/session/[id]/status`) dan Server-Sent Events (SSE) sehingga dashboard web user otomatis ter-update secara real-time (*Pending $\rightarrow$ In Progress $\rightarrow$ Done*).

---

## 2. Core User Flow

```
[1. Chat Input: Ide Aplikasi]
           │
           ▼
[2. Adaptive Questionnaire: Pilihan Ganda (3-5 pertanyaan dinamis)]
           │
           ▼
[3. Infinite Canvas Workflow: Visualisasi Node Dependensi (Zoom/Pan)]
           │
           ▼
[4. Download PRD: prd.md + Embedded CLI Hook Instruction]
           │
           ▼
[5. Coding Agent Bekerja: Terminal memanggil `npx codewithai update`]
           │
           ▼
[6. Real-time Live Update di Web Canvas: Node berubah status hijau/done]
```

---

## 3. Tech Stack (Full Web-Based Architecture)

* **Framework:** Next.js (App Router, TypeScript)
* **Styling & UI:** Tailwind CSS, Lucide Icons, Shadcn UI
* **Workflow Canvas Engine:** `@xyflow/react` (React Flow) dengan Dagre/Elkjs layouting
* **State Management:** Zustand (Client graph & questionnaire state)
* **AI / LLM Layer:** Google Gemini API (Gemini Flash untuk kecepatan generasi form & PRD)
* **Real-time Sync:** Next.js Route Handlers (`/api/session/*`) + Server-Sent Events (SSE) / Polling ringan
* **Data Storage:** SQLite / Vercel KV / Supabase / In-Memory Session Cache (ringan & cepat)
* **CLI Package:** `cli/` (dapat dijalankan via `npx codewithai`)

---

## 4. Data Contracts & Schemas

### 4.1. Session State
```typescript
export interface SessionData {
  id: string; // nanoid / uuid
  appName: string;
  rawPrompt: string;
  answers: Record<string, string | string[]>;
  graph: WorkflowGraph;
  prdMarkdown: string;
  createdAt: number;
}
```

### 4.2. Workflow Node & Graph
```typescript
export type NodeStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

export interface WorkflowNodeData {
  id: string;              // e.g. "feat-auth"
  label: string;           // e.g. "Autentikasi & Role User"
  description: string;
  status: NodeStatus;
  phase: number;           // 1 = MVP, 2 = Core, 3 = Polish
  dependencies: string[];  // e.g. ["setup-db"]
  cliCommand: string;      // e.g. "npx codewithai update feat-auth --status done"
}

export interface WorkflowGraph {
  nodes: {
    id: string;
    position: { x: number; y: number };
    data: WorkflowNodeData;
    type: string;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
  }[];
}
```

---

## 5. Directory Structure Plan

```
codewithai/
├── agent/                     # Panduan multi-agent & job specs
│   ├── context.md             # File context utama (file ini)
│   ├── job.md                 # Master job sheet (Agent 1 & Agent 2)
│   ├── agent1-job.md          # Job sheet spesifik Agent 1 (Frontend & Canvas)
│   └── agent2-job.md          # Job sheet spesifik Agent 2 (Backend, AI & CLI)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── questions/route.ts   # Generate pilihan ganda
│   │   │   │   ├── workflow/route.ts    # Generate nodes & edges
│   │   │   │   └── prd/route.ts         # Generate prd.md
│   │   │   └── session/
│   │   │       ├── [id]/route.ts        # Ambil session data
│   │   │       ├── [id]/stream/route.ts # SSE real-time updates
│   │   │       └── update/route.ts      # Endpoint untuk CLI npx codewithai
│   │   ├── canvas/            # Halaman workflow canvas
│   │   └── page.tsx           # Landing + Chatbot + Questionnaire
│   ├── components/
│   │   ├── canvas/            # React Flow custom nodes, controls, minimap
│   │   ├── chat/              # Chat input bar & conversation bubble
│   │   ├── questions/         # Interactive Multiple-choice question cards
│   │   └── prd/               # PRD markdown viewer & export dialog
│   └── lib/                   # Gemini client, session store, graph layout helper
└── cli/                       # Source code untuk npx codewithai
    └── bin/
        └── index.js
```
