/* ════════════════════════════════════════════════════════
   AI 추천 리스트 페이지 — 커스텀 훅
   농장 선택, 분석 요청, 결과 상태 관리
   ════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react';
import { useMyFarms } from '../useFarm';
import { requestCropRecommendation } from './_lib/recommend.api';
import type { CropRecommendResponse } from './_lib/recommend.types';

export default function useRecommend() {
  const { farms, isLoading: isFarmsLoading } = useMyFarms();
  const [selectedFarmIdx, setSelectedFarmIdx] = useState(0);
  const [result, setResult] = useState<CropRecommendResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const farm = farms.length > 0 ? farms[selectedFarmIdx] : null;

  // 농장 선택 변경 시 결과 초기화
  useEffect(() => {
    setResult(null);
    setHasAnalyzed(false);
  }, [selectedFarmIdx]);

  const handleAnalyze = async () => {
    if (!farm || !farm.id) return;
    setIsAnalyzing(true);

    try {
      const data = await requestCropRecommendation(farm.id);

      setResult(data);
      setHasAnalyzed(true);

      // 상세 페이지에서 접근할 수 있도록 sessionStorage에 저장
      try {
        sessionStorage.setItem('recommend_result', JSON.stringify(data));
      } catch {
        // sessionStorage 접근 불가 시 무시
      }
    } catch (err) {
      console.error('AI 분석 실패:', err);
      alert('AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const top3 = result?.recommendations.slice(0, 3) || [];
  const allRecs = result?.recommendations || [];

  return {
    farms,
    isFarmsLoading,
    selectedFarmIdx,
    setSelectedFarmIdx,
    farm,
    result,
    isAnalyzing,
    hasAnalyzed,
    handleAnalyze,
    top3,
    allRecs,
  };
}
