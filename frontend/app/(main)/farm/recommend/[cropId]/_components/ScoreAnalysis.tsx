/* ScoreAnalysis — 추천 근거 테이블 + 적합도 게이지 분석 (2열 레이아웃) */

import type { CropRecommendation } from '../../_lib/recommend.types';
import GaugeBar from '../../_components/GaugeBar/GaugeBar';
import styles from '../detail.module.css';

interface ScoreAnalysisProps {
  rec: CropRecommendation;
  fitnessLabel: string;
  supplyLabel: string;
}

export default function ScoreAnalysis({ rec, fitnessLabel, supplyLabel }: ScoreAnalysisProps) {
  return (
    <div className={`${styles.gridTwo} ${styles.fadeIn} ${styles.fadeInDelay1}`}>
      {/* 추천 근거 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>추천 근거</h2>
        <table className={styles.infoTable}>
          <tbody>
            <tr>
              <th>토양 적합도</th>
              <td><div className={styles.scoreRow}><strong>{rec.soilFitnessPercent}점</strong><span>— {fitnessLabel}</span></div></td>
            </tr>
            <tr>
              <th>시세 전망</th>
              <td><div className={styles.scoreRow}><strong>{rec.priceForecastPercent}점</strong><span>— 수익률 {rec.priceForecastPercent >= 80 ? '높음' : rec.priceForecastPercent >= 60 ? '보통' : '낮음'}</span></div></td>
            </tr>
            <tr>
              <th>수급 안정성</th>
              <td><div className={styles.scoreRow}><strong>{rec.supplyStabilityPercent}점</strong><span>— {supplyLabel}</span></div></td>
            </tr>
            <tr>
              <th>AI 종합</th>
              <td><span className={styles.totalScore}>{rec.score}점</span></td>
            </tr>
          </tbody>
        </table>
        {rec.aiReason && (
          <div className={styles.aiReason}>
            <div className={styles.aiReasonLabel}>🤖 AI 분석 의견</div>
            {rec.aiReason}
          </div>
        )}
      </div>

      {/* 적합도 게이지 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>적합도 분석</h2>
        <div style={{ padding: '16px 0' }}>
          <GaugeBar label="토양 적합도" value={rec.soilFitnessPercent} />
          <GaugeBar label="시세 전망" value={rec.priceForecastPercent} />
          <GaugeBar label="수급 안정성" value={rec.supplyStabilityPercent} />
        </div>
        <div className={styles.scoreCenter}>
          <div className={styles.scoreCenterLabel}>종합 추천 점수</div>
          <div className={styles.scoreCenterValue}>{rec.score}</div>
          <div className={styles.scoreCenterSub}>100점 만점</div>
        </div>
      </div>
    </div>
  );
}
