/* GaugeBar — 게이지 바 (리스트/상세 공유) */

import styles from './GaugeBar.module.css';

interface GaugeBarProps {
  label: string;
  value: number;
}

export default function GaugeBar({ label, value }: GaugeBarProps) {
  const colorClass =
    value >= 80 ? styles.fillGreen :
    value >= 50 ? styles.fillOrange :
    styles.fillRed;

  return (
    <>
      <div className={styles.row}>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className={styles.track}>
        <div className={`${styles.fill} ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
    </>
  );
}
