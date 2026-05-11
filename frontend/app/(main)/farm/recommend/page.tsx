'use client';

import Link from 'next/link';
import useRecommend from './useRecommend';
import SoilPanel from './_components/SoilPanel/SoilPanel';
import AnalyzeLoader from './_components/AnalyzeLoader/AnalyzeLoader';
import RankingCard from './_components/RankingCard/RankingCard';
import RecommendTable from './_components/RecommendTable/RecommendTable';
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

  // 농장이 하나도 없는 경우 (Empty State)
  if (hook.farms.length === 0) {
    return (
      <div className={farmStyles.container}>
        <div className={farmStyles.header}>
          <div>
            <h1 className={farmStyles.title}>AI 작물 추천</h1>
            <p className={farmStyles.subtitle}>농장을 먼저 등록해야 맞춤형 AI 작물 추천을 받을 수 있습니다.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
          <Link href="/farm/register" style={{ textDecoration: 'none' }}>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text-light)', height: '100%', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>＋</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>새로운 농장 등록하기</div>
              <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>등록된 농장이 없습니다. 농장을 먼저 등록해 주세요.</p>
            </div>
          </Link>
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
          hasAnalyzed={hook.hasAnalyzed}
          disabled={!hook.farm}
          onAnalyze={hook.handleAnalyze}
        />

        {/* ── 추천 결과 ── */}
        {hook.hasAnalyzed && hook.result && (
          <>
            <div className={styles.rankingGrid}>
              {hook.top3.map((rec, idx) => (
                <RankingCard key={rec.cropId} rec={rec} index={idx} />
              ))}
            </div>
            <RecommendTable recommendations={hook.allRecs} />
          </>
        )}
      </div>
    </div>
  );
}
