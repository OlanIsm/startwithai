# CodeWithAI CLI Companion (`codewithai`)

Companion command-line telemetry tool for **CodeWithAI**.
Used by AI Coding Agents (Cursor, Claude Code, Antigravity, Roo Code) and developers to send real-time progress updates to the live interactive canvas.

---

## 📦 Installation / Execution

Run directly using `npx`:

```bash
npx codewithai <command> [options]
```

Or install globally:

```bash
npm install -g .
```

---

## 🛠️ Commands

### 1. `update`
Pushes step status to the web application and triggers real-time updates on the interactive canvas.

```bash
npx codewithai update <step-id> --session <sessionId> --status <pending|in_progress|done|blocked> [--notes <notes>] [--api-url <url>]
```

#### Options:
- `<step-id>` (required): The ID of the workflow node/step (e.g. `setup-db`, `feat-auth`).
- `-s, --session <sessionId>` (required): The project session ID.
- `--status <status>`: Node status (`pending`, `in_progress`, `done`, `blocked`). Default: `done`.
- `-n, --notes <notes>`: Optional notes describing the work completed.
- `-u, --api-url <url>`: URL of the CodeWithAI web application. Default: `http://localhost:3000` (or `process.env.CODEWITHAI_API_URL`).

#### Examples:
```bash
# Mark task in progress:
npx codewithai update setup-db --session sess_12345 --status in_progress

# Mark task done with completion note:
npx codewithai update setup-db --session sess_12345 --status done --notes "PostgreSQL schema and migrations created"
```

---

### 2. `status`
Displays the full project roadmap and the status of all steps directly in your terminal.

```bash
npx codewithai status --session <sessionId> [--api-url <url>]
```

#### Example:
```bash
npx codewithai status --session sess_12345
```
