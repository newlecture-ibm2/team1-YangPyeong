/* CalendarPlanModal — 재배 캘린더 세부 계획서 모달 */

'use client';

import Modal from '@/components/common/Modal/Modal';
import type { CropDetailedPlan } from '../../_lib/calendarPlanData';
import styles from './CalendarPlanModal.module.css';

interface CalendarPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CropDetailedPlan;
}

export default function CalendarPlanModal({ isOpen, onClose, plan }: CalendarPlanModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`📅 ${plan.cropName} 재배 세부 계획서`} size="lg">
      <div className={styles.container}>
        {/* 상단 요약 */}
        <div className={styles.summary}>
          <div className={styles.summaryIcon}>🌱</div>
          <div>
            <h3 className={styles.summaryTitle}>{plan.cropName} 주별 재배 실행 가이드</h3>
            <p className={styles.summaryDesc}>
              총 재배 기간: <strong>{plan.totalDuration}</strong> · 아래 월별 계획을 참고하여 나만의 재배 일정을 세워보세요.
            </p>
          </div>
        </div>

        {/* 월별 타임라인 */}
        <div className={styles.timeline}>
          {plan.plans.map((monthly, mIdx) => (
            <div key={mIdx} className={styles.monthBlock}>
              {/* 월 헤더 */}
              <div className={styles.monthHeader}>
                <span className={styles.monthBadge} style={{ background: monthly.phaseColor, color: monthly.phaseColor === '#CCFF33' ? '#1a1a1a' : '#fff' }}>
                  {monthly.month}월
                </span>
                <span className={styles.phaseLabel}>{monthly.phase}</span>
              </div>

              {/* 주별 작업 카드 */}
              <div className={styles.weekCards}>
                {monthly.weeks.map((week, wIdx) => (
                  <div key={wIdx} className={styles.weekCard}>
                    <div className={styles.weekHeader}>
                      <span className={styles.weekBadge}>{week.week}</span>
                      <span className={styles.weekTask}>{week.task}</span>
                    </div>
                    <p className={styles.weekDetail}>{week.detail}</p>
                    {week.tip && (
                      <div className={styles.weekTip}>
                        <span className={styles.tipIcon}>💡</span>
                        <span>{week.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 연결선 (마지막 월 제외) */}
              {mIdx < plan.plans.length - 1 && <div className={styles.connector} />}
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className={styles.footer}>
          <p>💡 위 계획은 양평군 기준 일반적인 재배 가이드입니다. 실제 기후·토양 조건에 따라 일정을 조정하세요.</p>
        </div>
      </div>
    </Modal>
  );
}
