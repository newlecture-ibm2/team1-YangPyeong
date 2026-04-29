import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  if (!session?.token) return NextResponse.json({ success: false, error: { message: '인증이 필요합니다.' } }, { status: 401 });
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND_URL}/api/gov/download/history?${searchParams.toString()}`, { 
      headers: { 'Authorization': `Bearer ${session.token}` },
      cache: 'no-store' 
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
