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
        {/* 상단 소개 */}
        <div className={styles.intro}>
          <p>
            <strong>{plan.cropName}</strong>의 월별·주별 재배 실행 가이드입니다.
            총 재배 기간 <strong>{plan.totalDuration}</strong> 동안의 핵심 작업을 단계별로 안내합니다.
          </p>
        </div>

        {/* 월별 토픽 카드 */}
        <div className={styles.topics}>
          {plan.plans.map((monthly) => (
            <div key={`${monthly.month}-${monthly.phase}`} className={styles.topicCard}>
              <div className={styles.topicHeader}>
                <span
                  className={styles.topicIcon}
                  style={{ background: monthly.phaseColor, color: monthly.phaseColor === '#CCFF33' ? '#1a1a1a' : '#fff' }}
                >
                  {monthly.month}월
                </span>
                <h3 className={styles.topicTitle}>{monthly.phase}</h3>
              </div>
              <ul className={styles.topicList}>
                {monthly.weeks.map((week, wIdx) => (
                  <li key={wIdx} className={styles.topicItem}>
                    <strong className={styles.weekLabel}>[{week.week}] {week.task}</strong>
                    <span className={styles.weekDetail}>{week.detail}</span>
                    {week.tip && (
                      <span className={styles.weekTip}>💡 {week.tip}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className={styles.footer}>
          <p>📚 위 일정은 이 작물의 추천 파종·수확 시기·생육 기간을 반영했습니다. 실제 기후·토양에 맞게 조정하세요.</p>
        </div>
      </div>
    </Modal>
  );
}
