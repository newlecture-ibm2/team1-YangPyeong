/* ════════════════════════════════════════════════════════
   BFF API Route — 비밀번호 변경
   PUT /api/users/me/password → Spring Boot /api/users/me/password
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();

    if (!session?.token) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/users/me/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 비밀번호 변경 실패:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'PASSWORD_CHANGE_ERROR', message: '비밀번호 변경 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
