/* ════════════════════════════════════════════════════════
   AI 추천 리스트 페이지 — 커스텀 훅
   농장 선택, 분석 요청, 결과 상태 관리
   ════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { quickStepIndexFromElapsed } from './_lib/analyzeSteps';
import { useMyFarms } from '../useFarm';
import { getFarmDetail, updateFarm } from '../_lib/farm.api';
import { buildFarmAddressPayload } from './_lib/farmUpdatePayload';
import { getLatestRecommendHistory, requestCropRecommendation } from './_lib/recommend.api';
import type { CropRecommendResponse } from './_lib/recommend.types';
import { sanitizeRecommendResponse } from './_lib/recommend.utils';
import type { SoilFormValues } from './_components/SoilPanel/SoilPanel';
import { useToast } from '@/components/common/Toast/ToastContext';

function toSoilFormValues(source?: {
  soilPh?: number;
  organicMatter?: number;
  soilType?: string;
}): SoilFormValues {
  return {
    soilPh: source?.soilPh != null ? String(source.soilPh) : '',
    organicMatter: source?.organicMatter != null ? String(source.organicMatter) : '',
    soilType: source?.soilType ?? '',
  };
}

function soilValuesEqual(a: SoilFormValues, b: SoilFormValues): boolean {
  return a.soilPh === b.soilPh && a.organicMatter === b.organicMatter && a.soilType === b.soilType;
}

export default function useRecommend() {
  const { farms: allFarms, isLoading: isFarmsLoading } = useMyFarms();
  const [selectedFarmIdx, setSelectedFarmIdx] = useState(0);
  const [result, setResult] = useState<CropRecommendResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStepIndex, setAnalyzeStepIndex] = useState(0);
  const [isHydrating, setIsHydrating] = useState(false);
  const [soilValues, setSoilValues] = useState<SoilFormValues>({ soilPh: '', organicMatter: '', soilType: '' });
  const [savedSoilValues, setSavedSoilValues] = useState<SoilFormValues>({ soilPh: '', organicMatter: '', soilType: '' });
  const [isSavingSoil, setIsSavingSoil] = useState(false);
  const analyzeStartedAt = useRef<number | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const farms = allFarms.filter((f) => f.certificationStatus === 'APPROVED');
  const hasUnapprovedFarms = allFarms.length > farms.length;

  const farm = farms.length > 0 ? farms[selectedFarmIdx] : null;
  const hasResult = result != null;
  const isSoilDirty = useMemo(
    () => !soilValuesEqual(soilValues, savedSoilValues),
    [soilValues, savedSoilValues],
  );

  const applySoilToResult = useCallback((values: SoilFormValues) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        farmInfo: {
          ...prev.farmInfo,
          soilPh: values.soilPh ? Number(values.soilPh) : undefined,
          organicMatter: values.organicMatter ? Number(values.organicMatter) : undefined,
          soilType: values.soilType || undefined,
        },
      };
    });
  }, []);

  const loadSoilFromFarm = useCallback(async (farmId: number, recommendResult?: CropRecommendResponse | null) => {
    try {
      const detail = await getFarmDetail(farmId);
      const fromDetail = toSoilFormValues({
        soilPh: detail.ph,
        organicMatter: detail.organicMatter,
        soilType: detail.soilType,
      });
      const fromResult = recommendResult?.farmInfo
        ? toSoilFormValues(recommendResult.farmInfo)
        : null;
      const next = fromDetail.soilPh || fromDetail.organicMatter || fromDetail.soilType
        ? fromDetail
        : (fromResult ?? fromDetail);
      setSoilValues(next);
      setSavedSoilValues(next);
    } catch (e) {
      console.error('농장 토양 정보 로드 실패:', e);
      if (recommendResult?.farmInfo) {
        const fallback = toSoilFormValues(recommendResult.farmInfo);
        setSoilValues(fallback);
        setSavedSoilValues(fallback);
      }
    }
  }, []);

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
    setSoilValues({ soilPh: '', organicMatter: '', soilType: '' });
    setSavedSoilValues({ soilPh: '', organicMatter: '', soilType: '' });
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

        let sanitized: CropRecommendResponse | null = null;
        if (data) {
          sanitized = sanitizeRecommendResponse(data);
          setResult(sanitized);
          try {
            sessionStorage.setItem('recommend_result', JSON.stringify(sanitized));
          } catch {
            // ignore
          }
        }

        await loadSoilFromFarm(farmId, sanitized);
      } catch (e) {
        console.error('최근 AI 추천 이력 복원 실패:', e);
        if (!cancelled && farmId != null) {
          await loadSoilFromFarm(farmId, null);
        }
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [farm?.id, loadSoilFromFarm]);

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
      setAnalyzeStepIndex(quickStepIndexFromElapsed(Date.now() - start));
    };
    tick();
    const id = window.setInterval(tick, 800);
    return () => window.clearInterval(id);
  }, [isAnalyzing]);

  const persistResult = (data: CropRecommendResponse) => {
    setResult(data);
    try {
      sessionStorage.setItem('recommend_result', JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const handleSoilChange = (field: keyof SoilFormValues, value: string) => {
    setSoilValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSoil = async () => {
    if (!farm?.id || !isSoilDirty) return;

    setIsSavingSoil(true);
    try {
      const detail = await getFarmDetail(farm.id);
      await updateFarm(farm.id, {
        ...buildFarmAddressPayload(detail),
        soilType: soilValues.soilType || undefined,
        ph: soilValues.soilPh ? Number(soilValues.soilPh) : undefined,
        organicMatter: soilValues.organicMatter ? Number(soilValues.organicMatter) : undefined,
      });

      setSavedSoilValues(soilValues);
      applySoilToResult(soilValues);

      const stored = result ?? (() => {
        try {
          const raw = sessionStorage.getItem('recommend_result');
          return raw ? (JSON.parse(raw) as CropRecommendResponse) : null;
        } catch {
          return null;
        }
      })();

      if (stored) {
        const updated = {
          ...stored,
          farmInfo: {
            ...stored.farmInfo,
            soilPh: soilValues.soilPh ? Number(soilValues.soilPh) : undefined,
            organicMatter: soilValues.organicMatter ? Number(soilValues.organicMatter) : undefined,
            soilType: soilValues.soilType || undefined,
          },
        };
        persistResult(updated);
      }

      toastSuccess('토양 정보가 저장되었습니다. 다시 분석하면 순위가 갱신됩니다.');
    } catch (err) {
      console.error('토양 정보 저장 실패:', err);
      const message = err instanceof Error ? err.message : '토양 정보 저장에 실패했습니다.';
      toastError(message);
    } finally {
      setIsSavingSoil(false);
    }
  };

  const handleAnalyze = async () => {
    if (!farm?.id) return;

    if (isSoilDirty) {
      toastError('변경된 토양 정보를 먼저 저장해 주세요.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeStepIndex(0);

    try {
      const data = sanitizeRecommendResponse(await requestCropRecommendation(farm.id));
      persistResult(data);
      const nextSoil = toSoilFormValues(data.farmInfo);
      setSoilValues(nextSoil);
      setSavedSoilValues(nextSoil);
      toastSuccess('작물 적합도 분석이 완료되었습니다.');
    } catch (err) {
      console.error('AI 분석 실패:', err);
      const message = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.';
      toastError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentCropAdvices = result?.currentCropAdvices ?? [];
  const newRecommendations = result?.recommendations ?? [];
  const top3 = newRecommendations.slice(0, 3);
  const allRecs = newRecommendations;
  const displayArea = result?.farmInfo.area ?? farm?.area ?? 0;

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
    soilValues,
    isSoilDirty,
    isSavingSoil,
    displayArea,
    handleSoilChange,
    handleSaveSoil,
  };
}
