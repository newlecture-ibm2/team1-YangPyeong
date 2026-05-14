'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { type SellerProduct, PRODUCT_STATUS_MAP } from '../_lib/mypage.types';

const INSIGHT_CACHE_KEY = 'seller-insight-cache';

interface InsightCache {
  date: string;
  insight: string;
}

export default function useSellerInsight(products: SellerProduct[]) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const initialLoaded = useRef<boolean>(false);

  // 상품 데이터의 실질적 변경을 감지하기 위한 안정적인 핑거프린트
  const productsFingerprint = useMemo(() => {
    if (!products || products.length === 0) return '';
    return products
      .map(p => `${p.id}:${p.name}:${p.price}:${p.stock}:${p.status}:${p.salesCount}`)
      .sort()
      .join('|');
  }, [products]);

  // 초기 로드 시점의 핑거프린트를 저장
  const initialFingerprint = useRef<string>('');

  const fetchInsight = useCallback(async (forceRefresh = false) => {
    if (!products || products.length === 0) return;

    if (forceRefresh) {
      setIsStale(false);
      // 새로고침 시 현재 핑거프린트를 기준점으로 갱신
      initialFingerprint.current = productsFingerprint;
    }

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
        status: PRODUCT_STATUS_MAP[p.status]?.label || p.status,
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
  }, [products, productsFingerprint]);

  // 초기 로드: 상품이 처음 들어왔을 때 한 번만 인사이트 생성
  useEffect(() => {
    if (productsFingerprint && !initialLoaded.current) {
      initialFingerprint.current = productsFingerprint;
      fetchInsight();
      initialLoaded.current = true;
    }
  }, [productsFingerprint, fetchInsight]);

  // 데이터 변경 감지: 핑거프린트가 초기 시점과 달라졌을 때만 stale 처리
  useEffect(() => {
    if (
      initialLoaded.current &&
      initialFingerprint.current &&
      productsFingerprint &&
      productsFingerprint !== initialFingerprint.current
    ) {
      setIsStale(true);
    }
  }, [productsFingerprint]);

  const refreshInsight = () => fetchInsight(true);

  return { insight, loading, error, isStale, refreshInsight };
}
