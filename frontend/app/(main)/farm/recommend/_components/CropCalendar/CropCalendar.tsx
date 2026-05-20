/* CropCalendar — 재배 캘린더 시각화 */

import type { CalendarPhase } from '../../_lib/recommend.types';
import styles from './CropCalendar.module.css';

const ALL_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

interface CropCalendarProps {
  phases: CalendarPhase[];
}

export default function CropCalendar({ phases }: CropCalendarProps) {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.label} />
          {ALL_MONTHS.map((m) => (
            <div key={m} className={styles.month}>{m}</div>
          ))}
        </div>
        {phases.map((phase, idx) => (
          <div key={idx} className={styles.row}>
            <div className={styles.label}>{phase.label}</div>
            {ALL_MONTHS.map((_, mi) => {
              const monthNum = mi + 1;
              const isActive = monthNum >= phase.startMonth && monthNum <= phase.endMonth;
              return (
                <div
                  key={mi}
                  className={`${styles.cell} ${isActive ? styles.cellActive : ''}`}
                  style={isActive ? { backgroundColor: phase.color, color: phase.color === '#CCFF33' ? '#1a1a1a' : '#fff' } : {}}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        {phases.map((phase, idx) => (
          <div key={idx} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: phase.color }} />
            <span>{phase.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
