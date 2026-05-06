import type { PolicyItem, PolicySearchParams, PageResponse } from './policy.types';
import type { ApiResponse } from '@/lib/constants';

/**
 * 정책 목록 API 호출 함수
 * BFF Proxy를 통해 백엔드 GET /api/policies 호출
 */
export async function fetchPolicies(
  params: PolicySearchParams
): Promise<ApiResponse<PageResponse<PolicyItem>>> {
  const query = new URLSearchParams();

  if (params.keyword) query.set('keyword', params.keyword);
  if (params.regionCode) query.set('regionCode', params.regionCode);
  if (params.category) query.set('category', params.category);
  if (params.period) query.set('period', params.period);
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 10));

  const url = `/api/proxy/policies?${query.toString()}`;

  try {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
    });

    return await response.json();
  } catch (error) {
    console.error('[Policy] fetchPolicies 실패:', error);
    return {
      success: false,
      data: null,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : '정책 목록을 불러올 수 없습니다.',
      },
    };
  }
}
