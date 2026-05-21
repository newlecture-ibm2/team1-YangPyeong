/* ════════════════════════════════════════════════════════
   BFF Proxy — 공통 프록시 핸들러
   
   모든 API Route에서 공유하는 프록시 유틸리티.
   클라이언트 요청을 받아 백엔드로 전달하고 응답을 반환합니다.
   ════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { getSessionFromCookie } from '@/lib/cookie';

interface ProxyOptions {
  /** 인증 토큰을 자동으로 첨부할지 여부 (기본: true) */
  withAuth?: boolean;
}

/**
 * 클라이언트 요청을 Spring Boot 백엔드로 프록시합니다.
 *
 * @param request - Next.js Request 객체
 * @param backendPath - 백엔드 API 경로 (예: '/api/users/me')
 * @param options - 프록시 옵션
 *
 * @example
 * // app/api/users/me/route.ts
 * export async function GET(request: NextRequest) {
 *   return proxyToBackend(request, '/api/users/me');
 * }
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options: ProxyOptions = {},
) {
  const { withAuth = true } = options;

  // ── 헤더 구성 ──
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  // 원본 요청의 헤더 중 필요한 것만 전달
  const forwardHeaders = ['accept-language', 'user-agent'];
  for (const key of forwardHeaders) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  // ── 인증 토큰 첨부 ──
  if (withAuth) {
    const session = await getSessionFromCookie();
    if (session?.token) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
  }

  // ── 요청 본문 추출 ──
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const json = await request.json();
      body = JSON.stringify(json);
    } catch {
      // body가 없는 POST 요청 허용
    }
  }

  // ── 쿼리스트링 전달 (중복 및 충돌 방지 병합) ──
  const clientUrl = new URL(request.url);
  const resolvedPath = backendPath.startsWith('/') ? backendPath : `/${backendPath}`;
  const targetUrl = new URL(`${BACKEND_URL}${resolvedPath}`);
  
  // 클라이언트 요청의 쿼리 스트링 파라미터를 타겟 백엔드 URL에 덮어쓰기 병합
  clientUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });
  
  const backendUrl = targetUrl.toString();
  console.log(`[BFF Proxy] Requesting to: ${backendUrl}`);

  try {
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const text = await backendResponse.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error(`[BFF Proxy] ${request.method} ${backendUrl} 실패:`, error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'PROXY_ERROR',
          message: '백엔드 서버에 연결할 수 없습니다.',
        },
      },
      { status: 502 },
    );
  }
}
