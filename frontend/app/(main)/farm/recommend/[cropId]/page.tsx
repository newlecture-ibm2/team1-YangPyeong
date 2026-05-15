'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SUPPLY_STATUS_MAP, SOIL_FITNESS_MAP, ADVICE_TYPE_LABEL } from '../_lib/recommend.types';
import type { CropRecommendation, CropRecommendResponse } from '../_lib/recommend.types';
import { getLatestRecommendHistory } from '../_lib/recommend.api';
import { getCropEmoji, getCropCalendar, generatePriceData } from '../_lib/recommend.constants';
import PriceChart from '../_components/PriceChart/PriceChart';
import CropCalendar from '../_components/CropCalendar/CropCalendar';
import DetailHeader from './_components/DetailHeader';
import DetailKpiRow from './_components/DetailKpiRow';
import ScoreAnalysis from './_components/ScoreAnalysis';
import CropGuide from './_components/CropGuide';
import OtherCrops from './_components/OtherCrops';
import styles from './detail.module.css';

type LoadPhase = 'loading' | 'ready' | 'empty';

function useRecommendDetailResult(cropId: number, farmIdQuery: number | null) {
  const [result, setResult] = useState<CropRecommendResponse | null>(null);
  const [phase, setPhase] = useState<LoadPhase>('loading');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = sessionStorage.getItem('recommend_result');
        if (stored) {
          const parsed = JSON.parse(stored) as CropRecommendResponse;
          const cachedRec = parsed.recommendations?.find((r) => r.cropId === cropId);
          const hasPests = (cachedRec?.pests?.length ?? 0) > 0;
          if (hasPests && !cancelled) {
            setResult(parsed);
            setPhase('ready');
            return;
          }
        }
      } catch {
        // sessionStorage 접근/파싱 불가 시 무시
      }

      if (farmIdQuery != null && Number.isFinite(farmIdQuery)) {
        try {
          const data = await getLatestRecommendHistory(farmIdQuery);
          if (cancelled) return;
          if (data?.farmInfo?.id != null && data.farmInfo.id !== farmIdQuery) {
            setPhase('empty');
            return;
          }
          if (data) {
            setResult(data);
            try {
              sessionStorage.setItem('recommend_result', JSON.stringify(data));
            } catch {
              // ignore
            }
            setPhase('ready');
            return;
          }
        } catch (e) {
          console.error('최근 AI 추천 이력으로 상세 복원 실패:', e);
        }
      }

      if (!cancelled) setPhase('empty');
    })();

    return () => {
      cancelled = true;
    };
  }, [cropId, farmIdQuery]);

  return { result, phase };
}

function DetailLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⏳</div>
        <h2>추천 데이터를 불러오는 중...</h2>
        <p>잠시만 기다려 주세요. 데이터를 복원하고 있습니다.</p>
        <Link href="/farm/recommend" className={styles.backBtn}>← 추천 목록으로 돌아가기</Link>
      </div>
    </div>
  );
}

function RecommendDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cropId = Number(params.cropId);
  const farmIdRaw = searchParams.get('farmId');
  const farmIdQuery = farmIdRaw != null && farmIdRaw !== '' ? Number(farmIdRaw) : null;
  const farmIdQueryValid = farmIdQuery != null && Number.isFinite(farmIdQuery) ? farmIdQuery : null;

  const { result, phase } = useRecommendDetailResult(cropId, farmIdQueryValid);

  const rec = useMemo(() => {
    if (!result) return null;
    const fromNew = result.recommendations.find((r) => r.cropId === cropId);
    if (fromNew) return fromNew;
    return result.currentCropAdvices?.find((r) => r.cropId === cropId) || null;
  }, [result, cropId]);

  const otherRecs = useMemo(() => {
    if (!result) return [];
    const combined = [
      ...(result.currentCropAdvices ?? []),
      ...result.recommendations,
    ];
    return combined.filter((r) => r.cropId !== cropId).slice(0, 4);
  }, [result, cropId]);

  if (phase === 'loading') {
    return <DetailLoading />;
  }

  if (phase === 'empty' || !result) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h2>추천 정보를 찾을 수 없습니다</h2>
          <p>목록에서 AI 추천을 실행한 뒤 작물을 선택하거나, 올바른 주소로 접속했는지 확인해 주세요.</p>
          <Link href="/farm/recommend" className={styles.backBtn}>← 추천 목록으로 돌아가기</Link>
        </div>
      </div>
    );
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

  const supplyInfo = SUPPLY_STATUS_MAP[rec.supplyStatus];
  const fitnessLabel = SOIL_FITNESS_MAP[rec.soilFitness];
  const priceData = generatePriceData(rec.expectedRevenuePerKg);
  const calendar = getCropCalendar(rec.cropName);
  const farmIdForLinks = result.farmInfo?.id;

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

      {rec.adviceType && (
        <p className={styles.adviceModeLabel}>
          {ADVICE_TYPE_LABEL[rec.adviceType] ?? rec.adviceType}
        </p>
      )}
      {rec.mismatchNote && (
        <div className={styles.mismatchBanner}>{rec.mismatchNote}</div>
      )}

      <DetailKpiRow items={[
        { icon: '🏆', label: '추천 순위', value: `${rec.rank}위` },
        { icon: '🌱', label: '토양 적합도', value: fitnessLabel },
        { icon: '📊', label: '수급 상태', value: supplyInfo.label, color: supplyInfo.variant === 'green' ? '#2E7D32' : supplyInfo.variant === 'orange' ? '#E65100' : 'var(--color-danger)' },
        { icon: '💰', label: '예상 수익', value: `₩${rec.expectedRevenuePerKg.toLocaleString('ko-KR')}/kg` },
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

      <OtherCrops recommendations={otherRecs} farmId={farmIdForLinks} />

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

export default function RecommendDetailPage() {
  return (
    <Suspense fallback={<DetailLoading />}>
      <RecommendDetailInner />
    </Suspense>
  );
}
