/* DetailKpiRow — KPI 요약 카드 4개 */

import styles from '../detail.module.css';

interface KpiItem {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

interface DetailKpiRowProps {
  items: KpiItem[];
}

export default function DetailKpiRow({ items }: DetailKpiRowProps) {
  return (
    <div className={`${styles.kpiRow} ${styles.fadeIn}`}>
      {items.map((kpi) => (
        <div key={kpi.label} className={styles.kpiCard}>
          <div className={styles.kpiIcon}>{kpi.icon}</div>
          <div className={styles.kpiLabel}>{kpi.label}</div>
          <div className={styles.kpiValue} style={kpi.color ? { color: kpi.color } : {}}>{kpi.value}</div>
        </div>
      ))}
    </div>
  );
}
