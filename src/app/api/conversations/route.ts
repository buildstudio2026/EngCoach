import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const { conversationId, userAnswer, userId } = await request.json();

    const conversation = await storage.updateConversation(conversationId, userAnswer);
    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const expressions = await storage.getExpressions(userId);
    for (const exp of expressions) {
      const expLower = exp.expression.toLowerCase();
      const answerLower = userAnswer.toLowerCase();
      
      let isMastered = false;
      
      // If it's a short phrase (3 words or less), use direct inclusion check
      const expWords = exp.expression.split(/\s+/).filter(w => w.length > 0);
      if (expWords.length <= 3) {
        isMastered = answerLower.includes(expLower);
      } else {
        // For longer sentences, check if most words (e.g. 70%) appear in the answer
        // This allows for slight variations in the sentence.
        const foundWords = expWords.filter(word => 
          answerLower.includes(word.toLowerCase().replace(/[.,!?;:]/g, ''))
        );
        isMastered = foundWords.length / expWords.length >= 0.7;
      }

      if (isMastered) {
        await storage.updateExpression(exp.id, {
          mastery: Math.min((exp.mastery || 0) + 1, 3), // Cap at 3 levels
          lastUsed: new Date().toISOString()
        });
      }
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to log answer', details: error.message }, { status: 500 });
  }
}
