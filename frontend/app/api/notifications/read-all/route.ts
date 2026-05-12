import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants';

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('BFF /api/notifications/read-all PATCH error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
