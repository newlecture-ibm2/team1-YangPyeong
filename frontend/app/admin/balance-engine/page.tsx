'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import { fetchBalanceData, fetchThresholds, updateThresholds, AdminBalanceData, BalanceThresholdsDto } from './_lib/balanceEngine.api';
import styles from './page.module.css';

export default function AdminBalanceEnginePage() {
  const [data, setData] = useState<AdminBalanceData[]>([]);
  const [filteredData, setFilteredData] = useState<AdminBalanceData[]>([]);
  const [thresholds, setThresholds] = useState<BalanceThresholdsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체 상태');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [dataRes, threshRes] = await Promise.all([
        fetchBalanceData(),
        fetchThresholds()
      ]);
      setData(dataRes);
      setFilteredData(dataRes);
      setThresholds(threshRes);
    } catch (err) {
      console.error(err);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = data;
    if (searchQuery) {
      filtered = filtered.filter(d => d.cropName?.includes(searchQuery));
    }
    if (statusFilter !== '전체 상태') {
      filtered = filtered.filter(d => d.balanceStatus === statusFilter);
    }
    setFilteredData(filtered);
  }, [searchQuery, statusFilter, data]);

  const handleSave = async () => {
    if (!thresholds) return;
    setIsSaving(true);
    try {
      await updateThresholds(thresholds);
      alert('임계치가 즉시 반영되었습니다. (Hot Reload)');
      await loadAll(); // 재계산된 상태 확인을 위해 다시 불러오기
    } catch (err) {
      console.error(err);
      alert('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BALANCED': return <Badge variant="green">적정</Badge>;
      case 'EXCESS_CAUTION': return <Badge variant="orange">과잉주의</Badge>;
      case 'EXCESS_WARN': return <Badge variant="red">과잉경고</Badge>;
      case 'SHORT_CAUTION': return <Badge variant="lime">부족주의</Badge>;
      case 'SHORT_WARN': return <Badge variant="blue">부족경고</Badge>;
      default: return <Badge variant="gray">알수없음</Badge>;
    }
  };

  // 차트 시뮬레이션용: 임계치 변경 시 동적으로 상태를 예측
  const simulateStatus = (ratio: number) => {
    if (!thresholds) return 'gray';
    if (ratio >= thresholds.excessWarn) return 'red';
    if (ratio >= thresholds.excessCaution) return 'orange';
    if (ratio <= thresholds.shortWarn) return 'blue';
    if (ratio <= thresholds.shortCaution) return 'lime';
    return 'green';
  };

  if (isLoading) return <div className={styles.loading}>로딩중...</div>;
  if (!thresholds) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>밸런스 엔진 관리</h1>
          <p className={styles.subtitle}>시스템 알림 및 관제 기준이 되는 수급 임계치를 실시간으로 제어합니다.</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* 제어판 + 시뮬레이션 차트 */}
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>임계치 설정 및 시뮬레이션</h2>
          
          <div className={styles.controls}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span style={{ color: 'var(--color-red-500)' }}>과잉 경고 (Excess Warn)</span>
                <span>{thresholds.excessWarn}% 이상</span>
              </div>
              <input type="range" min="100" max="250" step="1" 
                value={thresholds.excessWarn}
                onChange={e => setThresholds({...thresholds, excessWarn: Number(e.target.value)})}
                className={styles.sliderInput} />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span style={{ color: 'var(--color-orange-500)' }}>과잉 주의 (Excess Caution)</span>
                <span>{thresholds.excessCaution}% 이상</span>
              </div>
              <input type="range" min="100" max="200" step="1" 
                value={thresholds.excessCaution}
                onChange={e => setThresholds({...thresholds, excessCaution: Number(e.target.value)})}
                className={styles.sliderInput} />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span style={{ color: 'var(--color-lime-600)' }}>부족 주의 (Short Caution)</span>
                <span>{thresholds.shortCaution}% 이하</span>
              </div>
              <input type="range" min="50" max="100" step="1" 
                value={thresholds.shortCaution}
                onChange={e => setThresholds({...thresholds, shortCaution: Number(e.target.value)})}
                className={styles.sliderInput} />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span style={{ color: 'var(--color-blue-500)' }}>부족 경고 (Short Warn)</span>
                <span>{thresholds.shortWarn}% 이하</span>
              </div>
              <input type="range" min="10" max="80" step="1" 
                value={thresholds.shortWarn}
                onChange={e => setThresholds({...thresholds, shortWarn: Number(e.target.value)})}
                className={styles.sliderInput} />
            </div>
          </div>

          <div className={styles.scatterPlot}>
            <div className={styles.axisLine}></div>
            {/* 임계치 선들 (250%를 100% width로 계산) */}
            <div className={`${styles.thresholdLine} ${styles.warnRed}`} style={{ left: `${Math.min((thresholds.excessWarn / 250) * 100, 100)}%` }}>
               <div className={styles.thresholdLabel} style={{ color: 'var(--color-red-500)' }}>{thresholds.excessWarn}%</div>
            </div>
            <div className={`${styles.thresholdLine} ${styles.warnOrange}`} style={{ left: `${Math.min((thresholds.excessCaution / 250) * 100, 100)}%` }}>
               <div className={styles.thresholdLabel} style={{ color: 'var(--color-orange-500)' }}>{thresholds.excessCaution}%</div>
            </div>
            <div className={`${styles.thresholdLine} ${styles.warnYellow}`} style={{ left: `${Math.min((thresholds.shortCaution / 250) * 100, 100)}%` }}>
               <div className={styles.thresholdLabel} style={{ color: 'var(--color-lime-600)' }}>{thresholds.shortCaution}%</div>
            </div>
            <div className={`${styles.thresholdLine} ${styles.warnBlue}`} style={{ left: `${Math.min((thresholds.shortWarn / 250) * 100, 100)}%` }}>
               <div className={styles.thresholdLabel} style={{ color: 'var(--color-blue-500)' }}>{thresholds.shortWarn}%</div>
            </div>

            {/* 데이터 점들 */}
            {data.map(d => {
              const leftPos = Math.min((d.supplyRatio / 250) * 100, 99);
              const colorVariant = simulateStatus(d.supplyRatio);
              const bg = colorVariant === 'red' ? '#ef4444' : 
                         colorVariant === 'orange' ? '#f97316' : 
                         colorVariant === 'lime' ? '#65a30d' : 
                         colorVariant === 'blue' ? '#3b82f6' : '#22c55e';
              
              // 점들이 겹치지 않게 무작위 높이(top)
              const topPos = 30 + (d.cropId % 5) * 12;

              return (
                <div key={d.id} className={styles.cropDot} style={{ left: `${leftPos}%`, top: `${topPos}px`, background: bg }}>
                  <div className={styles.tooltip}>{d.cropName} ({d.supplyRatio}%)</div>
                </div>
              );
            })}
          </div>

          <div className={styles.saveBtnWrap}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '적용중...' : '임계치 즉시 적용 (Hot Reload)'}
            </Button>
          </div>
        </div>

        {/* 데이터 마스터 테이블 */}
        <div className={styles.dataGrid}>
          <h2 className={styles.cardTitle}>수급 상세 데이터 마스터</h2>
          
          <div className={styles.filterBar}>
            <select className={styles.selectInput} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="전체 상태">전체 상태</option>
              <option value="BALANCED">적정</option>
              <option value="EXCESS_CAUTION">과잉주의</option>
              <option value="EXCESS_WARN">과잉경고</option>
              <option value="SHORT_CAUTION">부족주의</option>
              <option value="SHORT_WARN">부족경고</option>
            </select>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="작물명 검색..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>작물명</th>
                  <th>예측 수요량 (통계)</th>
                  <th>예측 공급량 (등록)</th>
                  <th>수급 비율</th>
                  <th>현재 상태</th>
                  <th>산출일</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.cropName}</strong></td>
                    <td>{d.demandForecast?.toLocaleString() || '-'} kg</td>
                    <td>{d.supplyForecast?.toLocaleString() || '-'} kg</td>
                    <td>{d.supplyRatio}%</td>
                    <td>{getStatusBadge(d.balanceStatus)}</td>
                    <td>{d.calculatedAt ? new Date(d.calculatedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>조건에 맞는 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
