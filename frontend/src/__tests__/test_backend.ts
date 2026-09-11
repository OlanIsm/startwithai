import { generateQuestionsWithGemini, generateWorkflowWithGemini, generatePrdWithGemini } from '@/lib/ai/gemini';
import { layoutGraph } from '@/lib/utils/layoutGraph';
import { sessionStore } from '@/lib/db/sessionStore';
import { POST as questionsHandler } from '@/app/api/ai/questions/route';
import { POST as workflowHandler } from '@/app/api/ai/workflow/route';
import { POST as prdHandler } from '@/app/api/ai/prd/route';
import { GET as sessionGetHandler } from '@/app/api/session/[id]/route';
import { POST as sessionUpdateHandler } from '@/app/api/session/update/route';
import { NextRequest } from 'next/server';

async function runTests() {
  console.log('=== 🧪 Testing Agent 2 Backend & AI Engine ===\n');

  // 1. Test Question Generator
  console.log('1. Testing generateQuestionsWithGemini...');
  const questions = await generateQuestionsWithGemini('Bikin SaaS invoice generator untuk freelancer dengan pembayaran Midtrans');
  console.log(`Generated ${questions.length} questions:`);
  questions.forEach((q) => {
    console.log(`  [${q.id}] ${q.question} (${q.options.length} options, recommended: ${q.options.find(o => o.recommended)?.label})`);
  });
  if (questions.length < 3) throw new Error('Expected at least 3 questions');

  // 2. Test Workflow DAG & Auto-Layout
  console.log('\n2. Testing generateWorkflowWithGemini & layoutGraph...');
  const sampleAnswers = {
    q1: 'Next.js 15',
    q2: 'Supabase PostgreSQL',
    q3: 'Midtrans Payment Gateway'
  };
  const { appName, graph } = await generateWorkflowWithGemini(
    'Bikin SaaS invoice generator untuk freelancer dengan pembayaran Midtrans',
    sampleAnswers,
    'test_sess_001'
  );
  console.log(`App Name: ${appName}`);
  console.log(`Nodes count: ${graph.nodes.length}, Edges count: ${graph.edges.length}`);
  graph.nodes.forEach(node => {
    console.log(`  Node [${node.id}] at (${node.position.x}, ${node.position.y}) - Phase ${node.data.phase}: ${node.data.label}`);
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      throw new Error(`Node ${node.id} is missing coordinates`);
    }
    if (!node.data.cliCommand) {
      throw new Error(`Node ${node.id} is missing cliCommand`);
    }
  });

  // 3. Test PRD Generation
  console.log('\n3. Testing generatePrdWithGemini...');
  const prd = await generatePrdWithGemini(
    'Bikin SaaS invoice generator untuk freelancer dengan pembayaran Midtrans',
    sampleAnswers,
    graph,
    'test_sess_001'
  );
  console.log(`PRD Length: ${prd.length} chars`);
  if (!prd.includes('Agent Telemetry Hook Protocol') && !prd.includes('codewithai update')) {
    throw new Error('PRD missing telemetry hook section');
  }
  console.log('PRD contains Telemetry Hook instructions: YES');

  // 4. Test SessionStore & SSE Events
  console.log('\n4. Testing sessionStore & Event Subscription...');
  sessionStore.clear();
  sessionStore.upsertSession('test_sess_001', {
    id: 'test_sess_001',
    appName,
    rawPrompt: 'Bikin SaaS invoice generator',
    answers: sampleAnswers,
    graph,
  });

  let eventReceived = false;
  const unsubscribe = sessionStore.subscribe('test_sess_001', (event) => {
    console.log(`  Received SSE event: type=${event.type}, step=${event.data.node?.id}, status=${event.data.node?.status}`);
    if (event.type === 'status_update' && event.data.node?.id === 'setup-db' && event.data.node?.status === 'done') {
      eventReceived = true;
    }
  });

  const updateResult = sessionStore.updateNodeStatus('test_sess_001', 'setup-db', 'done', 'Migration completed');
  if (!updateResult || updateResult.updatedNode.status !== 'done') {
    throw new Error('Failed to update node status in store');
  }
  if (!eventReceived) {
    throw new Error('SSE subscriber did not receive the update event');
  }
  unsubscribe();
  console.log('Session store & SSE event emitting verified successfully!');

  // 5. Test Next.js Route Handlers
  console.log('\n5. Testing API Route Handlers...');

  // Questions Route
  const qReq = new NextRequest('http://localhost:3000/api/ai/questions', {
    method: 'POST',
    body: JSON.stringify({ idea: 'Aplikasi manajemen kasbon kantor' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const qRes = await questionsHandler(qReq);
  const qData = await qRes.json();
  if (qRes.status !== 200 || !qData.questions?.length) {
    throw new Error('Questions API route handler failed');
  }
  console.log('  POST /api/ai/questions -> Status 200 OK');

  // Workflow Route
  const wReq = new NextRequest('http://localhost:3000/api/ai/workflow', {
    method: 'POST',
    body: JSON.stringify({ idea: 'Aplikasi manajemen kasbon kantor', answers: { stack: 'Next.js' } }),
    headers: { 'Content-Type': 'application/json' },
  });
  const wRes = await workflowHandler(wReq);
  const wData = await wRes.json();
  if (wRes.status !== 200 || !wData.sessionId || !wData.graph?.nodes?.length) {
    throw new Error('Workflow API route handler failed');
  }
  console.log(`  POST /api/ai/workflow -> Status 200 OK (Created session: ${wData.sessionId})`);

  // PRD Route
  const pReq = new NextRequest('http://localhost:3000/api/ai/prd', {
    method: 'POST',
    body: JSON.stringify({
      idea: 'Aplikasi manajemen kasbon kantor',
      answers: { stack: 'Next.js' },
      sessionId: wData.sessionId,
      graph: wData.graph,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const pRes = await prdHandler(pReq);
  const pData = await pRes.json();
  if (pRes.status !== 200 || !pData.markdown) {
    throw new Error('PRD API route handler failed');
  }
  console.log('  POST /api/ai/prd -> Status 200 OK');

  // PRD Route with only sessionId (Canvas openPrd flow)
  const pReq2 = new NextRequest('http://localhost:3000/api/ai/prd', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: wData.sessionId,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const pRes2 = await prdHandler(pReq2);
  const pData2 = await pRes2.json();
  if (pRes2.status !== 200 || !pData2.markdown) {
    throw new Error('PRD API route handler failed when called with only sessionId');
  }
  console.log('  POST /api/ai/prd (only sessionId) -> Status 200 OK');

  // Session Update Route
  const firstNodeId = wData.graph.nodes[0].id;
  const uReq = new NextRequest('http://localhost:3000/api/session/update', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: wData.sessionId,
      stepId: firstNodeId,
      status: 'done',
      notes: 'Implemented successfully by AI agent',
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const uRes = await sessionUpdateHandler(uReq);
  const uData = await uRes.json();
  if (uRes.status !== 200 || !uData.success || uData.updatedNode?.status !== 'done') {
    throw new Error('Session update API route handler failed');
  }
  console.log(`  POST /api/session/update -> Status 200 OK (Node ${firstNodeId} marked done)`);

  // Session GET Route
  const gReq = new NextRequest(`http://localhost:3000/api/session/${wData.sessionId}`);
  const gRes = await sessionGetHandler(gReq, { params: Promise.resolve({ id: wData.sessionId }) });
  const gData = await gRes.json();
  if (gRes.status !== 200 || !gData.success || gData.session.id !== wData.sessionId) {
    throw new Error('Session GET API route handler failed');
  }
  const updatedNodeInStore = gData.session.graph.nodes.find((n: any) => n.id === firstNodeId);
  if (updatedNodeInStore?.data?.status !== 'done') {
    throw new Error('Node in session store did not reflect done status');
  }
  console.log(`  GET /api/session/[id] -> Status 200 OK (Verified node status in store: done)`);

  console.log('\n🎉 ALL BACKEND & AI TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
