/* ════════════════════════════════════════════════════════
   BFF API Route — 사용자 프로필
   GET  /api/users/me → Spring Boot /api/users/me (프로필 조회)
   PUT  /api/users/me → Spring Boot /api/users/me (프로필 수정)
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

/** 공통: 세션에서 JWT 추출 후 백엔드 호출 */
async function proxyToBackend(request: NextRequest, method: string, body?: unknown) {
  const session = await getSessionFromCookie();

  if (!session?.token) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
      { status: 401 },
    );
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${session.token}`,
    'Content-Type': 'application/json',
  };

  const backendResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}

/** GET /api/users/me — 프로필 조회 */
export async function GET(request: NextRequest) {
  try {
    return await proxyToBackend(request, 'GET');
  } catch (error) {
    console.error('[BFF] 프로필 조회 실패:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'PROFILE_FETCH_ERROR', message: '프로필 조회 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}

/** PUT /api/users/me — 프로필 수정 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    return await proxyToBackend(request, 'PUT', body);
  } catch (error) {
    console.error('[BFF] 프로필 수정 실패:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'PROFILE_UPDATE_ERROR', message: '프로필 수정 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
