/* ════════════════════════════════════════════════════════
   BFF API Route — 구글 소셜 로그인
   POST /api/auth/social-login/google
   
   1. auth code → access token 교환
   2. backend /api/auth/social-login 호출
   3. JWT를 httpOnly 쿠키에 저장
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { setSessionCookie } from '@/lib/cookie';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    // 1. 구글 auth code → access token 교환
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        code,
      }),
      cache: 'no-store',
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[BFF] 구글 토큰 교환 실패:', tokenData);
      return NextResponse.json(
        { success: false, data: null, error: { code: 'GOOGLE_TOKEN_ERROR', message: '구글 인증에 실패했습니다.' } },
        { status: 401 },
      );
    }

    // 2. 백엔드 소셜 로그인 API 호출
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/social-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'GOOGLE',
        accessToken: tokenData.access_token,
      }),
      cache: 'no-store',
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok || !backendData.success) {
      return NextResponse.json(backendData, { status: backendRes.status });
    }

    // 3. JWT를 httpOnly 쿠키에 저장
    const { accessToken, refreshToken } = backendData.data;
    await setSessionCookie(accessToken, refreshToken);

    const response = NextResponse.json({
      success: true,
      data: { message: '구글 로그인 성공' },
      error: null,
    });

    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      response.cookies.set('fb-user', JSON.stringify({
        email: payload.email || payload.sub || '',
        role: payload.role || 'USER',
      }), { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
    }

    return response;
  } catch (error) {
    console.error('[BFF] 구글 소셜 로그인 실패:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'SOCIAL_LOGIN_ERROR', message: '소셜 로그인 처리 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
