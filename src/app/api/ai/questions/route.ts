import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsWithGemini } from '@/lib/ai/gemini';
import { QuestionsRequest, QuestionsResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: QuestionsRequest = await request.json();

    if (!body || typeof body.idea !== 'string' || !body.idea.trim()) {
      return NextResponse.json(
        { error: 'Invalid payload: "idea" is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const questions = await generateQuestionsWithGemini(body.idea.trim());
    const response: QuestionsResponse = { questions };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /api/ai/questions] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while generating questions.' },
      { status: 500 }
    );
  }
}
