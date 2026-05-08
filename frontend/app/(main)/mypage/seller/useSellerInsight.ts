'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SellerProduct } from '../_lib/mypage.types';

const INSIGHT_CACHE_KEY = 'seller-insight-cache';

interface InsightCache {
  date: string;
  insight: string;
}

export default function useSellerInsight(products: SellerProduct[]) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async (forceRefresh = false) => {
    if (!products || products.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    // 캐시 확인 로직
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(INSIGHT_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as InsightCache;
          // 같은 날짜이면 캐시된 인사이트 반환
          if (parsed.date === today && parsed.insight) {
            setInsight(parsed.insight);
            return;
          }
        }
      } catch (e) {
        // JSON 파싱 에러 등 무시
      }
    }

    setLoading(true);
    setError(null);
    try {
      // AI 서버 요청에 필요한 필수 필드만 추출
      const payload = products.map((p) => ({
        name: p.name,
        price: p.price,
        stock: p.stock,
        salesCount: p.salesCount,
        status: p.status,
      }));

      const res = await fetch('/api/ai/product-assist/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payload }),
      });
      const data = await res.json();

      if (data.success && data.data?.insight) {
        setInsight(data.data.insight);
        // 캐시 업데이트
        localStorage.setItem(
          INSIGHT_CACHE_KEY,
          JSON.stringify({ date: today, insight: data.data.insight })
        );
      } else {
        setError(data.error?.message || '인사이트를 생성하지 못했습니다.');
      }
    } catch (err) {
      setError('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [products]);

  // 상품 목록 로드가 완료된 후에만 한 번 호출되도록 함
  useEffect(() => {
    if (products.length > 0) {
      fetchInsight();
    }
  }, [products, fetchInsight]);

  const refreshInsight = () => fetchInsight(true);

  return { insight, loading, error, refreshInsight };
}
