'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Badge from '@/components/common/Badge/Badge';
import Card from '@/components/common/Card/Card';
import FilterBar from '@/components/common/FilterBar/FilterBar';
import SearchInput from '@/components/common/SearchInput/SearchInput';
import { fetchAllBalances, BalanceAnalysisResponse } from './_lib/balance.api';
import styles from './page.module.css';

export default function BalanceListPage() {
  const [balances, setBalances] = useState<BalanceAnalysisResponse[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<BalanceAnalysisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체 상태');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAllBalances();
        setBalances(data);
        setFilteredBalances(data);
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'BALANCED': return 'green';
      case 'EXCESS_CAUTION': return 'orange';
      case 'EXCESS_WARN': return 'red';
      case 'SHORT_CAUTION': return 'lime';
      case 'SHORT_WARN': return 'blue';
      default: return 'gray';
    }
  };

  const top3 = balances.slice(0, 3);

  if (isLoading) return <div className={styles.loading}>데이터를 불러오는 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>홈 / 내 농장 / 수급 현황</p>
        <h1 className={styles.pageTitle}>수급 <span className={styles.italic}>현황</span></h1>
        <p className={styles.pageSub}>양평군 주요 작물의 실시간 공급·수요 밸런스를 확인하세요.</p>
      </div>

      <div className={styles.tabs}>
        <Link href="/farm">대시보드</Link>
        <Link href="/balance" className={styles.activeTab}>수급 분석</Link>
        <Link href="/recommend">AI 작물 추천</Link>
        <Link href="/farm?tab=history">농장 정보</Link>
      </div>

      {/* TOP 3 SUMMARY */}
      <div className={styles.topSummary}>
        {top3.map(item => (
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
      <div className={styles.tableWrap}>
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
            {filteredBalances.map(item => (
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
    </div>
  );
}
