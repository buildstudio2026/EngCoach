import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'test-user';

  try {
    const allConversations = await storage.getConversations(userId);
    const latestConversations = allConversations.filter((c: any) => 
      c.userAnswer === null
    ).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 10);
    
    return NextResponse.json(latestConversations.reverse());
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 });
  }
}
