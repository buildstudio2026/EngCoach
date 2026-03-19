import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { openai, PROMPTS } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { userId, date } = await request.json();
    const targetDate = date ? new Date(date) : new Date();

    const allConversations = await storage.getConversations(userId);
    const conversations = allConversations
      .filter((c: any) => {
        if (c.userAnswer === null) return false;
        
        const convDate = new Date(c.createdAt);
        return convDate.getFullYear() === targetDate.getFullYear() &&
               convDate.getMonth() === targetDate.getMonth() &&
               convDate.getDate() === targetDate.getDate();
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 25);

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'No practice completed yet' }, { status: 400 });
    }

    const sentences = conversations.map((c: any) => c.userAnswer as string);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an English conversation expert.' },
        { role: 'user', content: PROMPTS.ANALYZE_CONVERSATION(sentences) },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const { suggestions } = JSON.parse(content);

    const savedSuggestions = await Promise.all(
      suggestions.map((s: { expression: string; type: string }) =>
        storage.addSuggestion(userId, s)
      )
    );

    return NextResponse.json(savedSuggestions);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze conversation', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    try {
        const suggestions = await storage.getSuggestions(userId);
        const sorted = [...suggestions].sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 10);
        return NextResponse.json(sorted);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch suggestions', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await storage.deleteSuggestion(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete suggestion', details: error.message }, { status: 500 });
  }
}
