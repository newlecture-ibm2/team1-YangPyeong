'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Badge from '@/components/common/Badge/Badge';
import { useToast } from '@/components/common/Toast';
import { useMyFarms } from './useFarm';
import { useHistory } from './useHistory';
import { useCultivation } from './useCultivation';
import { getLatestRecommendHistory } from './recommend/_lib/recommend.api';
import type { CropRecommendResponse } from './recommend/_lib/recommend.types';
import { getFarmRevenuePredictions, predictRevenue, type RevenuePredictionResponse } from './_lib/revenue.api';
import {
  mergeRevenuePredictionSources,
  isWeakRevenuePrediction,
  pickPrimaryRevenueCrop,
  readRevenuePredictionCache,
  writeRevenuePredictionCache,
  type RevenueCropRow,
} from './_lib/revenuePredictionCache';
import Timeline from './_components/Timeline/Timeline';
import HistoryModal from './_components/HistoryModal/HistoryModal';
import CultivationEditModal from './_components/CultivationEditModal/CultivationEditModal';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import UnifiedActionButton from './_components/UnifiedActionButton/UnifiedActionButton';
import PolicyRecommendGuideBanner from '@/components/common/PolicyRecommendGuideBanner/PolicyRecommendGuideBanner';
import { DUMMY_FARM, DUMMY_CULTIVATIONS, DUMMY_BALANCE } from '@/lib/preview-data';
import MockupOverlay from '@/components/common/MockupOverlay/MockupOverlay';
import styles from './page.module.css';

// 임시 KPI 및 활동 데이터 (백엔드 연동 전까지 유지할 데이터 구조)
const MOCK_KPI = {
  totalArea: 0,
  cropCount: 0,
  monthlyRevenue: 0,
  aiScore: 0,
};

// 최근 활동을 위한 타입 및 맵 (필요 시 유지)
type ActivityStatus = 'done' | 'scheduled' | 'checking';
const STATUS_MAP: Record<ActivityStatus, { label: string; variant: 'green' | 'lime' | 'orange' }> = {
  done: { label: '완료', variant: 'green' },
  scheduled: { label: '예정', variant: 'lime' },
  checking: { label: '점검중', variant: 'orange' },
};

/** AI 수익 예측 요청용 — 재배 등록이 있으면 작물별 면적 합산, 없으면 농장 작물명 + 면적 분할 */
function getRevenueCropRows(
  farm: { area: number; cropNames: string[] },
  cultivations: { cropName: string; cultivationArea?: number | null; sowingDate?: string | null }[],
): RevenueCropRow[] {
  if (cultivations.length > 0) {
    const map = new Map<string, { area: number; sowingMonth?: number }>();
    for (const c of cultivations) {
      const a = Number(c.cultivationArea) || 0;
      const prev = map.get(c.cropName) || { area: 0, sowingMonth: undefined };
      let sowingMonth = prev.sowingMonth;
      if (c.sowingDate) {
        const m = new Date(c.sowingDate).getMonth() + 1;
        if (!Number.isNaN(m)) sowingMonth = m;
      }
      map.set(c.cropName, { area: prev.area + a, sowingMonth });
    }
    return Array.from(map.entries()).map(([cropName, v]) => ({
      cropName,
      areaSqm: v.area > 0 ? v.area : farm.area,
      sowingMonth: v.sowingMonth,
    }));
  }
  if (farm.cropNames.length > 0) {
    const n = farm.cropNames.length;
    const share = farm.area / n;
    return farm.cropNames.map((cropName) => ({ cropName, areaSqm: share }));
  }
  return [];
}

const renderTitleWithEm = (text: string) => {
  if (!text) return '';
  const words = text.trim().split(' ');
  if (words.length <= 1) {
    return <em>{text}</em>;
  }
  const lastWord = words.pop();
  return (
    <>
      {words.join(' ')} <em>{lastWord}</em>
    </>
  );
};

function FarmDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') === 'history' ? 'HISTORY' : 'DASHBOARD';

  const toast = useToast();
  const { farms: allFarms, isLoading: isFarmsLoading, removeFarm: deleteSelectedFarm } = useMyFarms();
  const farms = useMemo(
    () => allFarms.filter((f) => f.certificationStatus === 'APPROVED'),
    [allFarms],
  );
  const isPreviewMode = !isFarmsLoading && farms.length === 0;
  const hasUnapprovedFarms = useMemo(
    () => allFarms.length > farms.length,
    [allFarms, farms.length],
  );
  const isPreviewUser = !isFarmsLoading && farms.length === 0;

  // 표시할 농장 목록: 항상 전체 농장 표시
  const displayFarms = allFarms;
  const [selectedFarmIdx, setSelectedFarmIdx] = useState(0);
  // 농장 목록 뷰 여부 상태
  const [isListView, setIsListView] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'DASHBOARD' | 'HISTORY' | 'POLICY' | 'REPORT'>(initialTab);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCultivationModalOpen, setIsCultivationModalOpen] = useState(false);
  const [selectedCultivation, setSelectedCultivation] = useState<any>(null);
  const [cropOptions, setCropOptions] = useState<{ id: number, name: string }[]>([]);
  const [weather, setWeather] = useState<{ tmp: number, pty: number, sky: number } | null>(null);
  const [weatherSettled, setWeatherSettled] = useState(false);
  const [latestAiScore, setLatestAiScore] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  /** 농장 단위로만 갱신 — 재배 목록 변경 시 재요청하지 않아 단가 매칭이 안정적 */
  const [latestRecommendData, setLatestRecommendData] = useState<CropRecommendResponse | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // 유저 권한 확인
  useEffect(() => {
    // fb-session은 httpOnly 쿠키라 클라이언트에서 읽을 수 없으므로 fb-user 쿠키 유무로 로그인 여부 판별
    const hasUserCookie = document.cookie.includes('fb-user');
    setIsGuest(!hasUserCookie);
    
    const match = document.cookie.match(/(?:^|;\s*)fb-user=([^;]*)/);
    if (match) {
      try {
        const user = JSON.parse(decodeURIComponent(match[1]));
        setUserRole(user.role);
      } catch { }
    }
  }, []);

  // 기상 정보 조회 (수익 예측은 로드 완료 후 시작)
  useEffect(() => {
    setWeatherSettled(false);
    fetch('/api/weather/current')
      .then(res => res.json())
      .then(json => {
        if (json.success) setWeather(json.data);
      })
      .catch()
      .finally(() => setWeatherSettled(true));
  }, []);

  // 작물 목록 조회
  useEffect(() => {
    fetch('/api/admin/crops')
      .then(res => res.json())
      .then(json => {
        if (json.success) setCropOptions(json.data || []);
      })
      .catch();
  }, []);
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog();

  const handleBackToList = useCallback(() => {
    setIsListView(true);
    try {
      sessionStorage.removeItem('selected_farm_id');
    } catch (e) {}
  }, []);

  // 농장 목록 뷰 여부 초기화 및 복원
  useEffect(() => {
    try {
      const savedFarmIdStr = sessionStorage.getItem('selected_farm_id');
      if (savedFarmIdStr && displayFarms.length > 0) {
        const savedFarmId = Number(savedFarmIdStr);
        const idx = displayFarms.findIndex((f) => f.id === savedFarmId);
        if (idx !== -1) {
          setSelectedFarmIdx(idx);
          setIsListView(false);
          return;
        }
      }
    } catch (e) {}

    if (displayFarms.length > 1) {
      setIsListView(true);
    } else {
      setIsListView(false);
    }
  }, [displayFarms]);

  // 수정을 위한 상태
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingDate, setEditingDate] = useState<string | undefined>(undefined);

  // 선택된 농장
  // 선택된 농장
  const selectedFarm = displayFarms.length > 0 ? displayFarms[selectedFarmIdx] : null;
  const isCurrentFarmApproved = selectedFarm?.certificationStatus === 'APPROVED';
  
  // 블러(미리보기) 모드 활성화 조건: 
  // 1. 농장이 하나도 없는 유저(Preview User)이거나
  // 2. 현재 선택한 농장이 승인되지 않은 상태일 때
  const isShowPreviewBlur = isPreviewUser || (selectedFarm && !isCurrentFarmApproved);

  const farm = selectedFarm || (isPreviewUser ? { ...DUMMY_FARM, cropNames: DUMMY_FARM.cropNames || [] } : null);
  const farmRef = useRef(farm);
  farmRef.current = farm;

  // 히스토리 데이터 연동
  const {
    histories,
    isLoading: isHistoryLoading,
    addHistory,
    updateHistory,
    removeHistory,
    refresh: refreshHistories
  } = useHistory(farm?.id, true);

  // 재배 정보 연동
  const {
    cultivations,
    isLoading: isCultivationLoading,
    modifyCultivation,
    removeCultivation,
    refresh: refreshCultivations
  } = useCultivation(farm?.id, true);

  const revenueCropRows = useMemo(
    () => (farm ? getRevenueCropRows(farm, cultivations) : []),
    [farm, cultivations],
  );
  const revenueCropRowsKey = revenueCropRows
    .map((r) => `${r.cropName}:${r.areaSqm}:${r.sowingMonth ?? ''}`)
    .join('|');

  const [predictionsByCrop, setPredictionsByCrop] = useState<Record<string, RevenuePredictionResponse>>({});
  const [revenueErrorsByCrop, setRevenueErrorsByCrop] = useState<Record<string, string>>({});
  const [loadingRevenueCrop, setLoadingRevenueCrop] = useState<string | null>(null);
  const [applyingCrop, setApplyingCrop] = useState<string | null>(null);
  const [actualYieldByCrop, setActualYieldByCrop] = useState<Record<string, number | ''>>({});
  const [expandedRevenueCrop, setExpandedRevenueCrop] = useState<string | null>(null);

  const primaryRevenueCrop = useMemo(
    () => pickPrimaryRevenueCrop(revenueCropRows),
    [revenueCropRows],
  );

  const loadedRevenueCount = Object.keys(predictionsByCrop).length;

  const totalPredictedRevenue = useMemo(
    () => Object.values(predictionsByCrop).reduce((sum, p) => sum + (p.predicted_revenue ?? 0), 0),
    [predictionsByCrop],
  );

  const isPrimaryRevenueLoading =
    primaryRevenueCrop != null && loadingRevenueCrop === primaryRevenueCrop.cropName;

  const buildWeatherContext = useCallback(() => {
    if (!weather) return undefined;
    return `현재 양평 날씨: 기온 ${weather.tmp}도, 강수형태 ${weather.pty}, 하늘상태 ${weather.sky}`;
  }, [weather]);

  const fetchPredictionOne = useCallback(
    async (row: RevenueCropRow, actualYield?: number) => {
      if (!farm?.id) return null;
      const wc = buildWeatherContext();
      const request: Parameters<typeof predictRevenue>[0] = {
        crop_name: row.cropName,
        area_sqm: row.areaSqm,
        farm_id: farm.id,
        weather_context: wc,
      };
      if (row.sowingMonth != null && row.sowingMonth >= 1 && row.sowingMonth <= 12) {
        request.sowing_month = row.sowingMonth;
      }
      if (actualYield != null && !Number.isNaN(actualYield)) {
        request.actual_yield_kg = actualYield;
      }
      const data = await predictRevenue(request);
      if (!isWeakRevenuePrediction(data)) {
        writeRevenuePredictionCache(farm.id, row, data, actualYield);
      }
      return data;
    },
    [farm?.id, buildWeatherContext],
  );

  const loadRevenueForCrop = useCallback(
    async (row: RevenueCropRow, actualYield?: number, options?: { skipCache?: boolean }) => {
      if (!farm?.id) return;
      const { cropName } = row;

      if (!options?.skipCache) {
        const cached = readRevenuePredictionCache(farm.id, row, actualYield);
        if (cached) {
          setPredictionsByCrop((prev) => ({ ...prev, [cropName]: cached }));
          setRevenueErrorsByCrop((prev) => {
            const next = { ...prev };
            delete next[cropName];
            return next;
          });
          return;
        }
      }

      const seq = (revenueFetchSeqRef.current[cropName] ?? 0) + 1;
      revenueFetchSeqRef.current[cropName] = seq;

      setLoadingRevenueCrop(cropName);
      try {
        const data = await fetchPredictionOne(row, actualYield);
        if (revenueFetchSeqRef.current[cropName] !== seq) return;

        if (data && !isWeakRevenuePrediction(data)) {
          setPredictionsByCrop((prev) => ({ ...prev, [cropName]: data }));
          setRevenueErrorsByCrop((prev) => {
            const next = { ...prev };
            delete next[cropName];
            return next;
          });
        } else {
          setPredictionsByCrop((prev) => {
            const next = { ...prev };
            delete next[cropName];
            return next;
          });
          setRevenueErrorsByCrop((prev) => ({
            ...prev,
            [cropName]:
              'AI 분석 결과가 불완전합니다. farm-ai 재배포 후 다시 시도해 주세요.',
          }));
        }
      } catch {
        if (revenueFetchSeqRef.current[cropName] !== seq) return;
        setPredictionsByCrop((prev) => {
          const next = { ...prev };
          delete next[cropName];
          return next;
        });
        setRevenueErrorsByCrop((prev) => ({
          ...prev,
          [cropName]: '예측을 불러오지 못했습니다.',
        }));
      } finally {
        if (revenueFetchSeqRef.current[cropName] === seq) {
          setLoadingRevenueCrop((prev) => (prev === cropName ? null : prev));
        }
      }
    },
    [farm?.id, fetchPredictionOne],
  );

  const loadRevenueForCropRef = useRef(loadRevenueForCrop);
  loadRevenueForCropRef.current = loadRevenueForCrop;
  const revenueFetchSeqRef = useRef<Record<string, number>>({});
  const revenueBootstrapKeyRef = useRef<string | null>(null);

  const handleApplyYieldForCrop = useCallback(
    async (row: RevenueCropRow) => {
      if (!farm?.id) return;
      const raw = actualYieldByCrop[row.cropName];
      setApplyingCrop(row.cropName);
      try {
        const y = raw === '' || raw == null ? undefined : Number(raw);
        await loadRevenueForCrop(row, y, { skipCache: true });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : '수익 예측에 실패했습니다.');
      } finally {
        setApplyingCrop(null);
      }
    },
    [farm?.id, actualYieldByCrop, loadRevenueForCrop, toast],
  );

  const handleResetYieldForCrop = useCallback(
    async (row: RevenueCropRow) => {
      setActualYieldByCrop((prev) => ({ ...prev, [row.cropName]: '' }));
      setApplyingCrop(row.cropName);
      try {
        await loadRevenueForCrop(row, undefined, { skipCache: true });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : '수익 예측에 실패했습니다.');
      } finally {
        setApplyingCrop(null);
      }
    },
    [loadRevenueForCrop, toast],
  );

  const handleStartRevenueAnalysis = useCallback(
    (row: RevenueCropRow) => {
      setExpandedRevenueCrop(row.cropName);
      const existing = predictionsByCrop[row.cropName];
      const needsFetch =
        (!existing || isWeakRevenuePrediction(existing)) &&
        loadingRevenueCrop !== row.cropName;
      if (needsFetch) {
        void loadRevenueForCrop(row, undefined, { skipCache: Boolean(existing) });
      }
    },
    [predictionsByCrop, loadingRevenueCrop, loadRevenueForCrop],
  );

  // 농장 전환 시에만 수익 예측 상태 초기화 (농장 정보 탭 이동 시에는 유지)
  useEffect(() => {
    setPredictionsByCrop({});
    setRevenueErrorsByCrop({});
    setExpandedRevenueCrop(null);
    setLoadingRevenueCrop(null);
    revenueBootstrapKeyRef.current = null;
  }, [farm?.id]);

  /**
   * 대시보드: sessionStorage에 있는 작물은 모두 즉시 복원(LLM 없음).
   * API 자동 호출은 대표 작물 1종·캐시 없을 때만.
   * 재배 목록 로딩이 끝난 뒤 1회만 부트스트랩(중복 요청 방지).
   */
  useEffect(() => {
    if (activeSubTab !== 'DASHBOARD' || !farm?.id || isCultivationLoading) {
      return;
    }
    if (revenueCropRows.length === 0) {
      setPredictionsByCrop({});
      setRevenueErrorsByCrop({});
      setExpandedRevenueCrop(null);
      return;
    }

    const bootstrapKey = `${farm.id}:${revenueCropRowsKey}`;
    if (revenueBootstrapKeyRef.current === bootstrapKey) {
      return;
    }
    revenueBootstrapKeyRef.current = bootstrapKey;

    let cancelled = false;
    const fid = farm.id;

    const applyMerged = (merged: Record<string, RevenuePredictionResponse>) => {
      if (cancelled) return;
      setPredictionsByCrop((prev) => ({ ...prev, ...merged }));
      setRevenueErrorsByCrop({});

      const primary = pickPrimaryRevenueCrop(revenueCropRows);
      if (!primary) return;

      setExpandedRevenueCrop((prev) => prev ?? primary.cropName);
      const primaryCached = merged[primary.cropName];
      const shouldFetchPrimary =
        !primaryCached || isWeakRevenuePrediction(primaryCached);
      if (shouldFetchPrimary) {
        void loadRevenueForCropRef.current(primary, undefined, {
          skipCache: Boolean(primaryCached),
        });
      }
    };

    void (async () => {
      try {
        const serverItems = await getFarmRevenuePredictions(fid);
        if (cancelled) return;
        applyMerged(mergeRevenuePredictionSources(fid, revenueCropRows, serverItems));
      } catch (e) {
        console.warn('서버 수익 예측 이력 복원 실패, sessionStorage만 사용:', e);
        if (!cancelled) {
          applyMerged(mergeRevenuePredictionSources(fid, revenueCropRows, []));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSubTab, farm?.id, revenueCropRowsKey, isCultivationLoading]);

  // 이력·재배·최근 AI 추천을 한 번에 병렬 로드 (농장 전환 시에만 재요청)
  useEffect(() => {
    if (!farm?.id) {
      setLatestRecommendData(null);
      return;
    }
    const farmId = farm.id;
    let cancelled = false;
    setLatestRecommendData(null);

    (async () => {
      try {
        const [, , rec] = await Promise.all([
          refreshHistories(),
          refreshCultivations(),
          getLatestRecommendHistory(farmId).catch(() => null),
        ]);
        if (cancelled) return;
        setLatestRecommendData(rec);
      } catch {
        if (!cancelled) {
          setLatestRecommendData(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [farm?.id, refreshHistories, refreshCultivations]);

  // 통합 새로고침
  const refreshAll = useCallback(async () => {
    const f = farmRef.current;
    if (!f?.id) {
      await Promise.all([refreshHistories(), refreshCultivations()]);
      return;
    }
    const targetId = f.id;
    const [, , rec] = await Promise.all([
      refreshHistories(),
      refreshCultivations(),
      getLatestRecommendHistory(targetId).catch(() => null),
    ]);
    if (farmRef.current?.id === targetId) {
      setLatestRecommendData(rec);
    }
  }, [refreshHistories, refreshCultivations]);

  // AI 점수·예상 수익 합산: 재배 변경 시에는 서버 이력을 다시 부르지 않고 로컬만 재계산
  useEffect(() => {
    if (!farm?.id) {
      setLatestAiScore(null);
      setMonthlyRevenue(0);
      return;
    }
    const recommendations = latestRecommendData?.recommendations ?? [];
    const aiScore =
      latestRecommendData && recommendations.length > 0 ? recommendations[0].score : null;
    setLatestAiScore(aiScore);

    let estimatedTotal = 0;
    if (cultivations?.length) {
      for (const c of cultivations) {
        const rec = recommendations.find((r) => r.cropId === c.cropId);
        const pricePerKg = rec?.expectedRevenuePerKg ?? 3000;
        const yieldAmount = Number(c.farmerEstimatedYield) || 0;
        estimatedTotal += yieldAmount * pricePerKg;
      }
    }
    setMonthlyRevenue(estimatedTotal);
  }, [farm?.id, cultivations, latestRecommendData]);

  const isLoading = isFarmsLoading;

  // 수정 버튼 클릭 핸들러
  const handleEditClick = (id: number, content: string, date?: string) => {
    setEditingHistoryId(id);
    setEditingContent(content);
    setEditingDate(date);
    setIsHistoryModalOpen(true);
  };

  // 농장 삭제 버튼 클릭 핸들러
  const handleDeleteFarm = async (id: number, name: string) => {
    try {
      const confirmed = await showConfirm(`'${name}' 농장을 정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`);
      if (confirmed) {
        await deleteSelectedFarm(id);
      }
    } catch (err) {
      // 폴백으로 기본 confirm 사용
      if (window.confirm(`'${name}' 농장을 정말 삭제하시겠습니까?`)) {
        await deleteSelectedFarm(id);
      }
    }
  };

  // 이력 삭제 버튼 클릭 핸들러
  const handleDeleteHistory = async (id: number) => {
    const confirmed = await showConfirm('정말 삭제하시겠습니까?');
    if (confirmed) {
      await removeHistory(id);
    }
  };
  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsHistoryModalOpen(false);
    setEditingHistoryId(null);
    setEditingContent('');
    setEditingDate(undefined);
  };

  // 저장/수정 실행 핸들러
  const handleSaveHistory = async (content: string, date?: string) => {
    let result: boolean;
    if (editingHistoryId) {
      result = await updateHistory(editingHistoryId, content, date);
    } else {
      result = await addHistory(content, date);
    }
    if (result) {
      await refreshAll();
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중...</p>
      </div>
    );
  }



  // 농장 목록 뷰 (표시할 농장이 2개 이상일 때)
  if (isListView && displayFarms.length > 1) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className="page-title">내 농장 <em>선택</em></h1>
            <p className={styles.subtitle}>관리할 농장을 선택하거나 새로운 농장을 등록하세요.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '32px' }} data-guide="farm-list">
          {displayFarms.map((f, idx) => (
            <div
              key={f.id}
              onClick={() => {
                setSelectedFarmIdx(idx);
                setIsListView(false);
                try {
                  sessionStorage.setItem('selected_farm_id', String(f.id));
                } catch (e) {}
              }}
              style={{ position: 'relative', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', minHeight: '200px' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* 삭제 버튼 (우측 상단 절대 배치) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFarm(f.id, f.name);
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#64748b';
                }}
                title="농장 삭제"
              >
                ✕
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingRight: '36px' }}>
                <div style={{ paddingRight: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>{f.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>{f.address}</div>
                </div>
                <Badge variant={f.certificationStatus === 'APPROVED' ? 'green' : 'orange'}>
                  {f.certificationStatus === 'APPROVED' ? '승인됨' : '심사중'}
                </Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>재배 면적</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {f.area.toLocaleString()} ㎡
                    <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '4px', opacity: 0.8 }}>
                      ({Math.round(f.area / 3.3058)}평)
                    </span>
                  </div>
                </div>
                <div style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>재배 작물</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>{f.cropNames.length} 종</div>
                </div>
              </div>
            </div>
          ))}

          {/* 새로운 농장 등록 카드 */}
          <Link href="/farm/register" style={{ textDecoration: 'none' }}>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text-light)', height: '100%', cursor: 'pointer', transition: 'all 0.2s', minHeight: '200px' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(16,185,129,0.02)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-light)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>＋</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>새로운 농장 등록하기</div>
              <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>또 다른 농장이 있으신가요?</p>
            </div>
          </Link>
          {hasUnapprovedFarms && (
            <Link href="/mypage/farm-applications" style={{ textDecoration: 'none' }}>
              <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text)', height: '100%', cursor: 'pointer', transition: 'all 0.2s', minHeight: '200px', background: 'var(--color-bg)' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>심사 현황 확인하기</div>
                <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8, color: 'var(--color-text-light)' }}>현재 마이페이지에서 심사 대기 중인 농장이 있습니다.</p>
              </div>
            </Link>
          )}
        </div>

        <ModalDialog
          {...dialog}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      </div>
    );
  }

  // 단일 농장 뷰
  return (
    <div className={styles.container}>
      {/* 페이지 헤더 */}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>홈</Link> /
            {displayFarms.length > 1 ? (
              <span style={{ cursor: 'pointer', color: 'var(--color-text-light)' }} onClick={handleBackToList}> 내 농장</span>
            ) : (
              <span style={{ color: 'var(--color-text-light)' }}> 내 농장</span>
            )} / {isShowPreviewBlur ? '미리보기' : (activeSubTab === 'DASHBOARD' ? '관리' : '정보')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {displayFarms.length > 1 && (
              <button
                onClick={handleBackToList}
                style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="목록으로 돌아가기"
              >
                ←
              </button>
            )}
            <h1 className="page-title">
              {renderTitleWithEm(
                isPreviewMode
                  ? (hasUnapprovedFarms ? '내 농장 심사 대기 중' : '내 농장 미리보기')
                  : farm?.name || ''
              )}
            </h1>
          </div>
          <p className={styles.subtitle}>
            {isPreviewMode
              ? (hasUnapprovedFarms
                ? '현재 농장 등록 심사가 진행 중입니다. 승인 완료 후 실제 데이터를 관리할 수 있습니다.'
                : '농장을 등록하시면 실제 본인의 재배 면적과 수익 분석을 관리할 수 있습니다.')
              : (activeSubTab === 'DASHBOARD'
                ? `${farm?.name}의 현황을 한눈에 확인하세요.`
                : '농장 정보 및 재배 히스토리를 확인하고 기록하세요.')}
          </p>
        </div>
        {!isPreviewMode && (
          <div className={styles.headerButtons}>
            <UnifiedActionButton onAddHistory={() => setIsHistoryModalOpen(true)} data-guide="farm-register" />
            {activeSubTab === 'DASHBOARD' && (
              <Link href="/farm/register">
                <Button variant="outline" style={{ borderRadius: '50px' }}>+ 새 농장 등록</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        {isShowPreviewBlur && <MockupOverlay hasUnapprovedFarms={hasUnapprovedFarms} isGuest={isGuest} />}
        <div
          style={{ filter: isShowPreviewBlur ? 'blur(8px) grayscale(0.3)' : 'none', pointerEvents: isShowPreviewBlur ? 'none' : 'auto' }}
          data-guide-blurred={isShowPreviewBlur ? 'true' : undefined}
        >
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveHistory}
        farmName={farm?.name || ''}
        initialContent={editingContent}
        initialDate={editingDate}
        mode={editingHistoryId ? 'edit' : 'create'}
      />

      <CultivationEditModal
        isOpen={isCultivationModalOpen}
        onClose={() => { setIsCultivationModalOpen(false); setSelectedCultivation(null); }}
        onSave={async (area, yieldAmount, unit) => {
          if (selectedCultivation) {
            const success = await modifyCultivation(selectedCultivation.id, area, yieldAmount, unit);
            if (success) refreshAll();
            return success;
          }
          return false;
        }}
        cultivation={selectedCultivation}
      />

      {/* Main Tabs (Navigation) */}
      <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0', marginBottom: '32px', display: 'flex', gap: '32px' }} data-guide="farm-farmer-tabs">
        <button
          style={{ background: 'none', border: 'none', color: activeSubTab === 'DASHBOARD' ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: activeSubTab === 'DASHBOARD' ? 700 : 600, borderBottom: activeSubTab === 'DASHBOARD' ? '2px solid var(--color-primary)' : 'none', paddingBottom: '16px', marginBottom: '-1px', cursor: 'pointer', fontSize: '16px' }}
          onClick={() => {
            setActiveSubTab('DASHBOARD');
            router.replace('/farm', { scroll: false });
          }}
        >
          대시보드
        </button>
        <Link href="/balance" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px', fontSize: '16px' }}>
          수급 분석
        </Link>
        <Link href="/farm/recommend" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px', fontSize: '16px' }}>
          AI 작물 추천
        </Link>
        <button
          style={{ background: 'none', border: 'none', color: activeSubTab === 'HISTORY' ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: activeSubTab === 'HISTORY' ? 700 : 600, borderBottom: activeSubTab === 'HISTORY' ? '2px solid var(--color-primary)' : 'none', paddingBottom: '16px', marginBottom: '-1px', cursor: 'pointer', fontSize: '16px' }}
          onClick={() => {
            setActiveSubTab('HISTORY');
            router.replace('/farm?tab=history', { scroll: false });
          }}
        >
          농장 일지
        </button>
      </div>

      {activeSubTab === 'DASHBOARD' && (
        <>
          {/* KPI 카드 Row (Dashboard 전용) */}
          <div className={styles.kpiRow} data-guide="farm-farmer-kpi">
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>농장 전체 면적</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>
                {farm?.area.toLocaleString()}㎡
              </p>
            </div>
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>재배 중인 면적</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {cultivations.reduce((acc, curr) => acc + (curr.cultivationArea || 0), 0).toLocaleString()}㎡
              </p>
            </div>
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>재배 작물</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>{farm?.cropNames.length}종</p>
            </div>
            <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>AI 예측 수익 합계</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                {isPrimaryRevenueLoading && loadedRevenueCount === 0
                  ? '계산 중...'
                  : `₩${totalPredictedRevenue.toLocaleString('ko-KR')}`}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '6px' }}>
                분석 완료 {loadedRevenueCount}/{revenueCropRows.length}종 합계(추정)
              </p>
            </div>
          </div>

          {/* 작물별 AI 수익 · 시세 인사이트 (아코디언) */}
          {farm && revenueCropRows.length > 0 && (
            <div className={styles.insightPanel} data-guide="farm-farmer-insight">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--color-primary)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>AI 예측 인사이트</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>작물별 수익 · 시세 분석</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-light)', marginTop: '8px', marginBottom: 0 }}>
                  면적이 가장 큰 대표 작물은 자동 분석합니다. 다른 작물은 「분석받기」를 눌러야 AI 분석이 시작됩니다.
                </p>
              </div>

              <div className={styles.revenueCropList}>
                {revenueCropRows.map((row) => {
                  const { cropName, areaSqm } = row;
                  const open = expandedRevenueCrop === cropName;
                  const prediction = predictionsByCrop[cropName];
                  const errMsg = revenueErrorsByCrop[cropName];
                  const isPrimary = primaryRevenueCrop?.cropName === cropName;
                  const isLoadingThis = loadingRevenueCrop === cropName;
                  const busy = applyingCrop === cropName || isLoadingThis;
                  const isAnalyzed = Boolean(prediction);
                  const canExpand = isPrimary || isAnalyzed || Boolean(errMsg);
                  const showAnalyzeButton = !isPrimary && !isAnalyzed && !errMsg;
                  return (
                    <div
                      key={cropName}
                      className={`${styles.revenueCropCard} ${open ? styles.revenueCropCardOpen : ''}`}
                    >
                      <div className={styles.revenueCropHeader}>
                        <button
                          type="button"
                          className={styles.revenueCropTitleBtn}
                          disabled={!canExpand}
                          onClick={() => {
                            if (!canExpand) return;
                            setExpandedRevenueCrop(open ? null : cropName);
                          }}
                        >
                          <div className={styles.revenueCropTitle}>
                            {cropName}
                            {isPrimary && <span className={styles.revenuePrimaryTag}>대표</span>}
                          </div>
                          <div className={styles.revenueCropMeta}>
                            분석 면적 약 {areaSqm.toLocaleString('ko-KR')}㎡
                            {isPrimary && !isAnalyzed && isLoadingThis && ' · AI 분석 중...'}
                          </div>
                        </button>
                        <div className={styles.revenueCropActions}>
                          {prediction && (
                            <span className={styles.revenueCropAmount}>
                              ₩{(prediction.predicted_revenue ?? 0).toLocaleString('ko-KR')}
                            </span>
                          )}
                          {showAnalyzeButton && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={busy}
                              onClick={() => handleStartRevenueAnalysis(row)}
                            >
                              {isLoadingThis ? '분석 중...' : '분석받기'}
                            </Button>
                          )}
                          {isPrimary && isLoadingThis && !prediction && (
                            <Badge variant="orange">분석 중</Badge>
                          )}
                          {errMsg && <Badge variant="red">오류</Badge>}
                          {prediction && <Badge variant="lime">신뢰도 {prediction.confidence}</Badge>}
                          {canExpand && (
                            <button
                              type="button"
                              className={styles.revenueToggleBtn}
                              onClick={() => setExpandedRevenueCrop(open ? null : cropName)}
                            >
                              {open ? '접기 ▲' : '펼치기 ▼'}
                            </button>
                          )}
                        </div>
                      </div>

                      {open && (
                        <div className={styles.revenueCropBody}>
                          {isPrimary && isLoadingThis && !prediction && !errMsg && (
                            <p className={styles.revenueLoadingHint}>
                              대표 작물 AI 수익·시세 분석을 준비하고 있습니다…
                            </p>
                          )}
                          {isPrimary && !isLoadingThis && !prediction && !errMsg && (
                            <div className={styles.revenueEmptyState}>
                              <p className={styles.revenueErrorText}>
                                대표 작물 수익·시세 분석이 아직 없습니다. 아래 버튼으로 분석을 시작하세요.
                              </p>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={busy}
                                onClick={() => handleStartRevenueAnalysis(row)}
                              >
                                분석받기
                              </Button>
                            </div>
                          )}
                          {errMsg && !prediction && (
                            <div className={styles.revenueEmptyState}>
                              <p className={styles.revenueErrorText}>{errMsg}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => handleStartRevenueAnalysis(row)}
                              >
                                다시 시도
                              </Button>
                            </div>
                          )}
                          {prediction && (
                            <div className={styles.insightGrid}>
                              <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>AI 예측 수확량</span>
                                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {(prediction.predicted_yield_kg || 0).toLocaleString('ko-KR')} kg
                                  </span>
                                </div>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>KAMIS 도매 시세 (1kg)</span>
                                  <span style={{ fontSize: '18px', fontWeight: 700 }}>
                                    ₩{(prediction.predicted_price_per_kg || 0).toLocaleString('ko-KR')}
                                  </span>
                                </div>
                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--color-border)' }}>
                                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                                    💡 이 작물의 실제 수확량(kg)이 다르면 입력 후 적용하세요.
                                  </label>
                                  <div className={styles.insightActions}>
                                    <input
                                      type="number"
                                      placeholder="실제 수확량 (kg)"
                                      value={actualYieldByCrop[cropName] ?? ''}
                                      onChange={(e) =>
                                        setActualYieldByCrop((prev) => ({
                                          ...prev,
                                          [cropName]: e.target.value === '' ? '' : Number(e.target.value),
                                        }))
                                      }
                                      className={styles.insightInput}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleResetYieldForCrop(row)}
                                      disabled={busy}
                                    >
                                      되돌리기
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleApplyYieldForCrop(row)} disabled={busy}>
                                      {busy ? '계산 중...' : '적용'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
                                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>📈 시세 전망</h4>
                                  <p style={{ fontSize: '14px', color: 'var(--color-text-light)', lineHeight: 1.5 }}>
                                    {prediction.price_insight || '—'}
                                  </p>
                                </div>
                                <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#b45309' }}>💡 종합 수익 분석</h4>
                                  <p style={{ fontSize: '14px', color: '#92400e', lineHeight: 1.5 }}>
                                    {prediction.revenue_insight || '—'}
                                  </p>
                                </div>
                                {prediction.yield_factors &&
                                  (prediction.yield_factors.planting_time_impact ||
                                    prediction.yield_factors.weather_impact ||
                                    prediction.yield_factors.overall_adjustment) && (
                                    <div
                                      style={{
                                        background: '#f0fdf4',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid #22c55e',
                                      }}
                                    >
                                      <h4
                                        style={{
                                          fontSize: '14px',
                                          fontWeight: 700,
                                          marginBottom: '8px',
                                          color: '#166534',
                                        }}
                                      >
                                        🌱 수확량 산정 근거
                                      </h4>
                                      <ul
                                        style={{
                                          margin: 0,
                                          paddingLeft: '18px',
                                          fontSize: '13px',
                                          color: '#15803d',
                                          lineHeight: 1.6,
                                        }}
                                      >
                                        {prediction.yield_factors.planting_time_impact && (
                                          <li>{prediction.yield_factors.planting_time_impact}</li>
                                        )}
                                        {prediction.yield_factors.weather_impact && (
                                          <li>{prediction.yield_factors.weather_impact}</li>
                                        )}
                                        {prediction.yield_factors.overall_adjustment && (
                                          <li>{prediction.yield_factors.overall_adjustment}</li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 면적 사용 현황 게이지 차트 (작물별 분할) */}
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>작물별 면적 점유 현황</h3>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-light)' }}>
                전체 {farm?.area.toLocaleString()}㎡ 중 {cultivations.reduce((acc, curr) => acc + (curr.cultivationArea || 0), 0).toLocaleString()}㎡ 사용 중
              </span>
            </div>
            
            {/* 멀티 세그먼트 게이지 바 */}
            <div style={{ width: '100%', height: '16px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
              {(() => {
                const totalArea = farm?.area || 1;
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
                
                // 작물별 면적 합산
                const cropStats = cultivations.reduce((acc, curr) => {
                  acc[curr.cropName] = (acc[curr.cropName] || 0) + (curr.cultivationArea || 0);
                  return acc;
                }, {} as Record<string, number>);

                return Object.entries(cropStats).map(([name, area], idx) => (
                  <div 
                    key={name}
                    style={{ 
                      width: `${(area / totalArea) * 100}%`, 
                      height: '100%', 
                      background: colors[idx % colors.length],
                      transition: 'width 0.5s ease-out'
                    }} 
                    title={`${name}: ${area.toLocaleString()}㎡`}
                  />
                ));
              })()}
            </div>

            {/* 범례 (Legend) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
              {(() => {
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
                const cropStats = cultivations.reduce((acc, curr) => {
                  acc[curr.cropName] = (acc[curr.cropName] || 0) + (curr.cultivationArea || 0);
                  return acc;
                }, {} as Record<string, number>);

                const legendItems = Object.entries(cropStats).map(([name, area], idx) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[idx % colors.length] }} />
                    <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>{area.toLocaleString()}㎡</span>
                  </div>
                ));

                // 잔여 면적 표시
                const usedArea = cultivations.reduce((acc, curr) => acc + (curr.cultivationArea || 0), 0);
                const remainingArea = Math.max(0, (farm?.area || 0) - usedArea);
                
                if (remainingArea > 0) {
                  legendItems.push(
                    <div key="remaining" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f1f5f9', border: '1px solid var(--color-border)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>가용 면적(잔여): {remainingArea.toLocaleString()}㎡</span>
                    </div>
                  );
                }

                return legendItems;
              })()}
            </div>
          </div>

          {/* 벤토 레이아웃 (Dashboard 전용) */}
          <div className={styles.bento} style={{ alignItems: 'start' }}>
            <div data-guide="farm-farmer-recent">
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>최근 활동</h3>
                <Button variant="ghost" size="sm" onClick={() => { setActiveSubTab('HISTORY'); router.replace('/farm?tab=history', { scroll: false }); }}>전체보기 →</Button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--color-text-light)' }}>날짜</th>
                    <th style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--color-text-light)' }}>활동</th>
                    <th style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--color-text-light)' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {[...histories]
                    .sort((a, b) => {
                      const targetA = a.recordDate || a.createdAt;
                      const targetB = b.recordDate || b.createdAt;
                      const dateA = new Date(targetA.includes('T') ? targetA : `${targetA}T00:00:00`).getTime();
                      const dateB = new Date(targetB.includes('T') ? targetB : `${targetB}T00:00:00`).getTime();
                      return dateB - dateA;
                    })
                    .slice(0, 5)
                    .map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                        {(() => {
                          const targetDateStr = h.recordDate || h.createdAt;
                          return new Date(targetDateStr.includes('T') ? targetDateStr : `${targetDateStr}T00:00:00`).toLocaleDateString();
                        })()}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{h.activityContent}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge variant={h.activityType === 'USER' ? 'green' : 'lime'}>
                          {h.activityType === 'USER' ? '완료' : '시스템'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {histories.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>최근 활동 기록이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </Card>
            </div>

            <div data-guide="farm-farmer-info">
              <Card variant="dark">
                <h3 style={{ color: 'var(--color-accent)', marginBottom: '20px', fontSize: '18px' }}>농장 정보</h3>
              <dl style={{ fontSize: '14px', lineHeight: '2.2' }}>
                <dt style={{ opacity: 0.5 }}>위치</dt><dd>{farm?.address}</dd>
                <dt style={{ opacity: 0.5, marginTop: '12px' }}>면적</dt><dd>{farm?.area.toLocaleString()} ㎡ ({Math.round((farm?.area || 0) / 3.3058)}평)</dd>
                <dt style={{ opacity: 0.5, marginTop: '12px' }}>주요 작물</dt><dd>{farm?.cropNames.join(', ')}</dd>
                <dt style={{ opacity: 0.5, marginTop: '12px' }}>등록 상태</dt>
                <dd>
                  <Badge variant={farm?.certificationStatus === 'APPROVED' ? 'green' : 'orange'}>
                    {farm?.certificationStatus === 'APPROVED' ? '인증됨' : '심사중'}
                  </Badge>
                </dd>
              </dl>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Link href={`/farm/${farm?.id}/edit`} style={{ flex: 2, textDecoration: 'none' }}>
                  <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>정보 수정</Button>
                </Link>
                <Button 
                  variant="outline" 
                  style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={() => farm && handleDeleteFarm(farm.id, farm.name)}
                >
                  삭제
                </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'HISTORY' && (
        <>
          {/* ☀️ Today's Weather & Insight Card (History 전용) */}
          <div className={styles.weatherCard} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1.5px solid var(--color-primary)', padding: '24px', display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '32px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ textAlign: 'center', paddingRight: '32px', borderRight: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '4px' }}>오늘의 양평 날씨</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '40px' }}>
                  {weather ? (
                    weather.pty > 0 ? (weather.pty === 3 ? '❄️' : '🌧️') : (weather.sky > 2 ? '☁️' : '☀️')
                  ) : '☀️'}
                </span>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)' }}>
                  {weather ? `${Math.round(weather.tmp)}°` : '22°'}
                  <span style={{ fontSize: '16px', color: 'var(--color-text-light)', fontWeight: 400 }}> / {weather ? '실시간' : '11°'}</span>
                </span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: 'var(--color-accent)', color: '#1a1a1a', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>AI SMART INSIGHT</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 600 }}>&quot;{farm?.cropNames.length ? farm.cropNames.join(' · ') : '작물'} 생육 가이드&quot;</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                기온 상승과 최근 관수 기록을 분석할 때 작물의 생육이 매우 활발합니다.
                <strong> 내일 오전 추가 시비</strong>를 권장하며, 기온이 높으니 <strong>병해충 방제</strong>에 유의하세요.
              </p>
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <Timeline
              histories={histories}
              onEditCultivation={(id) => {
                const cult = cultivations.find(c => c.id === id);
                if (cult) {
                  setSelectedCultivation(cult);
                  setIsCultivationModalOpen(true);
                } else {
                  toast.error('해당 재배 정보를 찾을 수 없습니다. (이미 삭제되었을 수 있습니다)');
                  refreshAll();
                }
              }}
              onDeleteCultivation={async (id) => {
                const success = await removeCultivation(id);
                if (success) refreshAll();
              }}
              onEdit={handleEditClick}
              onDelete={handleDeleteHistory}
            />
          </div>
        </>
      )}

        </div>
      </div>
      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}

export default function FarmDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>}>
      <FarmDashboardContent />
    </Suspense>
  );
}