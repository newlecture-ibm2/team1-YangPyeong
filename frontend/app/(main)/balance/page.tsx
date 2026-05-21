'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Badge from '@/components/common/Badge/Badge';
import Card from '@/components/common/Card/Card';
import SearchInput from '@/components/common/SearchInput/SearchInput';
import MockupOverlay from '@/components/common/MockupOverlay/MockupOverlay';
import { fetchAllBalances, fetchBalanceDashboard, BalanceAnalysisResponse, BalanceDashboardData, CropSupplyItem } from './_lib/balance.api';
import { useMyFarms } from '../farm/useFarm';
import { DUMMY_BALANCE } from '@/lib/preview-data';
import styles from './page.module.css';

/** 수급 상태 → Badge variant 매핑 */
function getStatusBadgeVariant(status: string): 'green' | 'orange' | 'red' | 'lime' | 'blue' | 'gray' {
  switch (status) {
    case 'BALANCED': return 'green';
    case 'EXCESS_CAUTION': return 'orange';
    case 'EXCESS_WARN': return 'red';
    case 'SHORT_CAUTION': return 'lime';
    case 'SHORT_WARN': return 'blue';
    default: return 'gray';
  }
}

/** 수급 상태 → 신호등 이모지 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'BALANCED': return '🟢';
    case 'EXCESS_CAUTION': return '🟡';
    case 'EXCESS_WARN': return '🔴';
    case 'SHORT_CAUTION': return '🟡';
    case 'SHORT_WARN': return '🔴';
    default: return '⚪';
  }
}

export default function BalanceListPage() {
  const { farms: allFarms, isLoading: isFarmsLoading } = useMyFarms();
  const [balances, setBalances] = useState<BalanceAnalysisResponse[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<BalanceAnalysisResponse[]>([]);
  const [dashboard, setDashboard] = useState<BalanceDashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체 상태');

  const approvedFarms = allFarms.filter(f => f.certificationStatus === 'APPROVED');
  const hasUnapprovedFarms = allFarms.length > approvedFarms.length;
  const isPreviewMode = !isFarmsLoading && approvedFarms.length === 0;

  // 읍면동 대시보드 데이터 로드
  const loadDashboard = useCallback(async (townCode?: string) => {
    try {
      setIsDashboardLoading(true);
      const data = await fetchBalanceDashboard(townCode);
      setDashboard(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '대시보드 데이터를 불러오는 중 오류가 발생했습니다.';
      console.error('[Balance Dashboard]', message);
      // 대시보드 로드 실패 시 null로 두고, 기존 테이블은 정상 표시
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFarmsLoading) return;
    if (isPreviewMode) {
      const dummyData: BalanceAnalysisResponse[] = [
        {
          cropName: DUMMY_BALANCE.cropName,
          supplyRatio: DUMMY_BALANCE.ratio,
          status: 'SHORT_WARN',
          statusLabel: '부족경고',
          baseYear: new Date().getFullYear(),
          message: '현재 공급량이 수요 대비 현저히 부족하여 가격 상승세가 예상됩니다.',
        },
        {
          cropName: '양파',
          supplyRatio: 120,
          status: 'EXCESS_WARN',
          statusLabel: '과잉경고',
          baseYear: new Date().getFullYear(),
          message: '지역 내 생산량 증가로 인한 과잉 상태로, 판로 다양화 지원이 필요합니다.',
        },
        {
          cropName: '대파',
          supplyRatio: 100,
          status: 'BALANCED',
          statusLabel: '적정',
          baseYear: new Date().getFullYear(),
          message: '생산량과 지역 수요가 균형을 이루어 수급 상태가 가장 안정적입니다.',
        }
      ];
      setBalances(dummyData);
      setFilteredBalances(dummyData);
      setIsLoading(false);
      setIsDashboardLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchAllBalances();
        setBalances(data);
        setFilteredBalances(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    loadDashboard();
  }, [isFarmsLoading, isPreviewMode, loadDashboard]);

  useEffect(() => {
    let filtered = balances;
    if (searchQuery) {
      filtered = filtered.filter(b => b.cropName.includes(searchQuery));
    }
    if (statusFilter !== '전체 상태') {
      filtered = filtered.filter(b => b.statusLabel === statusFilter);
    }
    setFilteredBalances(filtered);
  }, [searchQuery, statusFilter, balances]);

  /** 읍면동 변경 핸들러 */
  const handleTownChange = (townCode: string) => {
    loadDashboard(townCode || undefined);
  };

  const top3 = balances.slice(0, 3);

  if (isLoading || isFarmsLoading) return <div className={styles.loading}>데이터를 불러오는 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>홈 / 내 농장 / 수급 현황</p>
        <h1 className={styles.pageTitle}>
          수급 <span className={styles.italic}>{isPreviewMode ? (hasUnapprovedFarms ? '심사 대기 중' : '미리보기') : '현황'}</span>
        </h1>
        <p className={styles.pageSub}>양평군 주요 작물의 실시간 공급·수요 밸런스를 확인하세요.</p>
      </div>

      <div className={styles.tabs}>
        <Link href="/farm">대시보드</Link>
        <Link href="/balance" className={styles.activeTab}>수급 분석</Link>
        <Link href="/farm/recommend">AI 작물 추천</Link>
        <Link href="/farm?tab=history">농장 일지</Link>
      </div>

      {isPreviewMode ? (
        <MockupOverlay hasUnapprovedFarms={hasUnapprovedFarms}>
          <BalanceContent
            top3={top3}
            filteredBalances={filteredBalances}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dashboard={null}
            isDashboardLoading={false}
            onTownChange={handleTownChange}
          />
        </MockupOverlay>
      ) : (
        <BalanceContent
          top3={top3}
          filteredBalances={filteredBalances}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dashboard={dashboard}
          isDashboardLoading={isDashboardLoading}
          onTownChange={handleTownChange}
        />
      )}
    </div>
  );
}

// ========== 대시보드 카드 ==========

interface DashboardSectionProps {
  dashboard: BalanceDashboardData;
  isDashboardLoading: boolean;
  onTownChange: (townCode: string) => void;
}

function DashboardSection({ dashboard, isDashboardLoading, onTownChange }: DashboardSectionProps) {
  if (isDashboardLoading) {
    return <div className={styles.dashboardLoading}>대시보드 데이터를 불러오는 중...</div>;
  }

  const { userTowns, selectedTownCode, selectedTownName, townSummary, totalSummary } = dashboard;
  const hasTowns = userTowns && userTowns.length > 0;
  const isWholeYangpyeong = !selectedTownCode;

  return (
    <div className={styles.dashboardSection}>
      {/* 읍면동 선택 */}
      <div className={styles.dashboardHeader}>
        <div className={styles.dashboardTitleRow}>
          <span className={styles.dashboardIcon}>⚖️</span>
          <h2 className={styles.dashboardTitle}>
            {isWholeYangpyeong ? '양평군 전체' : `${selectedTownName}`} 실시간 수급 현황
          </h2>
        </div>
        {hasTowns && userTowns.length > 1 && (
          <select
            id="town-select"
            className={styles.townSelect}
            value={selectedTownCode || ''}
            onChange={(e) => onTownChange(e.target.value)}
          >
            {userTowns.map((town) => (
              <option key={town.code} value={town.code}>
                {town.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 신규 가입자 폴백 가이드 배너 */}
      {isWholeYangpyeong && (
        <div className={styles.fallbackBanner}>
          <span className={styles.fallbackIcon}>🌱</span>
          <p className={styles.fallbackText}>
            아직 등록된 농장이 없어 <strong>양평군 전체</strong> 현황을 보여드립니다.
            <Link href="/farm/register" className={styles.fallbackLink}> 농장을 등록하면</Link> 우리 동네의 수급 상황을 확인할 수 있어요!
          </p>
        </div>
      )}

      {/* 대조 카드: 우리 동네 vs 양평군 전체 */}
      <div className={styles.dashboardCards}>
        {/* 우리 동네 카드 */}
        <Card className={styles.dashboardCard}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.cardTitleLg}>🏡 {townSummary.label}</h3>
            {townSummary.farmCount > 0 && (
              <span className={styles.farmCountBadge}>참여 농가 {townSummary.farmCount}곳</span>
            )}
          </div>
          <div className={styles.cropGrid}>
            {townSummary.crops.slice(0, 5).map((crop) => (
              <CropStatusRow key={crop.cropName} crop={crop} />
            ))}
            {townSummary.crops.length === 0 && (
              <p className={styles.noCropText}>등록된 재배 정보가 없습니다.</p>
            )}
          </div>
        </Card>

        {/* 양평군 전체 카드 */}
        {!isWholeYangpyeong && (
          <Card className={styles.dashboardCard}>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardTitleLg}>🏔️ {totalSummary.label}</h3>
            </div>
            <div className={styles.cropGrid}>
              {totalSummary.crops.slice(0, 5).map((crop) => (
                <CropStatusRow key={crop.cropName} crop={crop} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function CropStatusRow({ crop }: { crop: CropSupplyItem }) {
  return (
    <div className={styles.cropRow}>
      <span className={styles.cropEmoji}>{getStatusEmoji(crop.status)}</span>
      <span className={styles.cropNameText}>{crop.cropName}</span>
      <span className={styles.cropRatio}>{crop.supplyRatio}%</span>
      <Badge variant={getStatusBadgeVariant(crop.status)}>{crop.statusLabel}</Badge>
    </div>
  );
}

// ========== 메인 콘텐츠 ==========

interface BalanceContentProps {
  top3: BalanceAnalysisResponse[];
  filteredBalances: BalanceAnalysisResponse[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  dashboard: BalanceDashboardData | null;
  isDashboardLoading: boolean;
  onTownChange: (townCode: string) => void;
}

function BalanceContent({
  top3, filteredBalances, statusFilter, setStatusFilter,
  searchQuery, setSearchQuery,
  dashboard, isDashboardLoading, onTownChange,
}: BalanceContentProps) {
  return (
    <>
      {/* 읍면동 대시보드 (로그인 유저 전용) */}
      {dashboard && (
        <DashboardSection
          dashboard={dashboard}
          isDashboardLoading={isDashboardLoading}
          onTownChange={onTownChange}
        />
      )}

      {/* TOP 3 SUMMARY (대시보드가 없을 때만 렌더링하여 중복 정보 피로도 방지) */}
      {!dashboard && (
        <div className={styles.topSummary} data-guide="balance-summary">
          {top3.map((item) => (
            <Card key={item.cropName} className={styles.summaryCard}>
              <p className={styles.cardLabel}>{item.cropName}</p>
              <div className={styles.summaryInfo}>
                <span className={styles.ratioValue}>공급률 {item.supplyRatio}%</span>
                <Badge variant={getStatusBadgeVariant(item.status)}>{item.statusLabel}</Badge>
              </div>
              <div className={styles.gaugeBar}>
                <div
                  className={`${styles.gaugeFill} ${styles[item.status.toLowerCase()]}`}
                  style={{ width: `${Math.min(item.supplyRatio, 100)}%` }}
                ></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* GUIDE BANNER */}
      <div className={styles.guideBanner}>
        <span className={styles.guideIcon}>💡</span>
        <p className={styles.guideText}>
          각 작물별 <strong>기준 연도</strong>는 지자체(KOSIS, 농촌진흥청 등)의 최신 공식 통계 데이터 발표 시점을 기준으로 설정되어 실시간 수급 분석의 정합성을 보장합니다.
          <span style={{ fontSize: '13px', display: 'block', marginTop: '6px', opacity: 0.85, lineHeight: 1.5 }}>
            ※ 현재 2025년도 공식 생산량 확정 통계는 통계청의 공표 대기 상태로, 시스템이 공인 최신 유효 연도 데이터를 자동으로 매핑 및 분석에 적용하고 있습니다.
          </span>
        </p>
      </div>

      {/* FILTER BAR */}
      <div className={styles.filterSection}>
        <select
          className={styles.selectInput}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>전체 상태</option>
          <option>적정</option>
          <option>과잉주의</option>
          <option>과잉경고</option>
          <option>부족주의</option>
          <option>부족경고</option>
        </select>
        <div style={{ flex: 1 }}>
          <SearchInput
            placeholder="🔍 작물명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className={styles.tableWrap} data-guide="balance-table">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>작물</th>
              <th>공급률</th>
              <th>상태</th>
              <th>기준 연도</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredBalances.map((item) => (
              <tr key={item.cropName}>
                <td><strong>{item.cropName}</strong></td>
                <td>{item.supplyRatio}%</td>
                <td><Badge variant={getStatusBadgeVariant(item.status)}>{item.statusLabel}</Badge></td>
                <td>{item.baseYear}년</td>
                <td>
                  <Link href={`/balance/${encodeURIComponent(item.cropName)}`} className={styles.detailLink}>
                    상세보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
