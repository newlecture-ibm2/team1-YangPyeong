/* RecommendResultSkeleton — 분석 중 결과 영역 미리보기 */

import styles from './RecommendResultSkeleton.module.css';

export default function RecommendResultSkeleton() {
  return (
    <div className={styles.wrap} aria-hidden>
      <div className={styles.banner} />
      <h3 className={styles.titleSk} />
      <div className={styles.grid}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardRank} />
            <div className={styles.cardName} />
            <div className={styles.cardScore} />
            <div className={styles.cardBar} />
          </div>
        ))}
      </div>
      <div className={styles.table}>
        <div className={styles.tableHead} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.tableRow} />
        ))}
      </div>
    </div>
  );
}
