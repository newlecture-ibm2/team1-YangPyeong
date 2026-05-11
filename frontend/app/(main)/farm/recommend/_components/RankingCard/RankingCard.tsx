/* RankingCard — TOP3 작물 카드 */

import type { CropRecommendation } from '../../_lib/recommend.types';
import { MEDALS } from '../../_lib/recommend.constants';
import GaugeBar from '../GaugeBar/GaugeBar';
import styles from './RankingCard.module.css';

interface RankingCardProps {
  rec: CropRecommendation;
  index: number;
}

export default function RankingCard({ rec, index }: RankingCardProps) {
  return (
    <div
      className={`${styles.card} ${index === 0 ? styles.first : ''} ${styles.fadeIn}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className={styles.medal}>{MEDALS[index]}</div>
      <h3 className={styles.cropName}>{rec.cropName}</h3>
      <p className={styles.cropMeta}>
        {rec.category} · 토양 적합도 {rec.soilFitnessPercent}%
      </p>
      <p className={styles.score}>{rec.score}</p>
      <p className={styles.scoreLabel}>AI 추천 점수</p>
      <div className={styles.gauges}>
        <GaugeBar label="토양 적합도" value={rec.soilFitnessPercent} />
        <GaugeBar label="시세 전망" value={rec.priceForecastPercent} />
        <GaugeBar label="수급 안정성" value={rec.supplyStabilityPercent} />
      </div>
      <p className={styles.revenue}>
        예상 수익: ₩{rec.expectedRevenuePerKg.toLocaleString('ko-KR')}/kg
      </p>
    </div>
  );
}
