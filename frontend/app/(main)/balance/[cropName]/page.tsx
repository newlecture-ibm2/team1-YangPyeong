'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/common/Badge/Badge';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import { fetchBalanceAnalysis, BalanceAnalysisResponse, fetchSupplyTrend, SupplyTrendResult } from '../_lib/balance.api';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ cropName: string }>;
}

export default function BalanceDetailPage({ params }: PageProps) {
  const { cropName } = use(params);
  const router = useRouter();
  const [data, setData] = useState<BalanceAnalysisResponse | null>(null);
  const [trendData, setTrendData] = useState<SupplyTrendResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const decodedName = decodeURIComponent(cropName);
        const [result, trend] = await Promise.all([
          fetchBalanceAnalysis(decodedName),
          fetchSupplyTrend(decodedName)
        ]);
        setData(result);
        setTrendData(trend);
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [cropName]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SHORT_WARN': return '#3b82f6';
      case 'SHORT_CAUTION': return '#10b981';
      case 'BALANCED': return '#10b981';
      case 'EXCESS_CAUTION': return '#f59e0b';
      case 'EXCESS_WARN': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getNeedleRotation = (ratio: number) => {
    // 100%가 수직 위(0deg, 12시 방향)를 향하도록 보정합니다.
    // 0% -> -90deg (왼쪽), 100% -> 0deg (위쪽), 200% -> 90deg (오른쪽)
    let degrees = (ratio - 100) * 0.9;
    if (degrees > 90) degrees = 90;
    if (degrees < -90) degrees = -90;
    return degrees;
  };

  if (isLoading) return <div className={styles.loading}>분석 데이터를 불러오는 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.error}>데이터를 찾을 수 없습니다.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>
          홈 / 밸런스 / <strong>{data.cropName} 상세</strong>
        </p>
        <h1 className={styles.pageTitle}>{data.cropName} — 밸런스 상세</h1>
      </div>

      {/* KPI ROW */}
      <div className={styles.kpiRow}>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>수급 비율</p>
          <p className={styles.kpiValue} style={{ color: getStatusColor(data.status) }}>{data.supplyRatio}%</p>
        </Card>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>수급 상태</p>
          <div className={styles.kpiValue}>
             <Badge variant={data.status.toLowerCase().includes('excess') ? 'orange' : data.status.toLowerCase().includes('short') ? 'blue' : 'green'}>
               {data.statusLabel}
             </Badge>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>기준 연도</p>
          <p className={styles.kpiValue}>{data.baseYear}년</p>
        </Card>
      </div>

      <div className={styles.grid2}>
        {/* GAUGE CHART CARD */}
        <Card className={styles.chartCard}>
          <h2 className={styles.cardTitle}>수급 밸런스 미터</h2>
          <div className={styles.gaugeContainer}>
            <div className={styles.gaugeArcWrapper}>
              <div className={styles.gaugeBackground}></div>
              <div className={styles.gaugeInner}></div>
            </div>
            <div 
              className={styles.gaugeNeedle} 
              style={{ transform: `rotate(${getNeedleRotation(data.supplyRatio)}deg)` }}
            ></div>
            <div className={styles.gaugeNeedleCenter}></div>
          </div>
          <p className={styles.gaugeStatus}>{data.statusLabel}</p>
        </Card>

        {/* AI INSIGHT CARD */}
        <Card className={styles.chartCard}>
          <h2 className={styles.cardTitle}>AI 분석 리포트</h2>
          <div className={styles.insightBox}>
            <p className={styles.insightText}>{data.message}</p>
            <div style={{ marginTop: '24px' }}>
              <Button variant="outline" onClick={() => router.push('/recommend')}>추천 작물 보러가기</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* REAL TREND CHART */}
      <div className={styles.grid2}>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>연도별 수급 추이</h2>
          <div className={styles.trendChartContainer}>
             {trendData.map((item, index) => {
               const maxVal = Math.max(...trendData.map(t => Math.max(t.supply, t.demand)));
               const supplyHeight = (item.supply / maxVal) * 100;
               const demandHeight = (item.demand / maxVal) * 100;
               
               return (
                 <div key={item.year} className={styles.trendCol}>
                   <div className={styles.barGroup}>
                     <div 
                       className={styles.barSupply} 
                       style={{ height: `${supplyHeight}%` }}
                       title={`공급: ${item.supply.toLocaleString()}kg`}
                     ></div>
                     <div 
                       className={styles.barDemand} 
                       style={{ height: `${demandHeight}%` }}
                       title={`수요: ${item.demand.toLocaleString()}kg`}
                     ></div>
                   </div>
                   <p className={styles.yearLabel}>{item.year}</p>
                 </div>
               );
             })}
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={styles.dotSupply}></span> 공급(통계/실시간)</span>
            <span className={styles.legendItem}><span className={styles.dotDemand}></span> 수요(기준치)</span>
          </div>
        </Card>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>전년 대비 변화</h2>
          <div className={styles.placeholder}>
             {(() => {
               // 2026년을 제외하고 실제 통계량(supply > 0)이 있는 가장 최신의 과거 연도를 찾습니다.
               const historicalData = trendData.slice(0, -1).reverse().find(t => t.supply > 0);
               const prevYearSupply = historicalData?.supply || 0;
               const prevYear = historicalData?.year;
               const currentYearSupply = trendData[trendData.length - 1]?.supply || 0;
               const hasValidYoY = trendData.length > 1 && prevYearSupply > 0;
               
               if (hasValidYoY) {
                 const changePctVal = ((currentYearSupply / prevYearSupply - 1) * 100);
                 const changePct = changePctVal.toFixed(1);
                 const isIncrease = changePctVal >= 0;
                 const absChangePct = Math.abs(changePctVal).toFixed(1);
                 
                 return (
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0 20px' }}>
                     <p className={styles.yoyText}>
                       직전 집계 연도(<strong>{prevYear}년</strong>) 대비 
                       <strong style={{ color: isIncrease ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                         {isIncrease ? ` ${absChangePct}% 증가 ` : ` ${absChangePct}% 감소 `}
                       </strong>
                       하였습니다.
                     </p>
                     <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '16px', opacity: 0.85, textAlign: 'center', wordBreak: 'keep-all', lineHeight: 1.6, maxWidth: '420px' }}>
                       ※ 2025년도 공식 생산량 통계는 통계청(KOSIS) 최종 공표 대기 중으로, 시스템이 자동으로 검증된 최신 유효 데이터 연도인 {prevYear}년을 역추적해 비교합니다.
                     </p>
                   </div>
                 );
               } else {
                 return (
                   <p className={styles.yoyText} style={{ opacity: 0.7, padding: '16px', fontSize: '14px', wordBreak: 'keep-all' }}>
                     직전 연도 공급량 데이터가 집계되지 않아 전년 대비 변화율을 계산할 수 없습니다.
                   </p>
                 );
               }
             })()}
          </div>
        </Card>
      </div>

      <div className={styles.actions}>
        <Button variant="outline" onClick={() => router.back()}>← 목록으로</Button>
      </div>
    </div>
  );
}
