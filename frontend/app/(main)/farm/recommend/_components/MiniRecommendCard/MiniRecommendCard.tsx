/* MiniRecommendCard — 다른 추천 작물 미니 카드 */

import Link from 'next/link';
import type { CropRecommendation } from '../../_lib/recommend.types';
import { getCropEmoji } from '../../_lib/recommend.constants';
import styles from './MiniRecommendCard.module.css';

interface MiniRecommendCardProps {
  rec: CropRecommendation;
}

export default function MiniRecommendCard({ rec }: MiniRecommendCardProps) {
  return (
    <Link href={`/farm/recommend/${rec.cropId}`} className={styles.card}>
      <div className={styles.emoji}>{getCropEmoji(rec.category)}</div>
      <div className={styles.info}>
        <div className={styles.name}>{rec.cropName}</div>
        <div className={styles.score}>AI 점수: <strong>{rec.score}</strong></div>
      </div>
      <div className={styles.rank}>#{rec.rank}</div>
    </Link>
  );
}
