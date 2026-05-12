import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });
    // 10초간 브라우저 캐시 → 30초 폴링 중 불필요한 서버 왕복 감소
    response.headers.set('Cache-Control', 'private, max-age=10');
    return response;
  } catch (error) {
    console.error('BFF /api/notifications/unread-count GET error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
