/* SoilPanel — 토양 정보 요약 패널 */

import type { CropRecommendResponse } from '../../_lib/recommend.types';
import type { FarmListItem } from '../../../_lib/farm.types';
import styles from './SoilPanel.module.css';

interface SoilPanelProps {
  farm: FarmListItem;
  result: CropRecommendResponse | null;
}

export default function SoilPanel({ farm, result }: SoilPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.card}>
        <div className={styles.icon}>🧪</div>
        <div className={styles.label}>토양 pH</div>
        <div className={styles.value}>{result?.farmInfo.soilPh ?? '—'}</div>
      </div>
      <div className={`${styles.card} ${styles.delay1}`}>
        <div className={styles.icon}>🌱</div>
        <div className={styles.label}>유기물</div>
        <div className={styles.value}>
          {result?.farmInfo.organicMatter ?? '—'}
          <span className={styles.unit}> g/kg</span>
        </div>
      </div>
      <div className={`${styles.card} ${styles.delay2}`}>
        <div className={styles.icon}>📐</div>
        <div className={styles.label}>재배 면적</div>
        <div className={styles.value}>
          {(result?.farmInfo.area ?? farm.area).toLocaleString('ko-KR')}
          <span className={styles.unit}> ㎡</span>
        </div>
      </div>
      <div className={`${styles.card} ${styles.delay3}`}>
        <div className={styles.icon}>🏔️</div>
        <div className={styles.label}>토양 유형</div>
        <div className={styles.value} style={{ fontSize: '22px' }}>
          {result?.farmInfo.soilType ?? '—'}
        </div>
      </div>
    </div>
  );
}
