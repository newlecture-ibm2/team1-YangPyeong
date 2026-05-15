/* ════════════════════════════════════════════════════════
   AI 추천 리스트 페이지 — 커스텀 훅
   농장 선택, 분석 요청, 결과 상태 관리
   ════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react';
import { useMyFarms } from '../useFarm';
import { getLatestRecommendHistory, requestCropRecommendation } from './_lib/recommend.api';
import type { CropRecommendResponse } from './_lib/recommend.types';
import { useToast } from '@/components/common/Toast/ToastContext';

export default function useRecommend() {
  const { farms: allFarms, isLoading: isFarmsLoading } = useMyFarms();
  const [selectedFarmIdx, setSelectedFarmIdx] = useState(0);
  const [result, setResult] = useState<CropRecommendResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const farms = allFarms.filter(f => f.certificationStatus === 'APPROVED');
  const hasUnapprovedFarms = allFarms.length > farms.length;

  const farm = farms.length > 0 ? farms[selectedFarmIdx] : null;

  // 농장 선택 변경 시 결과 초기화
  useEffect(() => {
    setResult(null);
    setHasAnalyzed(false);
  }, [selectedFarmIdx]);

  // 서버에 저장된 최근 추천 1건으로 목록 복원 (상세에서 돌아올 때 재분석 불필요)
  useEffect(() => {
    const farmId = farm?.id;
    if (farmId == null) {
      setIsHydrating(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsHydrating(true);
      try {
        const data = await getLatestRecommendHistory(farmId);
        if (cancelled) return;
        if (data?.farmInfo?.id != null && data.farmInfo.id !== farmId) return;
        if (data) {
          setResult(data);
          setHasAnalyzed(true);
          try {
            sessionStorage.setItem('recommend_result', JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.error('최근 AI 추천 이력 복원 실패:', e);
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [farm?.id]);

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
      toastSuccess('AI 작물 추천이 완료되었습니다.');
    } catch (err) {
      console.error('AI 분석 실패:', err);
      toastError('AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const top3 = result?.recommendations.slice(0, 3) || [];
  const allRecs = result?.recommendations || [];

  return {
    farms,
    hasUnapprovedFarms,
    isFarmsLoading,
    selectedFarmIdx,
    setSelectedFarmIdx,
    farm,
    result,
    isAnalyzing,
    isHydrating,
    hasAnalyzed,
    handleAnalyze,
    top3,
    allRecs,
  };
}
