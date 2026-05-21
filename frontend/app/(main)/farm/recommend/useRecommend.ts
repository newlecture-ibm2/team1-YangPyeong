/* ════════════════════════════════════════════════════════
   AI 추천 리스트 페이지 — 커스텀 훅
   농장 선택, 분석 요청, 결과 상태 관리
   ════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useMemo } from 'react';
import { stepIndexFromElapsed } from './_lib/analyzeSteps';
import { useMyFarms } from '../useFarm';
import { getLatestRecommendHistory, requestCropRecommendation } from './_lib/recommend.api';
import type { CropRecommendResponse } from './_lib/recommend.types';
import { sanitizeRecommendResponse } from './_lib/recommend.utils';
import { useToast } from '@/components/common/Toast/ToastContext';

export default function useRecommend() {
  const { farms: allFarms, isLoading: isFarmsLoading } = useMyFarms();
  const [selectedFarmIdx, setSelectedFarmIdx] = useState(0);
  const [result, setResult] = useState<CropRecommendResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStepIndex, setAnalyzeStepIndex] = useState(0);
  const [isHydrating, setIsHydrating] = useState(false);
  const analyzeStartedAt = useRef<number | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const farms = allFarms.filter((f) => f.certificationStatus === 'APPROVED');
  const hasUnapprovedFarms = allFarms.length > farms.length;

  const farm = farms.length > 0 ? farms[selectedFarmIdx] : null;
  const hasResult = result != null;

  useEffect(() => {
    try {
      const savedFarmIdStr = sessionStorage.getItem('selected_farm_id');
      if (savedFarmIdStr && farms.length > 0) {
        const savedFarmId = Number(savedFarmIdStr);
        const idx = farms.findIndex((f) => f.id === savedFarmId);
        if (idx !== -1) {
          setSelectedFarmIdx(idx);
        }
      }
    } catch {
      // ignore
    }
  }, [farms]);

  useEffect(() => {
    setResult(null);
  }, [selectedFarmIdx]);

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
          const sanitized = sanitizeRecommendResponse(data);
          setResult(sanitized);
          try {
            sessionStorage.setItem('recommend_result', JSON.stringify(sanitized));
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

  useEffect(() => {
    if (!isAnalyzing) {
      analyzeStartedAt.current = null;
      setAnalyzeStepIndex(0);
      return;
    }

    analyzeStartedAt.current = Date.now();
    const tick = () => {
      const start = analyzeStartedAt.current;
      if (start == null) return;
      setAnalyzeStepIndex(stepIndexFromElapsed(Date.now() - start));
    };
    tick();
    const id = window.setInterval(tick, 800);
    return () => window.clearInterval(id);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!farm?.id) return;
    setIsAnalyzing(true);
    setAnalyzeStepIndex(0);

    try {
      const data = sanitizeRecommendResponse(await requestCropRecommendation(farm.id));

      setResult(data);

      try {
        sessionStorage.setItem('recommend_result', JSON.stringify(data));
      } catch {
        // ignore
      }
      toastSuccess('AI 작물 추천이 완료되었습니다.');
    } catch (err) {
      console.error('AI 분석 실패:', err);
      toastError('AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentCropAdvices = result?.currentCropAdvices ?? [];
  const newRecommendations = result?.recommendations ?? [];
  const top3 = newRecommendations.slice(0, 3);
  const allRecs = newRecommendations;

  return {
    farms,
    hasUnapprovedFarms,
    isFarmsLoading,
    selectedFarmIdx,
    setSelectedFarmIdx,
    farm,
    result,
    hasResult,
    isAnalyzing,
    analyzeStepIndex,
    isHydrating,
    handleAnalyze,
    top3,
    allRecs,
    currentCropAdvices,
    recommendMode: result?.recommendMode,
  };
}
