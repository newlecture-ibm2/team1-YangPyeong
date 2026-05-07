'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MOCK_RECOMMENDATIONS } from '../_lib/recommend.mock';
import { SUPPLY_STATUS_MAP, SOIL_FITNESS_MAP } from '../_lib/recommend.types';
import { getCropEmoji, getCropCalendar, generatePriceData } from '../_lib/recommend.constants';
import PriceChart from '../_components/PriceChart/PriceChart';
import CropCalendar from '../_components/CropCalendar/CropCalendar';
import DetailHeader from './_components/DetailHeader';
import DetailKpiRow from './_components/DetailKpiRow';
import ScoreAnalysis from './_components/ScoreAnalysis';
import CropGuide from './_components/CropGuide';
import OtherCrops from './_components/OtherCrops';
import styles from './detail.module.css';

export default function RecommendDetailPage() {
  const params = useParams();
  const cropId = Number(params.cropId);
  const rec = MOCK_RECOMMENDATIONS.find((r) => r.cropId === cropId);

  if (!rec) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h2>추천 정보를 찾을 수 없습니다</h2>
          <p>요청하신 작물의 추천 분석 데이터가 존재하지 않습니다.</p>
          <Link href="/farm/recommend" className={styles.backBtn}>← 추천 목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const supplyInfo = SUPPLY_STATUS_MAP[rec.supplyStatus];
  const fitnessLabel = SOIL_FITNESS_MAP[rec.soilFitness];
  const otherRecs = useMemo(() => MOCK_RECOMMENDATIONS.filter((r) => r.cropId !== cropId).slice(0, 4), [cropId]);
  const priceData = useMemo(() => generatePriceData(rec.expectedRevenuePerKg), [rec.expectedRevenuePerKg]);
  const calendar = useMemo(() => getCropCalendar(rec.cropName), [rec.cropName]);

  return (
    <div className={styles.container}>
      <DetailHeader
        cropName={rec.cropName}
        category={rec.category}
        emoji={getCropEmoji(rec.category)}
        growthDays={rec.growthDays}
        optimalTemp={rec.optimalTemp}
        score={rec.score}
        soilFitnessPercent={rec.soilFitnessPercent}
      />

      <DetailKpiRow items={[
        { icon: '🏆', label: '추천 순위', value: `${rec.rank}위` },
        { icon: '🌱', label: '토양 적합도', value: fitnessLabel },
        { icon: '📊', label: '수급 상태', value: supplyInfo.label, color: supplyInfo.variant === 'green' ? '#2E7D32' : supplyInfo.variant === 'orange' ? '#E65100' : 'var(--color-danger)' },
        { icon: '💰', label: '예상 수익', value: `₩${rec.expectedRevenuePerKg.toLocaleString()}/kg` },
      ]} />

      <ScoreAnalysis rec={rec} fitnessLabel={fitnessLabel} supplyLabel={supplyInfo.label} />

      <CropGuide rec={rec} />

      {/* ── 재배 캘린더 ── */}
      <div className={`${styles.card} ${styles.fadeIn} ${styles.fadeInDelay3}`}>
        <h2 className={styles.cardTitle}>재배 캘린더</h2>
        <p className={styles.cardSub}>월별 주요 작업 일정을 한눈에 확인하세요.</p>
        <CropCalendar phases={calendar} />
      </div>

      {/* ── 가격 추이 ── */}
      <div className={`${styles.card} ${styles.fadeIn}`} style={{ animationDelay: '0.4s' }}>
        <h2 className={styles.cardTitle}>가격 추이 (최근 12개월)</h2>
        <p className={styles.cardSub}>{rec.cropName}의 최근 12개월 도매가 변동 추이입니다.</p>
        <PriceChart data={priceData} unit="kg" />
      </div>

      <OtherCrops recommendations={otherRecs} />

      {/* ── 하단 버튼 ── */}
      <div className={`${styles.actionButtons} ${styles.fadeIn}`} style={{ animationDelay: '0.6s' }}>
        <Link href="/farm/recommend" className={styles.backBtn}>← 목록으로</Link>
        <Link href="/farm/plan" className={styles.planBtn}>이 작물로 재배 등록 →</Link>
      </div>
    </div>
  );
}
