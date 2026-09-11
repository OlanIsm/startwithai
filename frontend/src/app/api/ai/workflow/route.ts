import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateWorkflowWithGemini } from '@/lib/ai/gemini';
import { sessionStore } from '@/lib/db/sessionStore';
import { WorkflowRequest, WorkflowResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: WorkflowRequest = await request.json();

    if (!body || typeof body.idea !== 'string' || !body.idea.trim()) {
      return NextResponse.json(
        { error: 'Invalid payload: "idea" is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId || `sess_${nanoid(10)}`;
    const answers = body.answers || {};

    const { appName, graph } = await generateWorkflowWithGemini(
      body.idea.trim(),
      answers,
      sessionId
    );

    // Save session into store
    const session = sessionStore.upsertSession(sessionId, {
      id: sessionId,
      appName,
      rawPrompt: body.idea.trim(),
      answers,
      graph,
    });

    const response: WorkflowResponse = {
      sessionId,
      appName,
      graph,
      session,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/ai/workflow] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while generating workflow graph.' },
      { status: 500 }
    );
  }
}
