/* AnalyzeLoader — 최초 분석 CTA · 재분석 버튼 · 로딩 */

import styles from './AnalyzeLoader.module.css';

interface AnalyzeLoaderProps {
  isAnalyzing: boolean;
  isHydrating?: boolean;
  hasResult: boolean;
  disabled: boolean;
  onAnalyze: () => void;
}

export default function AnalyzeLoader({
  isAnalyzing,
  isHydrating = false,
  hasResult,
  disabled,
  onAnalyze,
}: AnalyzeLoaderProps) {
  if (isAnalyzing) {
    return (
      <div className={styles.overlay}>
        <div className={styles.spinner} />
        <p className={styles.text}>AI가 최적의 작물을 분석 중입니다...</p>
        <p className={styles.sub}>토양 데이터, 기상 정보, 수급 현황을 종합 분석하고 있습니다.</p>
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
