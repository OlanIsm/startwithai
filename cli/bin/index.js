#!/usr/bin/env node

/**
 * CodeWithAI CLI Companion
 * Telemetry client used by AI Coding Agents (Cursor, Claude Code, Antigravity, Roo Code)
 * to sync step progress with the interactive web canvas in real-time.
 */

// Fallback color formatting in case picocolors isn't resolved
let pc;
try {
  pc = require('picocolors');
} catch {
  pc = {
    bold: (s) => `\x1b[1m${s}\x1b[22m`,
    green: (s) => `\x1b[32m${s}\x1b[39m`,
    yellow: (s) => `\x1b[33m${s}\x1b[39m`,
    cyan: (s) => `\x1b[36m${s}\x1b[39m`,
    red: (s) => `\x1b[31m${s}\x1b[39m`,
    dim: (s) => `\x1b[2m${s}\x1b[22m`,
    magenta: (s) => `\x1b[35m${s}\x1b[39m`,
  };
}

let Command;
try {
  Command = require('commander').Command;
} catch {
  // If commander isn't installed yet, provide fallback lightweight argument parser
  Command = null;
}

const DEFAULT_API_URL = process.env.CODEWITHAI_API_URL || 'http://localhost:3000';

function renderBanner() {
  console.log(pc.cyan('┌─────────────────────────────────────────────────────────┐'));
  console.log(pc.cyan('│') + pc.bold('           🚀 CodeWithAI Agent Telemetry                 ') + pc.cyan('│'));
  console.log(pc.cyan('└─────────────────────────────────────────────────────────┘'));
}

function getStatusBadge(status) {
  switch (status) {
    case 'done':
      return pc.green('✔ DONE');
    case 'in_progress':
      return pc.yellow('⏳ IN PROGRESS');
    case 'blocked':
      return pc.red('✖ BLOCKED');
    case 'pending':
    default:
      return pc.dim('⚪ PENDING');
  }
}

async function updateStep(stepId, options) {
  renderBanner();

  const sessionId = options.session;
  const status = options.status || 'done';
  const notes = options.notes || '';
  const apiUrl = (options.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

  if (!sessionId) {
    console.error(pc.red('Error: --session <sessionId> is required.'));
    console.log(pc.dim('Example: npx codewithai update ' + (stepId || 'setup-db') + ' --session sess_123 --status done\n'));
    process.exit(1);
  }

  if (!stepId) {
    console.error(pc.red('Error: <step-id> is required.'));
    console.log(pc.dim('Example: npx codewithai update setup-db --session ' + sessionId + ' --status done\n'));
    process.exit(1);
  }

  const endpoint = `${apiUrl}/api/session/update`;
  console.log(pc.dim(`Connecting to: ${endpoint}`));
  console.log(pc.dim(`Syncing step: `) + pc.bold(stepId) + pc.dim(` -> `) + getStatusBadge(status));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        stepId,
        status,
        notes,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(pc.red(`\n✖ Telemetry update failed (HTTP ${response.status}):`));
      console.error(pc.red(`  ${result.message || 'Unknown error'}`));
      process.exit(1);
    }

    const nodeLabel = result.updatedNode?.label || stepId;

    console.log('\n' + pc.green('✔ Telemetry Synced Successfully!'));
    console.log(`  ${pc.bold('Task:')}      ${nodeLabel} (${pc.dim(stepId)})`);
    console.log(`  ${pc.bold('Status:')}    ${getStatusBadge(status)}`);
    if (notes) {
      console.log(`  ${pc.bold('Notes:')}     ${pc.dim(notes)}`);
    }
    console.log(`  ${pc.bold('Dashboard:')} ${pc.cyan(`${apiUrl}/canvas/${sessionId}`)}\n`);
  } catch (error) {
    console.error(pc.red('\n✖ Connection Error: Could not connect to CodeWithAI server.'));
    console.error(pc.dim(`  Endpoint: ${endpoint}`));
    console.error(pc.dim(`  Details:  ${error.message}`));
    console.log(pc.yellow('\nTip: Make sure the CodeWithAI Next.js app is running on ' + apiUrl + ' or specify --api-url <url>\n'));
    process.exit(1);
  }
}

async function viewStatus(options) {
  renderBanner();

  const sessionId = options.session;
  const apiUrl = (options.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

  if (!sessionId) {
    console.error(pc.red('Error: --session <sessionId> is required.'));
    process.exit(1);
  }

  const endpoint = `${apiUrl}/api/session/${sessionId}`;

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(pc.red(`\n✖ Failed to fetch session (HTTP ${response.status}): ${data.error || 'Unknown error'}`));
      process.exit(1);
    }

    const session = data.session;
    console.log(`\n${pc.bold('App Name:')}    ${session.appName}`);
    console.log(`${pc.bold('Session ID:')}  ${pc.cyan(session.id)}`);
    console.log(`${pc.bold('Live Canvas:')} ${pc.cyan(`${apiUrl}/canvas/${sessionId}`)}\n`);

    console.log(pc.bold('Steps Progress:'));
    const nodes = session.graph?.nodes || [];

    if (nodes.length === 0) {
      console.log(pc.dim('  No nodes registered yet.'));
    } else {
      nodes.forEach((node, index) => {
        const d = node.data;
        console.log(`  ${index + 1}. [${getStatusBadge(d.status)}] ${pc.bold(d.label)} (${pc.dim(d.id)}) - Phase ${d.phase}`);
      });
    }
    console.log('');
  } catch (error) {
    console.error(pc.red(`\n✖ Connection Error: ${error.message}\n`));
    process.exit(1);
  }
}

// CLI Execution Setup
if (Command) {
  const program = new Command();

  program
    .name('codewithai')
    .description('CodeWithAI CLI Companion - Telemetry hook for AI coding agents')
    .version('1.0.0');

  program
    .command('update <stepId>')
    .description('Send step completion or status update to the CodeWithAI live canvas')
    .requiredOption('-s, --session <sessionId>', 'Session ID of the project')
    .option('--status <status>', 'Status: pending, in_progress, done, blocked', 'done')
    .option('-n, --notes <notes>', 'Notes or acceptance details about the step')
    .option('-u, --api-url <url>', 'Base URL of CodeWithAI web application', DEFAULT_API_URL)
    .action((stepId, options) => {
      updateStep(stepId, options);
    });

  program
    .command('status')
    .description('Fetch and display current progress of all steps in the session')
    .requiredOption('-s, --session <sessionId>', 'Session ID of the project')
    .option('-u, --api-url <url>', 'Base URL of CodeWithAI web application', DEFAULT_API_URL)
    .action((options) => {
      viewStatus(options);
    });

  program.parse(process.argv);
} else {
  // Manual parse fallback if commander isn't installed
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'update') {
    const stepId = args[1];
    const sessionIdx = args.indexOf('--session') !== -1 ? args.indexOf('--session') : args.indexOf('-s');
    const statusIdx = args.indexOf('--status');
    const notesIdx = args.indexOf('--notes') !== -1 ? args.indexOf('--notes') : args.indexOf('-n');
    const apiUrlIdx = args.indexOf('--api-url') !== -1 ? args.indexOf('--api-url') : args.indexOf('-u');

    const options = {
      session: sessionIdx !== -1 ? args[sessionIdx + 1] : undefined,
      status: statusIdx !== -1 ? args[statusIdx + 1] : 'done',
      notes: notesIdx !== -1 ? args[notesIdx + 1] : undefined,
      apiUrl: apiUrlIdx !== -1 ? args[apiUrlIdx + 1] : DEFAULT_API_URL,
    };
    updateStep(stepId, options);
  } else if (command === 'status') {
    const sessionIdx = args.indexOf('--session') !== -1 ? args.indexOf('--session') : args.indexOf('-s');
    const apiUrlIdx = args.indexOf('--api-url') !== -1 ? args.indexOf('--api-url') : args.indexOf('-u');

    const options = {
      session: sessionIdx !== -1 ? args[sessionIdx + 1] : undefined,
      apiUrl: apiUrlIdx !== -1 ? args[apiUrlIdx + 1] : DEFAULT_API_URL,
    };
    viewStatus(options);
  } else {
    renderBanner();
    console.log(`
Usage:
  npx codewithai update <step-id> --session <session-id> [--status <done|in_progress|pending|blocked>] [--notes <notes>]
  npx codewithai status --session <session-id>
`);
  }
}
