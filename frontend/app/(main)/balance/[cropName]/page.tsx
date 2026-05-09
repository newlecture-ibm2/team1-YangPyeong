'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/common/Badge/Badge';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import { fetchBalanceAnalysis, BalanceAnalysisResponse } from '../_lib/balance.api';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ cropName: string }>;
}

export default function BalanceDetailPage({ params }: PageProps) {
  const { cropName } = use(params);
  const router = useRouter();
  const [data, setData] = useState<BalanceAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const decodedName = decodeURIComponent(cropName);
        const result = await fetchBalanceAnalysis(decodedName);
        setData(result);
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
    let degrees = (ratio / 100) * 90;
    if (degrees > 180) degrees = 180;
    if (degrees < 0) degrees = 0;
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
            <div className={styles.gaugeBackground}></div>
            <div className={styles.gaugeInner}></div>
            <div 
              className={styles.gaugeNeedle} 
              style={{ transform: `translateX(-50%) rotate(${getNeedleRotation(data.supplyRatio)}deg)` }}
            ></div>
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

      {/* PLACEHOLDERS FOR FUTURE CHARTS */}
      <div className={styles.grid2}>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>시계열 추이 (준비중)</h2>
          <div className={styles.placeholder}>📈 월별 공급/수요 추이 라인 차트</div>
        </Card>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>전년 대비 변화 (준비중)</h2>
          <div className={styles.placeholder}>📊 전년 동기 대비 막대 차트</div>
        </Card>
      </div>

      <div className={styles.actions}>
        <Button variant="outline" onClick={() => router.back()}>← 목록으로</Button>
      </div>
    </div>
  );
}
