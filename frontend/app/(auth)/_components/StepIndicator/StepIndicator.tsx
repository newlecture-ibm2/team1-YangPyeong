'use client';

import styles from './StepIndicator.module.css';

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

/**
 * 멀티 스텝 폼의 진행 표시기 (회원가입 / 비밀번호 재설정 공통)
 */
export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className={styles.stepper}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep >= stepNum;
        const isDone = currentStep > stepNum;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.label} className={styles.stepGroup}>
            <div className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}>
              <div className={styles.stepCircle}>{isDone ? '✓' : stepNum}</div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {!isLast && (
              <div className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
