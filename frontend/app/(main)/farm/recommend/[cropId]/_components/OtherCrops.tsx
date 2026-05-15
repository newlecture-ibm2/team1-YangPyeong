/* OtherCrops — 다른 추천 작물 그리드 */

import Link from 'next/link';
import type { CropRecommendation } from '../../_lib/recommend.types';
import MiniRecommendCard from '../../_components/MiniRecommendCard/MiniRecommendCard';
import styles from '../detail.module.css';

interface OtherCropsProps {
  recommendations: CropRecommendation[];
  farmId?: number;
}

export default function OtherCrops({ recommendations, farmId }: OtherCropsProps) {
  return (
    <div className={`${styles.card} ${styles.fadeIn}`} style={{ animationDelay: '0.5s' }}>
      <div className={styles.otherHeader}>
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>다른 추천 작물</h2>
        <Link href="/farm/recommend" className={styles.viewAllLink}>전체 보기 →</Link>
      </div>
      <div className={styles.miniCardGrid}>
        {recommendations.map((r) => (
          <MiniRecommendCard key={r.cropId} rec={r} farmId={farmId} />
        ))}
      </div>
    </div>
  );
}
