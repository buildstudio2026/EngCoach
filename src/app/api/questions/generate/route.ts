import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { openai, PROMPTS } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    const allExpressions = await storage.getExpressions(userId);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const expressions = allExpressions.filter((e: any) => 
      new Date(e.createdAt) >= sevenDaysAgo
    ).sort((a: any, b: any) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.mastery - b.mastery;
    }).slice(0, 5);

    const expressionTexts = expressions.map((e: any) => e.expression);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful English conversation coach.' },
        { role: 'user', content: PROMPTS.GENERATE_QUESTIONS(expressionTexts) },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');
    
    const { questions } = JSON.parse(content);

    const savedConversations = await Promise.all(
      questions.map((q: { question: string, meaning: string, example: string, targetExpression: string }) =>
        storage.addConversation(userId, q.question, q.meaning, q.example, q.targetExpression)
      )
    );

    return NextResponse.json({ success: true, count: savedConversations.length });
  } catch (error: any) {
    console.error('Question generation error:', error);
    return NextResponse.json({ error: 'Failed to generate questions', details: error.message }, { status: 500 });
  }
}
