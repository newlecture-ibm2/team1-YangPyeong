'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { requestLatestRecommendation } from '../_lib/recommend.api';
import { CropRecommendation, SUPPLY_STATUS_MAP, SOIL_FITNESS_MAP } from '../_lib/recommend.types';
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
  const [rec, setRec] = useState<CropRecommendation | null>(null);
  const [otherRecs, setOtherRecs] = useState<CropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 최근 추천 이력에서 해당 작물 정보 가져오기
  useEffect(() => {
    async function loadDetail() {
      try {
        setIsLoading(true);
        // [참고] farmId가 필요한데, 여기서는 최신 이력을 조회하므로 0을 보내거나 서버가 알아서 판단하게 함
        // 실제로는 유저의 농장 목록 중 첫 번째 농장의 이력을 가져오도록 백엔드 연결 필요
        const data = await requestLatestRecommendation(); 
        const found = data.recommendations.find(r => r.cropId === cropId);
        if (found) {
          setRec(found);
          setOtherRecs(data.recommendations.filter(r => r.cropId !== cropId).slice(0, 4));
        }
      } catch (err) {
        console.error('상세 정보 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [cropId]);

  const priceData = useMemo(() => rec ? generatePriceData(rec.expectedRevenuePerKg) : [], [rec]);
  const calendar = useMemo(() => rec ? getCropCalendar(rec.cropName) : [], [rec]);

  if (isLoading) {
    return <div className={styles.container}><p style={{textAlign: 'center', padding: '100px'}}>분석 데이터를 불러오는 중...</p></div>;
  }

  if (!rec) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h2>추천 정보를 찾을 수 없습니다</h2>
          <p>요청하신 작물의 추천 분석 데이터가 존재하지 않거나 분석 이력이 없습니다.</p>
          <Link href="/farm/recommend" className={styles.backBtn}>← 추천 목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const supplyInfo = SUPPLY_STATUS_MAP[rec.supplyStatus] || { label: '정보 없음', variant: 'gray' };
  const fitnessLabel = SOIL_FITNESS_MAP[rec.soilFitness] || '정보 없음';

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

      <div className={`${styles.actionButtons} ${styles.fadeIn}`} style={{ animationDelay: '0.6s' }}>
        <Link href="/farm/recommend" className={styles.backBtn}>← 목록으로</Link>
        <Link 
          href={`/farm/cultivation-register?cropId=${rec.cropId}&cropName=${rec.cropName}`} 
          className={styles.planBtn}
        >
          이 작물로 재배 등록 →
        </Link>
      </div>
    </div>
  );
}
