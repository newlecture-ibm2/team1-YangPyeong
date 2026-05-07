'use client';

import useRecommend from './useRecommend';
import SoilPanel from './_components/SoilPanel/SoilPanel';
import AnalyzeLoader from './_components/AnalyzeLoader/AnalyzeLoader';
import RankingCard from './_components/RankingCard/RankingCard';
import RecommendTable from './_components/RecommendTable/RecommendTable';
import styles from './page.module.css';

export default function RecommendListPage() {
  const hook = useRecommend();

  if (hook.isFarmsLoading) {
    return <p className={styles.loading}>데이터를 불러오는 중...</p>;
  }

  return (
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
  );
}
