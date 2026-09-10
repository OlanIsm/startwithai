import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Question,
  WorkflowGraph,
  WorkflowNodeData,
  WorkflowEdge,
} from '@/types';
import {
  QUESTIONS_SYSTEM_PROMPT,
  WORKFLOW_SYSTEM_PROMPT,
  PRD_SYSTEM_PROMPT,
} from './prompts';
import { layoutGraph } from '../utils/layoutGraph';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('[GeminiClient] Could not initialize GoogleGenerativeAI:', err);
  }
}

/**
 * Strips markdown code fences (e.g. ```json ... ```) from model response.
 */
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

/**
 * Heuristic fallback question generator when Gemini API is unavailable or unconfigured.
 */
function getFallbackQuestions(idea: string): Question[] {
  const lower = idea.toLowerCase();
  const isIndo = /bikin|buat|aplikasi|untuk|dengan|dan|yang|saya/i.test(idea);

  if (isIndo) {
    return [
      {
        id: 'q1',
        question: 'Teknologi framework & arsitektur utama apa yang ingin digunakan?',
        options: [
          { id: 'opt-nextjs', label: 'Next.js 15 (App Router, React 19, TypeScript)', recommended: true },
          { id: 'opt-vite-react', label: 'React + Vite (SPA) + Express/Fastify Backend', recommended: false },
          { id: 'opt-mobile', label: 'Flutter / React Native (Cross-platform Mobile)', recommended: false },
        ],
      },
      {
        id: 'q2',
        question: 'Pilihan database dan sistem penyimpanan data?',
        options: [
          { id: 'opt-supabase', label: 'Supabase (PostgreSQL + Realtime + Row-Level Security)', recommended: true },
          { id: 'opt-prisma-pg', label: 'PostgreSQL + Prisma ORM (Self-hosted / Neon)', recommended: false },
          { id: 'opt-sqlite', label: 'Local SQLite / Turso (Ringan & Zero Config)', recommended: false },
        ],
      },
      {
        id: 'q3',
        question: 'Mekanisme autentikasi & manajemen pengguna?',
        options: [
          { id: 'opt-supabase-auth', label: 'Supabase Auth / NextAuth.js (Email + OAuth Google/GitHub)', recommended: true },
          { id: 'opt-clerk', label: 'Clerk Auth (Turnkey auth & user profile management)', recommended: false },
          { id: 'opt-custom-jwt', label: 'Custom JWT & Session Cookie', recommended: false },
        ],
      },
      {
        id: 'q4',
        question: 'Integrasi layanan eksternal utama yang dibutuhkan?',
        options: [
          {
            id: 'opt-midtrans',
            label: lower.includes('bayar') || lower.includes('invoice') || lower.includes('saas')
              ? 'Midtrans / Xendit Payment Gateway (Snap API & Webhook)'
              : 'Stripe / Midtrans Payment Gateway',
            recommended: true,
          },
          { id: 'opt-ai-gemini', label: 'AI Agent / Gemini API Integration', recommended: false },
          { id: 'opt-email', label: 'Transactional Email (Resend / SendGrid)', recommended: false },
        ],
      },
    ];
  }

  return [
    {
      id: 'q1',
      question: 'Which framework and architectural stack do you prefer?',
      options: [
        { id: 'opt-nextjs', label: 'Next.js 15 (App Router, React 19, TypeScript)', recommended: true },
        { id: 'opt-vite-react', label: 'Vite React + Express/Node Backend', recommended: false },
        { id: 'opt-python', label: 'FastAPI (Python) + React Frontend', recommended: false },
      ],
    },
    {
      id: 'q2',
      question: 'What database solution best fits your project needs?',
      options: [
        { id: 'opt-supabase', label: 'Supabase (PostgreSQL + RLS + Storage)', recommended: true },
        { id: 'opt-prisma-pg', label: 'PostgreSQL with Prisma ORM', recommended: false },
        { id: 'opt-sqlite', label: 'SQLite / Turso (Embedded & Fast)', recommended: false },
      ],
    },
    {
      id: 'q3',
      question: 'Which authentication provider would you like to implement?',
      options: [
        { id: 'opt-nextauth', label: 'Auth.js / NextAuth (OAuth & Credentials)', recommended: true },
        { id: 'opt-clerk', label: 'Clerk (Pre-built UI & Organizations)', recommended: false },
        { id: 'opt-jwt', label: 'Stateless JWT / Session Cookies', recommended: false },
      ],
    },
    {
      id: 'q4',
      question: 'What external integration or payment system is essential?',
      options: [
        { id: 'opt-stripe', label: 'Stripe Billing & Subscriptions', recommended: true },
        { id: 'opt-gemini-ai', label: 'Google Gemini AI Integration', recommended: false },
        { id: 'opt-resend', label: 'Transactional Email (Resend)', recommended: false },
      ],
    },
  ];
}

/**
 * Heuristic fallback workflow DAG generator when Gemini API is unavailable.
 */
function getFallbackWorkflow(
  idea: string,
  answers: Record<string, any>,
  sessionId: string
): { appName: string; graph: WorkflowGraph } {
  const isIndo = /bikin|buat|aplikasi|untuk|dengan|dan|yang|saya/i.test(idea);
  const appName = idea.slice(0, 35).trim() || 'CodeWithAI Project';

  const rawNodes: { id: string; data: WorkflowNodeData }[] = [
    {
      id: 'init-scaffold',
      data: {
        id: 'init-scaffold',
        label: isIndo ? 'Inisialisasi Project & Konfigurasi' : 'Project Setup & Scaffolding',
        description: isIndo
          ? 'Setup repository, TypeScript, linting, dan struktur direktori modular.'
          : 'Initialize repository, TypeScript, linting, and modular folder structure.',
        status: 'pending',
        phase: 1,
        dependencies: [],
        cliCommand: `npx codewithai update init-scaffold --session ${sessionId} --status done`,
      },
    },
    {
      id: 'setup-db',
      data: {
        id: 'setup-db',
        label: isIndo ? 'Database Schema & Migrasi' : 'Database Schema & Migrations',
        description: isIndo
          ? 'Konfigurasi koneksi PostgreSQL, data model, dan migrasi tabel inti.'
          : 'Configure database connection, relational schemas, and baseline migrations.',
        status: 'pending',
        phase: 1,
        dependencies: ['init-scaffold'],
        cliCommand: `npx codewithai update setup-db --session ${sessionId} --status done`,
      },
    },
    {
      id: 'auth-flow',
      data: {
        id: 'auth-flow',
        label: isIndo ? 'Autentikasi & Otorisasi User' : 'Authentication & Session Flow',
        description: isIndo
          ? 'Mekanisme sign-in, sign-up, proteksi rute, dan session management.'
          : 'User signup, sign-in, protected route middleware, and session management.',
        status: 'pending',
        phase: 1,
        dependencies: ['setup-db'],
        cliCommand: `npx codewithai update auth-flow --session ${sessionId} --status done`,
      },
    },
    {
      id: 'core-feature-api',
      data: {
        id: 'core-feature-api',
        label: isIndo ? 'Core Business Logic & API Endpoints' : 'Core Business Logic & APIs',
        description: isIndo
          ? 'Implementasi CRUD endpoint utama dan validasi data request.'
          : 'Build CRUD endpoints, business logic service layer, and request validation.',
        status: 'pending',
        phase: 2,
        dependencies: ['auth-flow'],
        cliCommand: `npx codewithai update core-feature-api --session ${sessionId} --status done`,
      },
    },
    {
      id: 'core-feature-ui',
      data: {
        id: 'core-feature-ui',
        label: isIndo ? 'User Interface & Dashboard' : 'User Interface & Dashboard',
        description: isIndo
          ? 'Halaman utama, interaksi komponen, dan visual feedback pengguna.'
          : 'Interactive dashboard, data display tables, and responsive forms.',
        status: 'pending',
        phase: 2,
        dependencies: ['core-feature-api'],
        cliCommand: `npx codewithai update core-feature-ui --session ${sessionId} --status done`,
      },
    },
    {
      id: 'third-party-integration',
      data: {
        id: 'third-party-integration',
        label: isIndo ? 'Integrasi Payment / Eksternal API' : 'External Service Integration',
        description: isIndo
          ? 'Menghubungkan webhook gateway pembayaran, notifikasi email, dan third-party sync.'
          : 'Integrate external payment gateways, webhooks, and transactional emails.',
        status: 'pending',
        phase: 3,
        dependencies: ['core-feature-ui'],
        cliCommand: `npx codewithai update third-party-integration --session ${sessionId} --status done`,
      },
    },
    {
      id: 'testing-deploy',
      data: {
        id: 'testing-deploy',
        label: isIndo ? 'E2E Testing & Deployment' : 'Testing, Polish & Deployment',
        description: isIndo
          ? 'Pengujian alur kritis, optimasi performa, dan deployment production.'
          : 'End-to-end testing, error telemetry, performance audits, and production deploy.',
        status: 'pending',
        phase: 3,
        dependencies: ['third-party-integration'],
        cliCommand: `npx codewithai update testing-deploy --session ${sessionId} --status done`,
      },
    },
  ];

  const rawEdges: WorkflowEdge[] = [
    { id: 'e-init-scaffold-setup-db', source: 'init-scaffold', target: 'setup-db', animated: true },
    { id: 'e-setup-db-auth-flow', source: 'setup-db', target: 'auth-flow', animated: true },
    { id: 'e-auth-flow-core-feature-api', source: 'auth-flow', target: 'core-feature-api', animated: true },
    { id: 'e-core-feature-api-core-feature-ui', source: 'core-feature-api', target: 'core-feature-ui', animated: true },
    { id: 'e-core-feature-ui-third-party-integration', source: 'core-feature-ui', target: 'third-party-integration', animated: true },
    { id: 'e-third-party-integration-testing-deploy', source: 'third-party-integration', target: 'testing-deploy', animated: true },
  ];

  const graph = layoutGraph(rawNodes, rawEdges, { direction: 'LR' });
  return { appName, graph };
}

/**
 * Heuristic fallback PRD generator when Gemini API is unavailable.
 */
function getFallbackPrd(
  idea: string,
  answers: Record<string, any>,
  graph: WorkflowGraph,
  sessionId: string
): string {
  const answerSummary = Object.entries(answers)
    .map(([k, v]) => `- **${k}**: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');

  const roadmapTasks = graph.nodes
    .map(
      (node) => `### ${node.data.label} (ID: \`${node.id}\`)
- [ ] **Acceptance Criteria**: ${node.data.description}
- **Phase**: Phase ${node.data.phase}
- **Dependencies**: ${node.data.dependencies.length > 0 ? node.data.dependencies.map((d) => `\`${d}\``).join(', ') : 'None'}
- **Agent Command**:
  \`\`\`bash
  npx codewithai update ${node.id} --session ${sessionId} --status done
  \`\`\`
`
    )
    .join('\n');

  return `# Product Requirements Document (PRD): ${idea.slice(0, 40)}

## 1. Executive Summary & Goals
- **Product Idea**: ${idea}
- **Objective**: Deliver a fast, modular, production-ready solution solving the core user need with high reliability and clean architecture.
- **Success Criteria**: All phased deliverables completed and verified via automated CLI telemetry hooks.

## 2. Recommended Tech Stack & System Architecture
${answerSummary || '- Default: Modern Fullstack Architecture (Next.js 15, PostgreSQL, TypeScript)'}
- **Frontend**: Next.js 15 App Router, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Route Handlers, Server Actions, Edge/Node Runtime.
- **Database**: PostgreSQL with Prisma ORM / Supabase Client.
- **Telemetry**: CodeWithAI CLI Companion (\`npx codewithai\`).

## 3. Database Schema & Data Contract
\`\`\`sql
-- Users & Credentials
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Core Entity
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## 4. Phased Implementation Roadmap

${roadmapTasks}

## 5. Agent Telemetry Hook Protocol (CRITICAL)

> [!IMPORTANT]
> This project is monitored in real-time via the **CodeWithAI Telemetry Protocol**.
> When an AI Coding Agent (Cursor, Claude Code, Antigravity, Roo Code) is assigned to this project, it **MUST** execute the companion CLI telemetry update command whenever beginning and completing any step.

### Terminal Commands:
\`\`\`bash
# 1. When beginning work on a step:
npx codewithai update <step-id> --session ${sessionId} --status in_progress

# 2. When completing a step and passing acceptance tests:
npx codewithai update <step-id> --session ${sessionId} --status done --notes "Step completed and verified"
\`\`\`
`;
}

/**
 * Generate adaptive 3-5 technical multiple choice questions using Gemini API.
 */
export async function generateQuestionsWithGemini(idea: string): Promise<Question[]> {
  if (!genAI) {
    return getFallbackQuestions(idea);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: QUESTIONS_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const prompt = `User's Product Idea:\n"${idea}"\n\nGenerate 3-5 targeted multiple-choice questions to refine the architecture, database, auth, and core integrations.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(cleanJsonOutput(text));

    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed.questions;
    }
    return getFallbackQuestions(idea);
  } catch (error) {
    console.error('[Gemini] Error generating questions, using fallback:', error);
    return getFallbackQuestions(idea);
  }
}

/**
 * Generate workflow graph DAG (nodes and edges) using Gemini API.
 */
export async function generateWorkflowWithGemini(
  idea: string,
  answers: Record<string, any>,
  sessionId: string
): Promise<{ appName: string; graph: WorkflowGraph }> {
  if (!genAI) {
    return getFallbackWorkflow(idea, answers, sessionId);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: WORKFLOW_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const userPrompt = `Product Idea: "${idea}"\nQuestionnaire Answers:\n${JSON.stringify(answers, null, 2)}\n\nGenerate the workflow DAG with node IDs, labels, descriptions, phases (1 to 3), and dependencies.`;
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(cleanJsonOutput(text));

    if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
      const rawNodes: { id: string; data: WorkflowNodeData }[] = parsed.nodes.map((n: any) => ({
        id: n.id,
        data: {
          id: n.id,
          label: n.label || n.id,
          description: n.description || '',
          status: 'pending' as const,
          phase: n.phase || 1,
          dependencies: Array.isArray(n.dependencies) ? n.dependencies : [],
          cliCommand: `npx codewithai update ${n.id} --session ${sessionId} --status done`,
        },
      }));

      // Generate edges from dependencies if edges not explicitly provided
      let rawEdges: WorkflowEdge[] = [];
      if (Array.isArray(parsed.edges) && parsed.edges.length > 0) {
        rawEdges = parsed.edges.map((e: any) => ({
          id: e.id || `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          animated: true,
        }));
      } else {
        for (const node of rawNodes) {
          for (const dep of node.data.dependencies) {
            rawEdges.push({
              id: `e-${dep}-${node.id}`,
              source: dep,
              target: node.id,
              animated: true,
            });
          }
        }
      }

      const graph = layoutGraph(rawNodes, rawEdges, { direction: 'LR' });
      return {
        appName: parsed.appName || idea.slice(0, 35).trim() || 'CodeWithAI Project',
        graph,
      };
    }

    return getFallbackWorkflow(idea, answers, sessionId);
  } catch (error) {
    console.error('[Gemini] Error generating workflow graph, using fallback:', error);
    return getFallbackWorkflow(idea, answers, sessionId);
  }
}

/**
 * Generate industry-standard PRD Markdown document using Gemini API.
 */
export async function generatePrdWithGemini(
  idea: string,
  answers: Record<string, any>,
  graph: WorkflowGraph,
  sessionId: string
): Promise<string> {
  if (!genAI) {
    return getFallbackPrd(idea, answers, graph, sessionId);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: PRD_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.3,
      },
    });

    const userPrompt = `Product Idea: "${idea}"\nQuestionnaire Answers:\n${JSON.stringify(answers, null, 2)}\nWorkflow Nodes:\n${JSON.stringify(
      graph.nodes.map((n) => ({
        id: n.id,
        label: n.data.label,
        phase: n.data.phase,
        dependencies: n.data.dependencies,
        description: n.data.description,
      })),
      null,
      2
    )}\nSession ID: "${sessionId}"\n\nCompile the full PRD in Markdown.`;

    const result = await model.generateContent(userPrompt);
    const markdown = result.response.text();

    if (markdown && markdown.trim().length > 100) {
      return markdown.trim();
    }
    return getFallbackPrd(idea, answers, graph, sessionId);
  } catch (error) {
    console.error('[Gemini] Error generating PRD, using fallback:', error);
    return getFallbackPrd(idea, answers, graph, sessionId);
  }
}
