/* AnalyzeLoader — 분석 CTA · 단계별 진행 · 스켈레톤 */

'use client';

import { ANALYZE_STEPS } from '../../_lib/analyzeSteps';
import RecommendResultSkeleton from '../RecommendResultSkeleton/RecommendResultSkeleton';
import styles from './AnalyzeLoader.module.css';

interface AnalyzeLoaderProps {
  isAnalyzing: boolean;
  isHydrating?: boolean;
  hasResult: boolean;
  disabled: boolean;
  analyzeStepIndex: number;
  onAnalyze: () => void;
}

export default function AnalyzeLoader({
  isAnalyzing,
  isHydrating = false,
  hasResult,
  disabled,
  analyzeStepIndex,
  onAnalyze,
}: AnalyzeLoaderProps) {
  if (isAnalyzing) {
    const step = ANALYZE_STEPS[Math.min(analyzeStepIndex, ANALYZE_STEPS.length - 1)];
    const progress = ((analyzeStepIndex + 1) / ANALYZE_STEPS.length) * 100;

    return (
      <div className={styles.analyzingBlock}>
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <div className={styles.spinner} aria-hidden />
            <div>
              <p className={styles.text}>AI가 최적의 작물을 분석 중입니다</p>
              <p className={styles.sub}>{step.hint}</p>
            </div>
          </div>

          <div className={styles.progressTrack} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <ol className={styles.stepList}>
            {ANALYZE_STEPS.map((s, idx) => {
              const state = idx < analyzeStepIndex ? 'done' : idx === analyzeStepIndex ? 'active' : 'pending';
              return (
                <li key={s.id} className={`${styles.stepItem} ${styles[state]}`}>
                  <span className={styles.stepIcon} aria-hidden>
                    {state === 'done' ? '✓' : s.icon}
                  </span>
                  <span className={styles.stepLabel}>{s.label}</span>
                </li>
              );
            })}
          </ol>

          <p className={styles.eta}>보통 20~40초 정도 소요됩니다. 창을 닫지 말고 잠시만 기다려 주세요.</p>
        </div>

        <RecommendResultSkeleton />
      </div>
    );
  }

  if (hasResult) {
    return (
      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <button
            type="button"
            className={styles.retryButton}
            onClick={onAnalyze}
            disabled={disabled || isHydrating}
          >
            🤖 AI 작물 추천 다시 분석
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cta}>
      {isHydrating && (
        <p className={styles.sub} style={{ marginBottom: '12px', textAlign: 'center' }}>
          저장된 추천 결과를 불러오는 중입니다…
        </p>
      )}
      <button
        type="button"
        className={styles.ctaButton}
        onClick={onAnalyze}
        disabled={disabled || isHydrating}
      >
        🤖 AI 작물 추천 분석 시작
      </button>
    </div>
  );
}
