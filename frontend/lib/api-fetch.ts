/* ════════════════════════════════════════════════════════
   FarmBalance — 클라이언트 사이드 API 유틸리티
   클라이언트 컴포넌트에서 BFF API Route를 호출합니다.
   ════════════════════════════════════════════════════════ */

import type { ApiResponse } from './constants';
import {
  LOGIN_EXPECTED_ERROR_CODES,
  shouldWarnExpectedLoginError,
} from './auth-errors';

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  /** UI에서 처리하는 예상 error.code — console.error 생략 */
  expectedErrorCodes?: readonly string[];
  /** dev에서 403/429 등 예상 실패 시 console.warn */
  warnExpectedErrorsInDev?: boolean;
  /** true면 401 세션 만료 redirect 비활성 */
  skipSessionRedirect?: boolean;
}

const AUTH_LOGIN_PATH = '/api/auth/login';

/**
 * 클라이언트 컴포넌트에서 Next.js BFF API Route를 호출하는 함수
 * 쿠키가 자동으로 포함되므로 별도 토큰 관리 불필요
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    expectedErrorCodes = [],
    warnExpectedErrorsInDev = false,
    skipSessionRedirect = false,
  } = options;

  try {
    const response = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    const data = (await response.json()) as ApiResponse<T>;
    const errorCode = data.error?.code;
    const isExpected = errorCode != null && expectedErrorCodes.includes(errorCode);

    // 세션 만료 등 — 로그인 API·skipSessionRedirect 제외
    const isLoginPath = path.includes(AUTH_LOGIN_PATH);
    if (
      !skipSessionRedirect
      && !isLoginPath
      && response.status === 401
      && typeof window !== 'undefined'
      && !isExpected
    ) {
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.dispatchEvent(new Event('auth-changed'));
      window.location.href = '/login';
    }

    if (
      warnExpectedErrorsInDev
      && process.env.NODE_ENV === 'development'
      && !data.success
      && isExpected
      && (shouldWarnExpectedLoginError(errorCode) || !response.ok)
    ) {
      console.warn(`[Client] 예상 가능한 API 실패 (${response.status}): ${path}`, errorCode);
    }

    return data;
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

/** 로그인 전용 fetch — 예상 가능한 인증 실패는 UI만 처리 */
export function loginFetch(body: { email: string; password: string }) {
  return apiFetch<{ message: string }>(AUTH_LOGIN_PATH, {
    method: 'POST',
    body,
    expectedErrorCodes: LOGIN_EXPECTED_ERROR_CODES,
    warnExpectedErrorsInDev: true,
    skipSessionRedirect: true,
  });
}
