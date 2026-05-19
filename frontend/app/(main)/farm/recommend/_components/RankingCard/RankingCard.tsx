/* RankingCard — TOP3 / 코칭 작물 카드 */

import Link from 'next/link';
import type { CropRecommendation } from '../../_lib/recommend.types';
import { ADVICE_TYPE_LABEL } from '../../_lib/recommend.types';
import { MEDALS } from '../../_lib/recommend.constants';
import GaugeBar from '../GaugeBar/GaugeBar';
import styles from './RankingCard.module.css';

interface RankingCardProps {
  rec: CropRecommendation;
  index: number;
  farmId?: number;
}

function detailHref(cropId: number, farmId?: number) {
  return farmId != null
    ? `/farm/recommend/${cropId}?farmId=${farmId}`
    : `/farm/recommend/${cropId}`;
}

export default function RankingCard({ rec, index, farmId }: RankingCardProps) {
  const showMedal =
    rec.adviceType == null || rec.adviceType === 'NEW_RECOMMEND' || rec.adviceType === 'NEXT_SEASON';

  return (
    <Link
      href={detailHref(rec.cropId, farmId)}
      className={`${styles.card} ${index === 0 && showMedal ? styles.first : ''} ${styles.fadeIn}`}
      style={{ animationDelay: `${index * 0.15}s`, textDecoration: 'none', color: 'inherit' }}
    >
      {showMedal && index < 3 && <div className={styles.medal}>{MEDALS[index]}</div>}
      {rec.adviceType && (
        <span className={styles.adviceBadge}>{ADVICE_TYPE_LABEL[rec.adviceType] ?? rec.adviceType}</span>
      )}
      <h3 className={styles.cropName}>{rec.cropName}</h3>
      <p className={styles.cropMeta}>
        {rec.category} · 토양 적합도 {rec.soilFitnessPercent}%
      </p>
      {rec.mismatchNote && <p className={styles.mismatch}>{rec.mismatchNote}</p>}
      {rec.aiReason && <p className={styles.aiSnippet}>{rec.aiReason}</p>}
      <p className={styles.score}>{rec.score}</p>
      <p className={styles.scoreLabel}>AI 분석 점수</p>
      <div className={styles.gauges}>
        <GaugeBar label="토양 적합도" value={rec.soilFitnessPercent} />
        <GaugeBar label="시세 전망" value={rec.priceForecastPercent} />
        <GaugeBar label="수급 안정성" value={rec.supplyStabilityPercent} />
      </div>
      <p className={styles.revenue}>
        예상 수익: ₩{rec.expectedRevenuePerKg.toLocaleString('ko-KR')}/kg
      </p>
      <span className={styles.detailLink}>
        상세 보기 →
      </span>
    </Link>
  );
}
