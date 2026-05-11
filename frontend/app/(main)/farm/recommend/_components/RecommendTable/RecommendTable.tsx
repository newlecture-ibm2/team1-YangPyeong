/* RecommendTable — 전체 추천 목록 테이블 */

import Link from 'next/link';
import type { CropRecommendation } from '../../_lib/recommend.types';
import { SUPPLY_STATUS_MAP } from '../../_lib/recommend.types';
import styles from './RecommendTable.module.css';

interface RecommendTableProps {
  recommendations: CropRecommendation[];
}

function SupplyBadge({ status }: { status: CropRecommendation['supplyStatus'] }) {
  const info = SUPPLY_STATUS_MAP[status];
  const cls =
    info.variant === 'green' ? styles.badgeGreen :
    info.variant === 'orange' ? styles.badgeOrange :
    styles.badgeRed;
  return <span className={`${styles.badge} ${cls}`}>{info.label}</span>;
}

function CategoryPill({ category }: { category: CropRecommendation['category'] }) {
  const isVeg = ['채소류', '과일류'].includes(category);
  return (
    <span className={`${styles.pill} ${isVeg ? styles.pillGreen : styles.pillOutline}`}>
      {category}
    </span>
  );
}

export default function RecommendTable({ recommendations }: RecommendTableProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>전체 추천 목록</h3>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>순위</th>
              <th>작물명</th>
              <th>분류</th>
              <th>AI 점수</th>
              <th>예상 수익</th>
              <th>수급 상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec) => (
              <tr key={rec.cropId}>
                <td><span className={styles.rankNum}>{rec.rank}</span></td>
                <td style={{ fontWeight: 500 }}>{rec.cropName}</td>
                <td><CategoryPill category={rec.category} /></td>
                <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{rec.score}</td>
                <td>₩{rec.expectedRevenuePerKg.toLocaleString('ko-KR')}/kg</td>
                <td><SupplyBadge status={rec.supplyStatus} /></td>
                <td>
                  <Link
                    href={`/farm/recommend/${rec.cropId}`}
                    className={`${styles.detailBtn} ${rec.rank <= 3 ? styles.detailBtnPrimary : styles.detailBtnOutline}`}
                  >
                    상세 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
