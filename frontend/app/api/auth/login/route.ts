/* ════════════════════════════════════════════════════════
   BFF API Route — 로그인
   POST /api/auth/login → Spring Boot /api/auth/login
   
   로그인 성공 시 백엔드에서 받은 JWT를 암호화하여
   httpOnly 쿠키에 저장합니다.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { setSessionCookie } from '@/lib/cookie';

/** JWT payload에서 사용자 정보 추출 (서명 검증 없이 payload만 디코딩) */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

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

    // JWT에서 사용자 정보 추출 → 클라이언트 읽기용 쿠키 저장
    const payload = decodeJwtPayload(accessToken);
    const response = NextResponse.json({
      success: true,
      data: { message: '로그인 성공' },
      error: null,
    });

    if (payload) {
      // 클라이언트 읽기용 쿠키: 최소 정보만 저장 (email, role, name)
      response.cookies.set('fb-user', JSON.stringify({
        email: payload.email || payload.sub || '',
        role: payload.role || 'USER',
        name: payload.name || '',
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
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
