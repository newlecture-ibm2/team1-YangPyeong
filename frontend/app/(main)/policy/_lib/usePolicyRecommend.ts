import { useState, useEffect } from 'react';
import type { PolicyRecommendResponse } from './policy.types';

/** 클라이언트 쿠키에서 인증 세션 존재 여부 확인 */
function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('fb-session=');
}

export function usePolicyRecommend() {
  const [data, setData] = useState<PolicyRecommendResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number>(200);

  useEffect(() => {
    // 비회원이면 API 호출 없이 즉시 미리보기 모드 진입
    if (!isAuthenticated()) {
      setStatusCode(401);
      setIsLoading(false);
      return;
    }

    async function fetchRecommend() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/proxy/policies/recommend/me', {
          credentials: 'include',
          cache: 'no-store'
        });
        
        setStatusCode(res.status);

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('로그인이 필요합니다.');
          }
          if (res.status === 403) {
            throw new Error('접근 권한이 없습니다.');
          }
          throw new Error('추천 데이터를 불러오는데 실패했습니다.');
        }

        const json = await res.json();
        if (json.success) {
          if (!json.data || !json.data.farmerProfile) {
            setStatusCode(403);
            throw new Error('농업인 계정에서 이용할 수 있는 기능입니다.');
          }
          setData(json.data);
        } else {
          throw new Error(json.error?.message || '데이터 구조 오류');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommend();
  }, []);

  return { data, isLoading, error, statusCode };
}
