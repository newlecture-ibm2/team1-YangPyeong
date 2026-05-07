/* DetailHeader — 작물 상세 헤더 (이모지, 이름, 점수 뱃지) */

import styles from '../detail.module.css';

interface DetailHeaderProps {
  cropName: string;
  category: string;
  emoji: string;
  growthDays?: number;
  optimalTemp?: string;
  score: number;
  soilFitnessPercent: number;
}

export default function DetailHeader({ cropName, category, emoji, growthDays, optimalTemp, score, soilFitnessPercent }: DetailHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.titleRow}>
        <div className={styles.titleLeft}>
          <span className={styles.titleEmoji}>{emoji}</span>
          <div>
            <h1 className={styles.pageTitle}>{cropName}</h1>
            <p className={styles.pageSub}>{category} · 생육 기간 {growthDays || '—'}일 · {optimalTemp || '—'}</p>
          </div>
        </div>
        <div className={styles.titleRight}>
          <div className={styles.scoreBadge}>
            <span className={styles.scoreBadgeLabel}>AI 추천 점수</span>
            <span className={styles.scoreBadgeValue}>{score}</span>
          </div>
          <span className={styles.fitnessBadge}>적합도 {soilFitnessPercent}%</span>
        </div>
      </div>
    </div>
  );
}
