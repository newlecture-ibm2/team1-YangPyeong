'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from '../gov.module.css';
import { useGovUser, getTestHeaders } from '../useGovUser';
import GovTabs from '../_components/GovTabs';
import { useGovChat } from '../_components/GovChatProvider';
import Spinner from '@/components/common/Spinner/Spinner';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import SearchInput from '@/components/common/SearchInput/SearchInput';
import Pagination from '@/components/common/Pagination';

interface WarningItem {
  cropName: string;
  supplyRate: number;
  status: string;
  level: string;
  advice: string;
}

export default function GovBalancePage() {
  const { user, loading: userLoading } = useGovUser();
  const { setPageContext } = useGovChat();
  const [items, setItems] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('전체');
  const [levelFilter, setLevelFilter] = useState('전체');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('공급률 높은 순');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('/api/gov/dashboard', { headers: getTestHeaders() })
      .then(r => r.json())
      .then(res => { 
        if(res.data?.warningItems) setItems(res.data.warningItems);
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  // ── 화면 데이터를 챗봇 pageContext로 등록 ──
  useEffect(() => {
    if (items.length > 0) {
      setPageContext({
        pageType: 'balance',
        pageTitle: '수급 분석',
        balanceItems: items.map(i => ({
          cropName: i.cropName,
          supplyRate: i.supplyRate,
          status: i.status,
          level: i.level,
          advice: i.advice,
        })),
      });
    }
    return () => setPageContext(null);
  }, [items, setPageContext]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (statusFilter !== '전체') {
      result = result.filter(item => item.status === statusFilter);
    }
    if (levelFilter !== '전체') {
      result = result.filter(item => item.level === levelFilter);
    }
    if (searchKeyword.trim()) {
      result = result.filter(item => item.cropName.includes(searchKeyword.trim()));
    }

    result.sort((a, b) => {
      if (sortBy === '공급률 높은 순') return b.supplyRate - a.supplyRate;
      if (sortBy === '공급률 낮은 순') return a.supplyRate - b.supplyRate;
      if (sortBy === '작물명순') return a.cropName.localeCompare(b.cropName);
      return 0;
    });

    return result;
  }, [items, statusFilter, levelFilter, searchKeyword, sortBy]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const summary = useMemo(() => {
    return {
      caution: items.filter(i => i.level === '주의').length,
      surplus: items.filter(i => i.status === '과잉').length,
      shortage: items.filter(i => i.status === '부족').length,
      urgent: items.filter(i => i.level === '긴급').length,
    };
  }, [items]);

  const KPI_CONFIG = [
    { id: 'caution', label: '주의 품목', theme: styles.kpiThemeNeutral, count: summary.caution },
    { id: 'surplus', label: '과잉 품목', theme: styles.kpiThemeOrange, count: summary.surplus },
    { id: 'shortage', label: '부족 품목', theme: styles.kpiThemeBlue, count: summary.shortage },
    { id: 'urgent', label: '긴급 품목', theme: styles.kpiThemeDanger, count: summary.urgent }
  ];

  if (userLoading || loading) return <div className={styles.page}><Spinner /></div>;
  if (!user || user.role !== 'GOV') return <div className={styles.page}><p>지자체 관리자만 접근할 수 있습니다.</p></div>;

  const region = user.regionName || '지자체';

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>홈 / 지자체 / 수급 분석</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 className="page-title">수급 <em>분석</em></h1>
          </div>
          <p className={styles.pageSub} style={{ marginTop: '8px' }}>
            {region} 주요 작물의 공급률과 수급 위험 상태를 확인하세요.
          </p>
          <div className={styles.tabsWrapper}>
            <GovTabs />
          </div>
        </div>
      </div>

      <div className={styles.kpiRow}>
        {KPI_CONFIG.map(config => (
          <div key={config.id} className={`${styles.kpiCard} ${config.theme}`}>
            <div className={styles.kpiCardHeader}>
              <span className={styles.kpiCardLabel}>{config.label}</span>
            </div>
            <div className={styles.kpiCardValue}>{config.count}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.formGroup} style={{ marginBottom: 0, minWidth: '130px' }}>
          <Dropdown
            options={[
              { value: '전체', label: '상태: 전체' },
              { value: '과잉', label: '과잉' },
              { value: '부족', label: '부족' }
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setCurrentPage(0); }}
            size="md"
          />
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 0, minWidth: '130px' }}>
          <Dropdown
            options={[
              { value: '전체', label: '경고: 전체' },
              { value: '긴급', label: '긴급' },
              { value: '주의', label: '주의' },
              { value: '관심', label: '관심' }
            ]}
            value={levelFilter}
            onChange={(v) => { setLevelFilter(v); setCurrentPage(0); }}
            size="md"
          />
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 0, width: '160px' }}>
          <Dropdown
            options={[
              { value: '공급률 높은 순', label: '공급률 높은 순' },
              { value: '공급률 낮은 순', label: '공급률 낮은 순' },
              { value: '작물명순', label: '작물명순' }
            ]}
            value={sortBy}
            onChange={(v) => { setSortBy(v); setCurrentPage(0); }}
            size="md"
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <SearchInput
            placeholder="작물명 검색..."
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(0); }}
            onSearch={() => setCurrentPage(0)}
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className={styles.colCrop}>작물</th>
              <th className={`${styles.numberCell} ${styles.colSupply}`}>현재 공급률</th>
              <th className={`${styles.statusCell} ${styles.colStatus}`}>상태</th>
              <th className={`${styles.statusCell} ${styles.colLevel}`}>경고 수준</th>
              <th className={styles.colAdvice}>권고 사항</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)' }}>
                  조건에 맞는 수급 품목이 없습니다.
                </td>
              </tr>
            )}
            {currentItems.map((item, i) => (
              <tr key={i}>
                <td className={styles.tdBold} data-label="작물">{item.cropName}</td>
                <td className={styles.numberCell} data-label="현재 공급률">{Number(item.supplyRate).toFixed(2)}%</td>
                <td className={styles.statusCell} data-label="상태">
                  <span className={`${styles.badge} ${item.status === '과잉' ? styles.badgeRed : (item.status === '정상' ? styles.badgeGreen : styles.badgeOrange)}`}>
                    {item.status}
                  </span>
                </td>
                <td className={styles.statusCell} data-label="경고 수준">
                  <span className={`${styles.badge} ${item.level === '긴급' ? styles.badgeRed : (item.level === '주의' ? styles.badgeOrange : '')}`}>
                    {item.level}
                  </span>
                </td>
                <td className={styles.adviceCell} data-label="권고 사항">{item.advice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  );
}
