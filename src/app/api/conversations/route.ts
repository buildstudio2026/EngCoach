import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const { conversationId, userAnswer } = await request.json();

    const conversation = storage.updateConversation(conversationId, userAnswer);
    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const expressions = storage.getExpressions().filter((e: any) => e.userId === conversation.userId);

    for (const exp of expressions) {
      if (userAnswer.toLowerCase().includes(exp.expression.toLowerCase())) {
        storage.updateExpression(exp.id, {
          mastery: (exp.mastery || 0) + 1,
          lastUsed: new Date().toISOString()
        });
      }
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to log answer', details: error.message }, { status: 500 });
  }
}
