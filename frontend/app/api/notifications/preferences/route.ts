import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/** GET /api/notifications/preferences — 알림 수신 설정 조회 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/notifications/preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('BFF /api/notifications/preferences GET error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/** PATCH /api/notifications/preferences — 알림 수신 설정 업데이트 */
export async function PATCH(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/notifications/preferences`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('BFF /api/notifications/preferences PATCH error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
