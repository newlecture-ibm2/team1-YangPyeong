/* ════════════════════════════════════════════════════════
   FarmBalance — 클라이언트 사이드 API 유틸리티
   클라이언트 컴포넌트에서 BFF API Route를 호출합니다.
   ════════════════════════════════════════════════════════ */

import type { ApiResponse } from './constants';

/**
 * 클라이언트 컴포넌트에서 Next.js BFF API Route를 호출하는 함수
 * 쿠키가 자동으로 포함되므로 별도 토큰 관리 불필요
 *
 * @example
 * const result = await apiFetch<CropData[]>('/api/dashboard/crop-balance');
 * const result = await apiFetch<Seed>('/api/seeds', { method: 'POST', body: { cropId: 1 } });
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
      credentials: 'include',
    });

    // 401 Unauthorized 처리 (세션 만료 등)
    if (response.status === 401 && typeof window !== 'undefined' && !path.includes('/api/auth/login')) {
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/login';
    }

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
