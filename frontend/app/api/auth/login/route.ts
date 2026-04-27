/* ════════════════════════════════════════════════════════
   BFF API Route — 로그인
   POST /api/auth/login → Spring Boot /api/auth/login
   
   로그인 성공 시 백엔드에서 받은 JWT를 암호화하여
   httpOnly 쿠키에 저장합니다.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { setSessionCookie } from '@/lib/cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 백엔드 로그인 API 호출
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok || !data.success) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // JWT를 암호화하여 httpOnly 쿠키에 저장
    const { accessToken, refreshToken } = data.data;
    await setSessionCookie(accessToken, refreshToken);

    // 클라이언트에는 JWT 원문을 전달하지 않음 (보안)
    return NextResponse.json({
      success: true,
      data: { message: '로그인 성공' },
      error: null,
    });
  } catch (error) {
    console.error('[BFF] 로그인 실패:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'LOGIN_ERROR', message: '로그인 처리 중 오류가 발생했습니다.' },
      },
      { status: 500 },
    );
  }
}
