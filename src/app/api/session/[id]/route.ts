import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/db/sessionStore';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required.' },
        { status: 400 }
      );
    }

    const session = sessionStore.getSession(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: `Session '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('[API /api/session/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error while retrieving session.' },
      { status: 500 }
    );
  }
}
