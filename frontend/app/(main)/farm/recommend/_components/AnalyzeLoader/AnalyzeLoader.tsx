/* AnalyzeLoader — 분석 로딩 & CTA 버튼 */

import styles from './AnalyzeLoader.module.css';

interface AnalyzeLoaderProps {
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
  disabled: boolean;
  onAnalyze: () => void;
}

export default function AnalyzeLoader({ isAnalyzing, hasAnalyzed, disabled, onAnalyze }: AnalyzeLoaderProps) {
  if (hasAnalyzed) return null;

  if (isAnalyzing) {
    return (
      <div className={styles.overlay}>
        <div className={styles.spinner} />
        <p className={styles.text}>AI가 최적의 작물을 분석 중입니다...</p>
        <p className={styles.sub}>토양 데이터, 기상 정보, 수급 현황을 종합 분석하고 있습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.cta}>
      <button className={styles.ctaButton} onClick={onAnalyze} disabled={disabled}>
        🤖 AI 작물 추천 분석 시작
      </button>
    </div>
  );
}
