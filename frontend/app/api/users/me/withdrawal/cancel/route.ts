/* ════════════════════════════════════════════════════════
   BFF — 탈퇴 유예 취소
   POST /api/users/me/withdrawal/cancel → Spring Boot 동일 경로
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

export async function POST(_request: NextRequest) {
  try {
    const session = await getSessionFromCookie();

    if (!session?.token) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/users/me/withdrawal/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[BFF] 탈퇴 유예 취소 실패:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'WITHDRAWAL_CANCEL_ERROR', message: '탈퇴 취소 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
