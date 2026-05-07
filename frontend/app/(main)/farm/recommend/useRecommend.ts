/* ════════════════════════════════════════════════════════
   AI 추천 리스트 페이지 — 커스텀 훅
   농장 선택, 분석 요청, 결과 상태 관리
   ════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react';
import { useMyFarms } from '../useFarm';
import { getMockRecommendResponse } from './_lib/recommend.mock';
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
    if (!farm) return;
    setIsAnalyzing(true);

    try {
      // TODO: 실제 API 연동 시 여기를 교체
      // const data = await requestCropRecommendation(farm.id);
      await new Promise((r) => setTimeout(r, 2000));
      const data = getMockRecommendResponse(farm.id, farm.name);

      setResult(data);
      setHasAnalyzed(true);
    } catch (err) {
      console.error('AI 분석 실패:', err);
      // TODO: 에러 상태를 UI에 표시
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
