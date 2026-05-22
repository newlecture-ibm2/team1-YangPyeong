import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants';
import { safeJsonParse } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

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
      cache: 'no-store',
    });

    const data = await safeJsonParse(res, '/notifications/unread-count');
    if (!data) {
      // 401/403 등 인증 관련 응답은 원래 status 유지
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: res.status });
      }
      return NextResponse.json(
        { message: '백엔드 응답을 처리할 수 없습니다.' },
        { status: 502 },
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('BFF /api/notifications/unread-count GET error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
