'use client';

import Link from 'next/link';
import useRecommend from './useRecommend';
import SoilPanel from './_components/SoilPanel/SoilPanel';
import AnalyzeLoader from './_components/AnalyzeLoader/AnalyzeLoader';
import RankingCard from './_components/RankingCard/RankingCard';
import RecommendTable from './_components/RecommendTable/RecommendTable';
import GuestPreviewBanner from '@/components/common/GuestPreviewBanner/GuestPreviewBanner';
import { DUMMY_RECOMMENDATIONS } from '@/lib/preview-data';
import styles from './page.module.css';
import farmStyles from '../page.module.css';

export default function RecommendListPage() {
  const hook = useRecommend();

  if (hook.isFarmsLoading) {
    return (
      <div className={farmStyles.container}>
        <p className={styles.loading}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 농장이 하나도 없는 경우 (Preview Mode)
  if (hook.farms.length === 0) {
    const previewRecs = DUMMY_RECOMMENDATIONS.map((r, i) => ({
      cropId: i,
      cropName: r.cropName,
      score: r.score,
      reason: r.reason,
      expectedIncome: r.expectedIncome,
      matchReasons: [r.reason]
    })) as any;

    return (
      <div className={farmStyles.container}>
        <GuestPreviewBanner />
        <div className={farmStyles.header}>
          <div>
            <h1 className={farmStyles.title}>AI 작물 추천 <span className={styles.italic}>미리보기</span></h1>
            <p className={farmStyles.subtitle}>농장 환경에 맞는 최적의 작물을 미리 체험해 보세요.</p>
          </div>
        </div>

        <div className={styles.content} style={{ opacity: 0.8, pointerEvents: 'none' }}>
           <div className={styles.rankingGrid}>
              {previewRecs.slice(0, 3).map((rec: any, idx: number) => (
                <RankingCard key={rec.cropId} rec={rec} index={idx} />
              ))}
            </div>
            <RecommendTable recommendations={previewRecs} />
        </div>
      </div>
    );
  }

  return (
    <div className={farmStyles.container}>
      {/* 페이지 헤더 */}
      <div className={farmStyles.header}>
        <div>
          <p className={farmStyles.breadcrumb}>
            <Link href="/" className={farmStyles.breadcrumbLink}>홈</Link> /
            <Link href="/farm" className={farmStyles.breadcrumbLink}> 내 농장</Link> / AI 작물 추천
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 className={farmStyles.title}>AI 작물 추천</h1>
          </div>
          <p className={farmStyles.subtitle}>
            내 농장 환경에 꼭 맞는 최적의 작물을 AI가 추천해 드립니다.
          </p>
        </div>
      </div>

      {/* Main Tabs (Navigation) */}
      <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0', marginBottom: '32px', display: 'flex', gap: '32px' }}>
        <Link href="/farm" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px', fontSize: '16px' }}>
          대시보드
        </Link>
        <Link href="/balance" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px', fontSize: '16px' }}>
          수급 분석
        </Link>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, borderBottom: '2px solid var(--color-primary)', paddingBottom: '16px', marginBottom: '-1px', cursor: 'pointer', fontSize: '16px' }}
        >
          AI 작물 추천
        </button>
        <Link href="/farm" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px', fontSize: '16px' }}>
          농장 정보
        </Link>
      </div>

      <div className={styles.content}>
        {/* ── 토양 정보 요약 ── */}
        {hook.farm && <SoilPanel farm={hook.farm} result={hook.result} />}

        {/* ── CTA / 분석 로딩 ── */}
        <AnalyzeLoader
          isAnalyzing={hook.isAnalyzing}
          isHydrating={hook.isHydrating}
          hasAnalyzed={hook.hasAnalyzed}
          disabled={!hook.farm}
          onAnalyze={hook.handleAnalyze}
        />

        {/* ── 추천 결과 ── */}
        {hook.hasAnalyzed && hook.result && (
          <>
            <div className={styles.rankingGrid} data-guide="recommend-ranking">
              {hook.top3.map((rec, idx) => (
                <RankingCard key={rec.cropId} rec={rec} index={idx} />
              ))}
            </div>
            <div data-guide="recommend-detail">
              <RecommendTable farmId={hook.farm?.id} recommendations={hook.allRecs} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
