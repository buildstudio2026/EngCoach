import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { openai, PROMPTS } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    const allExpressions = await storage.getExpressions(userId);
    
    // Pick 30 expressions (randomly or by mastery)
    const expressions = allExpressions
      .sort(() => 0.5 - Math.random()) // Random shuffle
      .slice(0, 30);

    if (expressions.length === 0) {
        return NextResponse.json({ error: 'No expressions found' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional English language tutor.' },
        { role: 'user', content: PROMPTS.GENERATE_REVIEW_QUIZ(expressions) },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');
    
    const { quizzes } = JSON.parse(content);

    return NextResponse.json({ quizzes });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz', details: error.message }, { status: 500 });
  }
}
