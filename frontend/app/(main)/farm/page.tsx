'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Badge from '@/components/common/Badge/Badge';
import { useToast } from '@/components/common/Toast';
import { useMyFarms } from './useFarm';
import { useHistory } from './useHistory';
import { useCultivation } from './useCultivation';
import { getLatestRecommendHistory } from './recommend/_lib/recommend.api';
import { useRevenue } from './useRevenue';
import Timeline from './_components/Timeline/Timeline';
import HistoryModal from './_components/HistoryModal/HistoryModal';
import CultivationEditModal from './_components/CultivationEditModal/CultivationEditModal';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import UnifiedActionButton from './_components/UnifiedActionButton/UnifiedActionButton';
import PolicyRecommendGuideBanner from '@/components/common/PolicyRecommendGuideBanner/PolicyRecommendGuideBanner';
import { DUMMY_FARM, DUMMY_CULTIVATIONS, DUMMY_BALANCE } from '@/lib/preview-data';
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

function FarmDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'history' ? 'HISTORY' : 'DASHBOARD';

  const toast = useToast();
  const { farms: allFarms, isLoading: isFarmsLoading, removeFarm: deleteSelectedFarm } = useMyFarms();
  const farms = allFarms.filter(f => f.certificationStatus === 'APPROVED');
  const hasUnapprovedFarms = allFarms.length > farms.length;
  const [selectedFarmIdx, setSelectedFarmIdx] = useState(0);
  // 농장 목록 뷰 여부 상태
  const [isListView, setIsListView] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'DASHBOARD' | 'HISTORY' | 'POLICY' | 'REPORT'>(initialTab);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCultivationModalOpen, setIsCultivationModalOpen] = useState(false);
  const [selectedCultivation, setSelectedCultivation] = useState<any>(null);
  const [cropOptions, setCropOptions] = useState<{ id: number, name: string }[]>([]);
  const [weather, setWeather] = useState<{ tmp: number, pty: number, sky: number } | null>(null);
  const [latestAiScore, setLatestAiScore] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 유저 권한 확인
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)fb-user=([^;]*)/);
    if (match) {
      try {
        const user = JSON.parse(decodeURIComponent(match[1]));
        setUserRole(user.role);
      } catch {}
    }
  }, []);

  // 기상 정보 조회
  useEffect(() => {
    fetch('/api/weather/current')
      .then(res => res.json())
      .then(json => {
        if (json.success) setWeather(json.data);
      })
      .catch();
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

  // 농장 목록이 로드되었을 때, 2개 이상이면 목록 뷰를 기본으로 설정
  useEffect(() => {
    if (farms.length > 1) {
      setIsListView(true);
    }
  }, [farms]);

  // 수정을 위한 상태
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // 선택된 농장
  const farm = farms.length > 0 ? farms[selectedFarmIdx] : null;

  // 히스토리 데이터 연동
  const {
    histories,
    isLoading: isHistoryLoading,
    addHistory,
    updateHistory,
    removeHistory,
    refresh: refreshHistories
  } = useHistory(farm?.id);

  // 재배 정보 연동
  const {
    cultivations,
    isLoading: isCultivationLoading,
    modifyCultivation,
    removeCultivation,
    refresh: refreshCultivations
  } = useCultivation(farm?.id);

  // 수익 예측 연동
  const { prediction, isLoading: isRevenueLoading, getPrediction, revertPrediction } = useRevenue();
  const [actualYield, setActualYield] = useState<number | ''>('');

  const handleCalculateRevenue = useCallback(() => {
    if (!farm || farm.cropNames.length === 0) return;
    const mainCrop = farm.cropNames[0];
    const area = cultivations.find(c => c.cropName === mainCrop)?.cultivationArea || farm.area;
    
    const request: any = {
      crop_name: mainCrop,
      area_sqm: area,
      farm_id: farm.id,
    };
    
    if (actualYield !== '') {
      request.actual_yield_kg = Number(actualYield);
    }
    
    if (weather) {
       request.weather_context = `현재 양평 날씨: 기온 ${weather.tmp}도, 강수형태 ${weather.pty}, 하늘상태 ${weather.sky}`;
    }
    
    getPrediction(request);
  }, [farm, cultivations, actualYield, weather, getPrediction]);

  const handleResetRevenue = useCallback(() => {
    setActualYield('');
    revertPrediction();
  }, [revertPrediction]);

  // Initial fetch for revenue
  useEffect(() => {
    if (activeSubTab === 'DASHBOARD' && farm && farm.cropNames.length > 0 && !prediction && !isRevenueLoading) {
      handleCalculateRevenue();
    }
  }, [activeSubTab, farm, cultivations, prediction, isRevenueLoading, handleCalculateRevenue]);

  // 통합 새로고침
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshHistories(), refreshCultivations()]);
  }, [refreshHistories, refreshCultivations]);

  // AI 추천 최근 이력 및 예상 수익 계산
  useEffect(() => {
    if (farm?.id) {
      getLatestRecommendHistory(farm.id)
        .then(res => {
          let aiScore = null;
          let recommendations: any[] = [];
          
          if (res && res.recommendations && res.recommendations.length > 0) {
            aiScore = res.recommendations[0].score;
            recommendations = res.recommendations;
          }
          setLatestAiScore(aiScore);
          
          // 사용자가 등록한 재배 작물의 예상 수익 합산
          // 계산식: 등록된 작물의 예상 수확량(kg) * 해당 작물의 예상 수익(원/kg)
          let estimatedTotal = 0;
          if (cultivations && cultivations.length > 0) {
            cultivations.forEach(c => {
              // AI 추천 목록에서 해당 작물의 단가를 찾음 (없으면 기본값 3000원)
              const rec = recommendations.find((r: any) => r.cropId === c.cropId);
              const pricePerKg = rec?.expectedRevenuePerKg || 3000;
              const yieldAmount = c.farmerEstimatedYield || 0;
              estimatedTotal += yieldAmount * pricePerKg;
            });
          }
          setMonthlyRevenue(estimatedTotal);
        })
        .catch(() => {
          setLatestAiScore(null);

          // 추천 이력을 못 불러왔더라도, 재배 작물이 있다면 기본 단가(3000원)로 계산
          let estimatedTotal = 0;
          if (cultivations && cultivations.length > 0) {
            cultivations.forEach(c => {
              const yieldAmount = c.farmerEstimatedYield || 0;
              estimatedTotal += yieldAmount * 3000;
            });
          }
          setMonthlyRevenue(estimatedTotal);
        });
    } else {
      setLatestAiScore(null);
      setMonthlyRevenue(0);
    }
  }, [farm?.id, cultivations]);

  const isLoading = isFarmsLoading;

  // 수정 버튼 클릭 핸들러
  const handleEditClick = (id: number, content: string) => {
    setEditingHistoryId(id);
    setEditingContent(content);
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
  };

  // 저장/수정 실행 핸들러
  const handleSaveHistory = async (content: string) => {
    if (editingHistoryId) {
      return await updateHistory(editingHistoryId, content);
    } else {
      return await addHistory(content);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 농장이 하나도 없는 경우 -> 미리보기 모드 제공
  if (farms.length === 0) {
    const previewFarm = DUMMY_FARM;
    return (
      <div className={styles.container}>
        <div data-guide="farm-guest-banner">
          <PolicyRecommendGuideBanner userRole={userRole} farmCount={farms.length} variant="inline" />
        </div>
        <div className={styles.header}>
          <div data-guide="farm-guest-preview">
            <h1 className={styles.title}>내 농장 <span className={styles.italic}>미리보기</span></h1>
            <p className={styles.subtitle}>농업인 인증 시 실제 본인의 농장 데이터를 관리할 수 있습니다.</p>
          </div>
          <div className={styles.headerButtons}>
            <Link href="/signup?type=farmer" data-guide="farm-guest-certify">
              <Button variant="primary" style={{ borderRadius: '50px' }}>농업인 인증하기</Button>
            </Link>
          </div>
        </div>
        <div className={styles.kpiRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }} data-guide="farm-guest-kpi">
          <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)', opacity: 0.7 }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>농장 전체 면적</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>{previewFarm.area.toLocaleString()}㎡</p>
          </div>
          <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)', opacity: 0.7 }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>재배 중인 면적</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>330㎡</p>
          </div>
          <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)', opacity: 0.7 }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>재배 작물</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>2종</p>
          </div>
          <div className={styles.kpiCard} style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '24px', borderRadius: 'var(--radius-lg)', opacity: 0.7 }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>예상 수익 (월)</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>₩3,500,000</p>
          </div>
        </div>

        <div data-guide="farm-guest-interaction">
          <div style={{ background: 'rgba(255, 255, 255, 0.5)', filter: 'grayscale(0.5)', pointerEvents: 'none', userSelect: 'none' }}>
           <Card>
             <h3 style={{ marginBottom: '20px' }}>농장 인터랙션 미리보기</h3>
             <p>실제 농장 데이터가 등록되면 상세한 분석 리포트와 실시간 날씨 정보를 확인할 수 있습니다.</p>
             <div style={{ height: '200px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
               [ 대시보드 차트 및 지도 영역 샘플 ]
             </div>
           </Card>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
          <Link href="/farm/register" style={{ textDecoration: 'none' }}>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text-light)', height: '100%', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(16,185,129,0.02)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-light)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>＋</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>새로운 농장 등록하기</div>
              <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>등록된 농장이 없습니다. 농장을 등록해 주세요.</p>
            </div>
          </Link>
          {hasUnapprovedFarms && (
            <Link href="/mypage/farm-applications" style={{ textDecoration: 'none' }}>
              <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text)', height: '100%', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--color-bg)' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>심사 현황 확인하기</div>
                <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8, color: 'var(--color-text-light)' }}>현재 마이페이지에서 심사 대기 중인 농장이 있습니다.</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 농장 목록 뷰 (농장이 2개 이상일 때)
  if (isListView && farms.length > 1) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>내 농장 <span className={styles.italic}>선택</span></h1>
            <p className={styles.subtitle}>관리할 농장을 선택하거나 새로운 농장을 등록하세요.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginTop: '32px' }} data-guide="farm-list">
          {farms.map((f, idx) => (
            <div
                key={f.id}
                onClick={() => { setSelectedFarmIdx(idx); setIsListView(false); }}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ paddingRight: '20px' }}>
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
            {farms.length > 1 ? (
              <span style={{ cursor: 'pointer', color: 'var(--color-text-light)' }} onClick={() => setIsListView(true)}> 내 농장</span>
            ) : (
              <span style={{ color: 'var(--color-text-light)' }}> 내 농장</span>
            )} / {activeSubTab === 'DASHBOARD' ? '관리' : '정보'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {farms.length > 1 && (
              <button
                onClick={() => setIsListView(true)}
                style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="목록으로 돌아가기"
              >
                ←
              </button>
            )}
            <h1 className={styles.title}>{activeSubTab === 'DASHBOARD' ? '내 농장 관리' : farm?.name}</h1>
          </div>
          <p className={styles.subtitle}>
            {activeSubTab === 'DASHBOARD'
              ? `${farm?.name}의 현황을 한눈에 확인하세요.`
              : '농장 정보 및 재배 히스토리를 확인하고 기록하세요.'}
          </p>
        </div>
        <div className={styles.headerButtons}>
          <UnifiedActionButton onAddHistory={() => setIsHistoryModalOpen(true)} data-guide="farm-register" />
          {activeSubTab === 'HISTORY' && (
            <Link href="/farm/register">
              <Button variant="outline" style={{ borderRadius: '50px' }}>+ 새 농장 등록</Button>
            </Link>
          )}
        </div>
      </div>

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveHistory}
        farmName={farm?.name || ''}
        initialContent={editingContent}
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
          onClick={() => setActiveSubTab('DASHBOARD')}
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
          onClick={() => setActiveSubTab('HISTORY')}
        >
          농장 정보
        </button>
      </div>

      {activeSubTab === 'DASHBOARD' && (
        <>
          {/* KPI 카드 Row (Dashboard 전용) */}
          <div className={styles.kpiRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }} data-guide="farm-farmer-kpi">
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
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '8px' }}>현재 작물의 예상 수익</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                {isRevenueLoading ? '계산 중...' : `₩${(prediction?.predicted_revenue || 0).toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* AI 예측 수확량 및 인사이트 패널 */}
          {farm && farm.cropNames.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '1px solid var(--color-primary)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }} data-guide="farm-farmer-insight">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--color-primary)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>AI 예측 인사이트</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{farm.cropNames[0]} 수익 분석</h3>
                </div>
                {prediction && (
                  <Badge variant="lime">신뢰도: {prediction.confidence}</Badge>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* 좌측: 수확량 및 단가 정보 */}
                <div style={{ background: '#fff', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>AI 예측 수확량</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {prediction ? `${(prediction.predicted_yield_kg || 0).toLocaleString()} kg` : '-'}
                    </span>
                  </div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>KAMIS 도매 시세 (1kg)</span>
                    <span style={{ fontSize: '18px', fontWeight: 700 }}>
                      {prediction ? `₩${(prediction.predicted_price_per_kg || 0).toLocaleString()}` : '-'}
                    </span>
                  </div>
                  
                  {/* 실제 수확량 입력 (Override) */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--color-border)' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                      💡 실제 수확량이 다르다면 직접 입력해주세요. 이를 바탕으로 예상 수익이 다시 계산됩니다.
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="number" 
                        placeholder="실제 수확량 (kg)" 
                        value={actualYield}
                        onChange={(e) => setActualYield(e.target.value ? Number(e.target.value) : '')}
                        style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '14px' }}
                      />
                      <Button variant="outline" size="sm" onClick={handleResetRevenue} disabled={isRevenueLoading || actualYield === ''}>
                        되돌리기
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCalculateRevenue} disabled={isRevenueLoading}>
                        {isRevenueLoading ? '계산 중...' : '적용'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* 우측: AI 설명 (Insight) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>📈 시세 전망</h4>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-light)', lineHeight: 1.5 }}>
                      {prediction?.price_insight || 'AI 분석 데이터를 불러오고 있습니다...'}
                    </p>
                  </div>
                  <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#b45309' }}>💡 종합 수익 분석</h4>
                    <p style={{ fontSize: '14px', color: '#92400e', lineHeight: 1.5 }}>
                      {prediction?.revenue_insight || 'AI 분석 데이터를 불러오고 있습니다...'}
                    </p>
                  </div>
                </div>
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
          <div className={styles.grid2} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
            <div data-guide="farm-farmer-recent">
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>최근 활동</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveSubTab('HISTORY')}>전체보기 →</Button>
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
                  {histories.slice(0, 5).map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
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
                <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 600 }}>"{farm?.cropNames.length ? farm.cropNames[0] : '작물'} 생육 최적기입니다"</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                기온 상승과 최근 관수 기록을 분석할 때 작물의 생육이 매우 활발합니다.
                <strong>내일 오전 추가 시비</strong>를 권장하며, 기온이 높으니 <strong>병해충 방제</strong>에 유의하세요.
              </p>
            </div>
          </div>

          <div className={styles.grid2} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
            <div>
              {/* Sub Navigation (History 전용) */}
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '32px', display: 'flex', gap: '32px' }}>
                {(['POLICY', 'HISTORY'] as const).map((tab) => (
                  <button
                    key={tab}
                    style={{ background: 'none', border: 'none', color: (activeSubTab as string) === tab ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: (activeSubTab as string) === tab ? 700 : 600, borderBottom: (activeSubTab as string) === tab ? '2px solid var(--color-primary)' : 'none', paddingBottom: '16px', marginBottom: '-17px', cursor: 'pointer', fontSize: '16px' }}
                    onClick={() => setActiveSubTab(tab)}
                  >
                    {tab === 'POLICY' ? '정책/혜택 안내' : '재배 히스토리'}
                  </button>
                ))}
              </div>



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

            {/* 농장 정보 사이드 카드 */}
            <div>
              <Card variant="dark">
                <h3 className={styles.farmInfoTitle} style={{ fontSize: '18px', marginBottom: '16px' }}>농장 정보</h3>
                <dl className={styles.farmInfoList}>
                  <dt>위치</dt><dd>{farm?.address}</dd>
                  <dt>면적</dt><dd>{farm?.area.toLocaleString()} ㎡ ({Math.round((farm?.area || 0) / 3.3058)}평)</dd>
                  <dt>주요 작물</dt><dd>{farm?.cropNames.join(', ')}</dd>
                  <dt>상태</dt>
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


