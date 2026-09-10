import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generatePrdWithGemini, generateWorkflowWithGemini } from '@/lib/ai/gemini';
import { sessionStore } from '@/lib/db/sessionStore';
import { PrdRequest, PrdResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: PrdRequest = await request.json();

    if (!body || typeof body.idea !== 'string' || !body.idea.trim()) {
      return NextResponse.json(
        { error: 'Invalid payload: "idea" is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId || `sess_${nanoid(10)}`;
    const answers = body.answers || {};

    let graph = body.graph;
    if (!graph) {
      const existingSession = sessionStore.getSession(sessionId);
      if (existingSession && existingSession.graph?.nodes?.length > 0) {
        graph = existingSession.graph;
      } else {
        const workflowResult = await generateWorkflowWithGemini(
          body.idea.trim(),
          answers,
          sessionId
        );
        graph = workflowResult.graph;
      }
    }

    const markdown = await generatePrdWithGemini(
      body.idea.trim(),
      answers,
      graph,
      sessionId
    );

    // Persist PRD markdown in session
    sessionStore.upsertSession(sessionId, {
      id: sessionId,
      rawPrompt: body.idea.trim(),
      answers,
      graph,
      prdMarkdown: markdown,
    });

    const response: PrdResponse = {
      sessionId,
      markdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/ai/prd] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while compiling PRD.' },
      { status: 500 }
    );
  }
}
