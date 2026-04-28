import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id') || '9040';
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND_URL}/api/gov/me?${searchParams.toString()}`, { 
      headers: { 'X-USER-ID': userId },
      cache: 'no-store' 
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
