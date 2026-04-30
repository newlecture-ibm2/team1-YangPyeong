'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PolicyItem, PolicySearchParams, PageResponse } from './policy.types';
import { fetchPolicies } from './policy.api';

interface UsePolicyListReturn {
  policies: PolicyItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  searchParams: PolicySearchParams;
  setSearchParams: (params: Partial<PolicySearchParams>) => void;
  goToPage: (page: number) => void;
  refresh: () => void;
}

/**
 * 정책 목록 조회 Hook
 * 검색 파라미터 변경 시 자동으로 API를 호출합니다.
 */
export function usePolicyList(initialParams?: Partial<PolicySearchParams>): UsePolicyListReturn {
  const [searchParams, setSearchParamsState] = useState<PolicySearchParams>({
    keyword: '',
    regionCode: '',
    category: '',
    period: '',
    page: 0,
    size: 10,
    ...initialParams,
  });

  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchPolicies(searchParams);

    if (result.success && result.data) {
      const pageData = result.data as PageResponse<PolicyItem>;
      setPolicies(pageData.content);
      setTotalCount(pageData.totalCount);
      setTotalPages(pageData.totalPages);
    } else {
      setError(result.error?.message || '정책 목록을 불러올 수 없습니다.');
      setPolicies([]);
      setTotalCount(0);
      setTotalPages(0);
    }

    setIsLoading(false);
  }, [searchParams]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const setSearchParams = useCallback((params: Partial<PolicySearchParams>) => {
    setSearchParamsState((prev) => ({
      ...prev,
      ...params,
      // 필터 변경 시 첫 페이지로 이동 (page 파라미터가 명시적으로 전달되지 않은 경우)
      page: 'page' in params ? (params.page ?? 0) : 0,
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setSearchParamsState((prev) => ({ ...prev, page }));
  }, []);

  return {
    policies,
    totalCount,
    totalPages,
    currentPage: searchParams.page ?? 0,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    goToPage,
    refresh: loadPolicies,
  };
}
