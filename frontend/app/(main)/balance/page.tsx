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
import YangpyeongGridMap from './_components/YangpyeongGridMap';
import Pagination from '@/components/common/Pagination';
import styles from './page.module.css';

const TOWN_CODE_MAP: Record<string, string> = {
  '양평읍': '4183010',
  '강상면': '4183020',
  '강하면': '4183030',
  '양서면': '4183040',
  '옥천면': '4183050',
  '서종면': '4183060',
  '단월면': '4183070',
  '청운면': '4183080',
  '양동면': '4183090',
  '지평면': '4183100',
  '용문면': '4183110',
  '개군면': '4183120',
};

function getTownNameByCode(code: string | null): string {
  if (!code) return '양평군 전체';
  const entry = Object.entries(TOWN_CODE_MAP).find(([_, value]) => value === code);
  return entry ? entry[0] : '선택된 지역';
}

/** 수급 상태 → Badge variant 매핑 */
function getStatusBadgeVariant(status: string): 'green' | 'orange' | 'red' | 'lime' | 'blue' | 'gray' {
  switch (status) {
    case 'BALANCED': return 'green';
    case 'EXCESS_CAUTION': return 'orange';
    case 'EXCESS_WARN': return 'red';
    case 'SHORT_CAUTION': return 'lime';
    case 'SHORT_WARN': return 'blue';
    case 'UNKNOWN': return 'orange';
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
  // 유저가 지도에서 선택한 읍면동 이름 (백엔드 응답이 아닌 프론트에서 직접 추적)
  const [activeTownName, setActiveTownName] = useState<string | null>(null);

  const approvedFarms = allFarms.filter(f => f.certificationStatus === 'APPROVED');
  const hasUnapprovedFarms = allFarms.length > approvedFarms.length;
  const isPreviewMode = !isFarmsLoading && approvedFarms.length === 0;

  // 읍면동 대시보드 데이터 로드
  const loadDashboard = useCallback(async (townCode?: string, townName?: string) => {
    try {
      setIsDashboardLoading(true);
      const data = await fetchBalanceDashboard(townCode);
      setDashboard(data);
      // 초기 로드(townName 미지정)시 백엔드가 내려준 이름 사용, 클릭 시에는 직접 전달된 이름 사용
      if (townName) {
        setActiveTownName(townName);
      } else if (data.selectedTownName && data.selectedTownName !== '선택된 지역') {
        setActiveTownName(data.selectedTownName);
      } else if (data.selectedTownCode) {
        setActiveTownName(getTownNameByCode(data.selectedTownCode));
      } else {
        setActiveTownName(null);
      }
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
          statusLabel: '공급 부족 경고',
          baseYear: new Date().getFullYear(),
          message: '현재 공급량이 수요 대비 현저히 부족하여 가격 상승세가 예상됩니다.',
        },
        {
          cropName: '양파',
          supplyRatio: 120,
          status: 'EXCESS_WARN',
          statusLabel: '공급 과잉 경고',
          baseYear: new Date().getFullYear(),
          message: '지역 내 생산량 증가로 인한 과잉 상태로, 판로 다양화 지원이 필요합니다.',
        },
        {
          cropName: '대파',
          supplyRatio: 100,
          status: 'BALANCED',
          statusLabel: '수급 적정',
          baseYear: new Date().getFullYear(),
          message: '생산량과 지역 수요가 균형을 이루어 수급 상태가 가장 안정적입니다.',
        }
      ];
      const sortedDummy = [...dummyData].sort((a, b) => a.supplyRatio - b.supplyRatio);
      setBalances(sortedDummy);
      setFilteredBalances(sortedDummy);
      setIsLoading(false);
      setIsDashboardLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchAllBalances();
        const sortedData = [...data].sort((a, b) => a.supplyRatio - b.supplyRatio);
        setBalances(sortedData);
        setFilteredBalances(sortedData);
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
    let filtered = [...balances];
    if (searchQuery) {
      filtered = filtered.filter(b => b.cropName.includes(searchQuery));
    }
    if (statusFilter !== '전체 상태') {
      filtered = filtered.filter(b => b.statusLabel === statusFilter);
    }
    // 수급률 낮은 순 (공급 부족 심한 순) 정렬
    filtered.sort((a, b) => a.supplyRatio - b.supplyRatio);
    setFilteredBalances(filtered);
  }, [searchQuery, statusFilter, balances]);

  /** 읍면동 변경 핸들러 — 지도 클릭 시 이름도 함께 전달 */
  const handleTownChange = (townCode: string, townName?: string) => {
    loadDashboard(townCode || undefined, townName);
  };

  const top3 = balances.slice(0, 3);

  if (isLoading || isFarmsLoading) return <div className={styles.loading}>데이터를 불러오는 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>홈 / 내 농장 / 수급 현황</p>
          <h1 className={styles.pageTitle}>
            수급 <em>{isPreviewMode ? (hasUnapprovedFarms ? '심사 대기 중' : '미리보기') : '현황'}</em>
          </h1>
          <p className={styles.pageSub}>양평군 주요 작물의 실시간 공급·수요 밸런스를 확인하세요.</p>
        </div>
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
            activeTownName={null}
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
          activeTownName={activeTownName}
        />
      )}
    </div>
  );
}

// ========== 대시보드 카드 ==========

interface DashboardSectionProps {
  dashboard: BalanceDashboardData;
  isDashboardLoading: boolean;
  onTownChange: (townCode: string, townName?: string) => void;
  activeTownName: string | null;
}

function DashboardSection({ dashboard, isDashboardLoading, onTownChange, activeTownName }: DashboardSectionProps) {

  const { townSummary, totalSummary } = dashboard;
  const isWholeYangpyeong = !activeTownName;
  const displayTownName = activeTownName ?? '양평군 전체';

  const handleMapTownSelect = (townName: string) => {
    const code = TOWN_CODE_MAP[townName];
    if (code) {
      onTownChange(code, townName);
    }
  };

  // KOSIS 5대 공식 주요 작물 목록 정의
  const OFFICIAL_CROPS = new Set(['감자', '고구마', '고추', '메밀', '방울토마토']);

  // KOSIS 공식 작물(5대 주요 작물)과 농민 등록 온디맨드 작물(그 외 모든 작물) 분류
  const kosisTownCrops = townSummary.crops.filter(c => OFFICIAL_CROPS.has(c.cropName));
  const onDemandTownCrops = townSummary.crops.filter(c => !OFFICIAL_CROPS.has(c.cropName));

  const kosisTotalCrops = totalSummary.crops.filter(c => OFFICIAL_CROPS.has(c.cropName));
  const onDemandTotalCrops = totalSummary.crops.filter(c => !OFFICIAL_CROPS.has(c.cropName));

  return (
    <div className={styles.dashboardSection}>
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

      {/* 대조 카드: 우리 동네 vs 양평군 전체 스플릿 레이아웃 */}
      <div className={styles.dashboardSplitLayout}>
        
        {/* 좌측 맵 패널 */}
        <div className={styles.mapPanel}>
          <div className={styles.mapPanelHeader}>
            <h2 className={styles.mapPanelTitle}>양평군 지역별 현황 진단</h2>
            <p className={styles.mapPanelSub}>
              {isWholeYangpyeong ? '양평군 전체 기준 조회 중' : `${displayTownName} 선택됨`}
            </p>
          </div>
          <YangpyeongGridMap 
            selectedTownName={isWholeYangpyeong ? null : displayTownName} 
            onTownSelect={handleMapTownSelect} 
          />
        </div>

        {/* 우측 대시보드 리스트 (로딩 시 반투명 처리하여 스크롤 점핑 방지) */}
        <div className={styles.dashboardCards} style={{ opacity: isDashboardLoading ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: isDashboardLoading ? 'none' : 'auto' }}>
          {/* 우리 동네 카드 */}
          <Card className={styles.dashboardCard}>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardTitleLg}>🏡 {displayTownName} 실시간 수급</h3>
              {townSummary.farmCount > 0 && (
                <span className={styles.farmCountBadge}>참여 농가 {townSummary.farmCount}곳</span>
              )}
            </div>
            <div className={styles.cropGrid}>
              {kosisTownCrops.map((crop) => (
                <CropStatusRow key={crop.cropName} crop={crop} />
              ))}
              {kosisTownCrops.length === 0 && (
                <p className={styles.noCropText}>등록된 재배 정보가 없습니다.</p>
              )}
            </div>

            {/* 🌱 우리 동네 농가 자체 등록 온디맨드 작물 패널 */}
            {onDemandTownCrops.length > 0 && (
              <div className={styles.onDemandSection}>
                <div className={styles.onDemandHeader}>
                  <h4 className={styles.onDemandTitle}>
                    🌱 우리 동네 농가 자체 등록 작물
                  </h4>
                </div>
                <div className={styles.onDemandGrid}>
                  {onDemandTownCrops.map((crop) => (
                    <Link
                      href={`/balance/${encodeURIComponent(crop.cropName)}`}
                      key={crop.cropName}
                      className={`${styles.onDemandCard} ${styles[crop.status.toLowerCase()] || ''}`}
                    >
                      <div className={styles.onDemandCropHeader}>
                        <span className={styles.onDemandCropName}>{crop.cropName}</span>
                        <Badge variant={getStatusBadgeVariant(crop.status)}>
                          {crop.status === 'UNKNOWN' ? '집계중' : crop.statusLabel}
                        </Badge>
                      </div>
                      <div className={styles.onDemandCropVolume}>
                        {crop.currentSupplyKg.toLocaleString()} kg
                      </div>
                      <div className={styles.onDemandBadgeWrap}>
                        <span className={styles.onDemandStatusLabel}>
                          {crop.status === 'UNKNOWN' 
                            ? '농가 집계 진행중' 
                            : `수급률 ${crop.supplyRatio}% (기준 ${crop.standardYieldKg.toLocaleString()} kg)`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>


        </div>
      </div>

      <div className={styles.guideBanner} style={{ marginTop: '24px' }}>
        <span className={styles.guideIcon}>💡</span>
        <p className={styles.guideText}>
          <strong>읍면동별 수급 가이드</strong>: 본 현황은 통계청(KOSIS) 기준 <strong>양평군 5대 주요 작물(감자, 고구마, 고추, 메밀, 방울토마토)</strong>의 통합 수급 데이터를 기반으로 합니다. 각 읍면동마다 해당 지역의 <strong>농가/사업체 비율 가중치</strong>와 관내 농가들의 <strong>실시간 실제 재배량</strong>을 적용하여 수급률(%) 및 상태를 지역 맞춤형으로 동적 계산해 보여드립니다.
        </p>
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
  onTownChange: (townCode: string, townName?: string) => void;
  activeTownName: string | null;
}

function BalanceContent({
  top3, filteredBalances, statusFilter, setStatusFilter,
  searchQuery, setSearchQuery,
  dashboard, isDashboardLoading, onTownChange, activeTownName,
}: BalanceContentProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter, filteredBalances.length]);

  const totalPages = Math.ceil(filteredBalances.length / itemsPerPage);
  const paginatedBalances = filteredBalances.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <>
      {/* 읍면동 대시보드 (로그인 유저 전용) */}
      {dashboard && (
        <DashboardSection
          dashboard={dashboard}
          isDashboardLoading={isDashboardLoading}
          onTownChange={onTownChange}
          activeTownName={activeTownName}
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

      {/* LIST SECTION HEADER */}
      <div className={styles.listSectionHeader}>
        <h2 className={styles.listTitle}>📊 양평군 주요 작물 수급 상세 리스트</h2>
        <p className={styles.listDesc}>
          각 작물별 수급률과 현재 상태를 확인하고, 상세보기를 눌러 AI의 정밀 진단 리포트를 받아보세요.
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
          <option>수급 적정</option>
          <option>공급 과잉 주의</option>
          <option>공급 과잉 경고</option>
          <option>공급 부족 주의</option>
          <option>공급 부족 경고</option>
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
            {paginatedBalances.map((item) => (
              <tr key={item.cropName}>
                <td><strong>{item.cropName}</strong></td>
                <td>{item.status === 'UNKNOWN' ? '집계중' : `${item.supplyRatio}%`}</td>
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
        {filteredBalances.length === 0 && (
          <div className={styles.emptyList}>검색 조건에 맞는 작물이 없습니다.</div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', paddingBottom: '40px' }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
