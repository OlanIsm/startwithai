import http from 'http';
import { execFile } from 'child_process';
import path from 'path';
import { sessionStore } from '@/lib/db/sessionStore';
import { WorkflowGraph } from '@/types';

// Setup mock session in sessionStore
const testSessionId = 'sess_cli_test_999';
const mockGraph: WorkflowGraph = {
  nodes: [
    {
      id: 'step-auth',
      position: { x: 100, y: 100 },
      data: {
        id: 'step-auth',
        label: 'Authentication Setup',
        description: 'Configure NextAuth or Supabase Auth',
        status: 'pending',
        phase: 1,
        dependencies: [],
        cliCommand: `npx codewithai update step-auth --session ${testSessionId} --status done`,
      },
      type: 'customStep',
    },
    {
      id: 'step-payment',
      position: { x: 300, y: 100 },
      data: {
        id: 'step-payment',
        label: 'Payment Gateway Integration',
        description: 'Integrate Midtrans Snap API',
        status: 'pending',
        phase: 2,
        dependencies: ['step-auth'],
        cliCommand: `npx codewithai update step-payment --session ${testSessionId} --status done`,
      },
      type: 'customStep',
    },
  ],
  edges: [
    { id: 'e-1', source: 'step-auth', target: 'step-payment' },
  ],
};

sessionStore.upsertSession(testSessionId, {
  id: testSessionId,
  appName: 'Invoice Master Pro',
  rawPrompt: 'SaaS Invoicing for Freelancers',
  answers: {},
  graph: mockGraph,
});

// Start lightweight HTTP server responding to /api/session/update and /api/session/[id]
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/session/update') {
    let bodyStr = '';
    req.on('data', (chunk) => { bodyStr += chunk; });
    req.on('end', () => {
      const { sessionId, stepId, status, notes } = JSON.parse(bodyStr);
      const result = sessionStore.updateNodeStatus(sessionId, stepId, status, notes);
      if (!result) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Node or session not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, updatedNode: result.updatedNode, notes }));
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/session/')) {
    const sessionId = url.pathname.split('/').pop() || '';
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Session not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, session }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3456, async () => {
  console.log('Mock server listening on port 3456');

  const cliBin = path.resolve(__dirname, '../../../cli/bin/index.js');

  function runCli(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile('node', [cliBin, ...args], (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  try {
    console.log('\n--- Testing CLI update command (in_progress) ---');
    const updateOut1 = await runCli([
      'update',
      'step-auth',
      '--session',
      testSessionId,
      '--status',
      'in_progress',
      '--notes',
      'Agent working on Supabase Auth',
      '--api-url',
      'http://localhost:3456',
    ]);
    console.log(updateOut1);

    const node1 = sessionStore.getSession(testSessionId)?.graph.nodes.find((n) => n.id === 'step-auth');
    if (node1?.data.status !== 'in_progress') {
      throw new Error(`Expected status 'in_progress', got ${node1?.data.status}`);
    }

    console.log('--- Testing CLI update command (done) ---');
    const updateOut2 = await runCli([
      'update',
      'step-auth',
      '--session',
      testSessionId,
      '--status',
      'done',
      '--notes',
      'All Auth unit tests passing',
      '--api-url',
      'http://localhost:3456',
    ]);
    console.log(updateOut2);

    const node2 = sessionStore.getSession(testSessionId)?.graph.nodes.find((n) => n.id === 'step-auth');
    if (node2?.data.status !== 'done') {
      throw new Error(`Expected status 'done', got ${node2?.data.status}`);
    }

    console.log('--- Testing CLI status command ---');
    const statusOut = await runCli([
      'status',
      '--session',
      testSessionId,
      '--api-url',
      'http://localhost:3456',
    ]);
    console.log(statusOut);

    console.log('✅ CLI Integration Tests Completed Successfully!');
  } catch (err) {
    console.error('CLI test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
