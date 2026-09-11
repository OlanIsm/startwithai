import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generatePrdWithGemini, generateWorkflowWithGemini } from '@/lib/ai/gemini';
import { sessionStore } from '@/lib/db/sessionStore';
import { PrdRequest, PrdResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: PrdRequest = await request.json();

    const sessionId = body?.sessionId || `sess_${nanoid(10)}`;
    const existingSession = sessionStore.getSession(sessionId);

    // If session already has generated PRD and caller did not request regeneration, return immediately!
    if (existingSession?.prdMarkdown && existingSession.prdMarkdown.trim().length > 0 && !body?.regenerate) {
      const response: PrdResponse = {
        sessionId,
        markdown: existingSession.prdMarkdown,
        prdMarkdown: existingSession.prdMarkdown,
      };
      return NextResponse.json(response);
    }

    // Resolve idea from body or existing session
    const idea = (body?.idea || existingSession?.rawPrompt || '').trim();
    if (!idea) {
      return NextResponse.json(
        { error: 'Invalid payload: "idea" or a valid "sessionId" with an active session is required.' },
        { status: 400 }
      );
    }

    const answers = body?.answers || existingSession?.answers || {};

    let graph = body?.graph;
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
      if (existingSession && existingSession.graph?.nodes?.length > 0) {
        graph = existingSession.graph;
      } else {
        const workflowResult = await generateWorkflowWithGemini(
          idea,
          answers,
          sessionId
        );
        graph = workflowResult.graph;
      }
    }

    const markdown = await generatePrdWithGemini(
      idea,
      answers,
      graph,
      sessionId
    );

    // Persist PRD markdown in session
    sessionStore.upsertSession(sessionId, {
      id: sessionId,
      appName: existingSession?.appName || idea.slice(0, 35).trim(),
      rawPrompt: idea,
      answers,
      graph,
      prdMarkdown: markdown,
    });

    const response: PrdResponse = {
      sessionId,
      markdown,
      prdMarkdown: markdown,
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
