import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'test-user';
    const expressions = storage.getExpressions().filter((e: any) => e.userId === userId);
    // Sort by createdAt desc
    const sorted = [...expressions].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json(sorted);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch expressions', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { expression, meaning, explanation, type, userId, priority = 2, createdAt } = await request.json();
    const newExpression = storage.addExpression({
      expression,
      meaning,
      explanation,
      type,
      userId,
      priority,
      createdAt
    });
    return NextResponse.json(newExpression);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create expression', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    storage.deleteExpression(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete expression', details: error.message }, { status: 500 });
  }
}
