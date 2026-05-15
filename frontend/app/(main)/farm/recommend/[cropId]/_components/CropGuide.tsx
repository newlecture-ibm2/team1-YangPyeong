/* CropGuide — 재배 가이드 카드 (파종/수확/온도/병해충/난이도) */

import type { CropRecommendation } from '../../_lib/recommend.types';
import styles from '../detail.module.css';

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className={styles.difficultyStars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= level ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

interface CropGuideProps {
  rec: CropRecommendation;
}

export default function CropGuide({ rec }: CropGuideProps) {
  const diffLevel = rec.difficulty || 0;
  const diffText = diffLevel <= 2 ? '(초보 가능)' : diffLevel <= 3 ? '(보통)' : '(숙련 필요)';

  return (
    <div className={`${styles.card} ${styles.fadeIn} ${styles.fadeInDelay2}`}>
      <h2 className={styles.cardTitle}>재배 가이드</h2>
      <div className={styles.gridTwo} style={{ marginBottom: 0 }}>
        <table className={styles.infoTable}>
          <tbody>
            <tr><th>적정 파종시기</th><td>{rec.sowingPeriod || '—'}</td></tr>
            <tr><th>수확 시기</th><td>{rec.harvestPeriod || '—'}</td></tr>
            <tr><th>적정 온도</th><td>{rec.optimalTemp || '—'}</td></tr>
            <tr><th>생육 기간</th><td>{rec.growthDays ? `약 ${rec.growthDays}일` : '—'}</td></tr>
          </tbody>
        </table>
        <table className={styles.infoTable}>
          <tbody>
            <tr><th>예상 수확량</th><td>{rec.expectedYield ? `${rec.expectedYield.toLocaleString('ko-KR')} kg` : '—'}</td></tr>
            <tr><th>예상 수익</th><td className={styles.revenueHighlight}>₩{rec.expectedRevenuePerKg.toLocaleString('ko-KR')}/kg</td></tr>
            <tr>
              <th>주요 병해충</th>
              <td>
                {rec.pests && rec.pests.length > 0
                  ? rec.pests.map((p) => <span key={p} className={styles.pestTag}>{p}</span>)
                  : '—'}
              </td>
            </tr>
            <tr>
              <th>난이도</th>
              <td><DifficultyStars level={diffLevel} /> <span className={styles.diffLabel}>{diffText}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
