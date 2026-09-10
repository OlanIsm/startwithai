import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/db/sessionStore';
import { NodeStatus, UpdateStatusRequest, UpdateStatusResponse } from '@/types';

const VALID_STATUSES: NodeStatus[] = ['pending', 'in_progress', 'done', 'blocked'];

export async function POST(request: NextRequest) {
  try {
    const body: UpdateStatusRequest = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload.' },
        { status: 400 }
      );
    }

    const { sessionId, stepId, status, notes } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing required field: "sessionId".' },
        { status: 400 }
      );
    }

    if (!stepId || typeof stepId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing required field: "stepId".' },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status "${status}". Allowed statuses: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const result = sessionStore.updateNodeStatus(sessionId, stepId, status, notes);

    if (!result) {
      const session = sessionStore.getSession(sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, message: `Session '${sessionId}' not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, message: `Node with stepId '${stepId}' not found in session '${sessionId}'.` },
        { status: 404 }
      );
    }

    const response: UpdateStatusResponse = {
      success: true,
      updatedNode: result.updatedNode,
      notes: notes || undefined,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API /api/session/update] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error while updating node status.' },
      { status: 500 }
    );
  }
}
