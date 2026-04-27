/* ════════════════════════════════════════════════════════
   FarmBalance — BFF API 클라이언트
   Next.js 서버 → Spring Boot 백엔드 통신 유틸리티
   
   모든 백엔드 API 호출은 이 모듈을 통해 수행합니다.
   ─ 서버 컴포넌트: backendFetch() 직접 호출
   ─ 클라이언트 컴포넌트: /api/* Route Handler를 통해 간접 호출
   ════════════════════════════════════════════════════════ */

import { BACKEND_URL, type ApiResponse } from './constants';
import { getSessionFromCookie } from './cookie';

/* ────────────────────────────────────────────────────── */
/*  1. 서버 사이드 전용 — 백엔드 직접 호출                   */
/* ────────────────────────────────────────────────────── */

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** 쿠키에서 JWT를 자동 추출하여 Authorization 헤더에 첨부할지 여부 */
  withAuth?: boolean;
  /** 캐시 설정 (기본: no-store) */
  revalidate?: number | false;
}

/**
 * 서버 사이드에서 Spring Boot 백엔드를 호출하는 핵심 함수
 * 
 * @example
 * // 서버 컴포넌트에서
 * const result = await backendFetch<CropData[]>('/api/dashboard/crop-balance');
 * 
 * // 인증이 필요한 API
 * const myData = await backendFetch<UserProfile>('/api/users/me', { withAuth: true });
 * 
 * // POST 요청
 * const created = await backendFetch<Seed>('/api/seeds', {
 *   method: 'POST',
 *   withAuth: true,
 *   body: { cropId: 1, quantity: 100 },
 * });
 */
export async function backendFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { body, withAuth = false, revalidate, ...fetchOptions } = options;

  // 헤더 구성
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && body) {
    headers.set('Content-Type', 'application/json');
  }

  // 인증 토큰 자동 첨부
  if (withAuth) {
    const session = await getSessionFromCookie();
    if (session?.token) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
  }

  // 요청 URL 구성
  const url = `${BACKEND_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: revalidate === false ? 'no-store' : undefined,
      next: typeof revalidate === 'number' ? { revalidate } : undefined,
    });

    // JSON 파싱
    const data: ApiResponse<T> = await response.json();

    // 백엔드 에러 응답 처리
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: data.error || {
          code: `HTTP_${response.status}`,
          message: response.statusText,
        },
      };
    }

    return data;
  } catch (error) {
    // 네트워크 에러 등
    console.error(`[BFF] backendFetch 실패: ${url}`, error);
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : '백엔드 서버에 연결할 수 없습니다.',
      },
    };
  }
}

/* ────────────────────────────────────────────────────── */
/*  2. 클라이언트 사이드 전용 — BFF API Route 호출          */
/* ────────────────────────────────────────────────────── */

/**
 * 클라이언트 컴포넌트에서 Next.js BFF API Route를 호출하는 함수
 * 쿠키가 자동으로 포함되므로 별도 토큰 관리 불필요
 * 
 * @example
 * // 클라이언트 컴포넌트에서
 * const result = await apiFetch<CropData[]>('/api/dashboard/crop-balance');
 * 
 * // POST 요청
 * const result = await apiFetch<Seed>('/api/seeds', {
 *   method: 'POST',
 *   body: { cropId: 1, quantity: 100 },
 * });
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body } = options;

  try {
    const response = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // 쿠키 자동 포함
    });

    return await response.json();
  } catch (error) {
    console.error(`[Client] apiFetch 실패: ${path}`, error);
    return {
      success: false,
      data: null,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : '요청에 실패했습니다.',
      },
    };
  }
}
