import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/cookie';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8080';
    const cookieHeader = req.headers.get('cookie');
    
    const response = await fetch(`${backendUrl}/api/admin/data/graph-refresh`,  {
      method: "POST",
      headers: cookieHeader ? { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'cookie': cookieHeader } : {}
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "백엔드 연결 실패" }, { status: 500 });
  }
}
