/* ScoreAnalysis — 아코디언 형태의 AI 분석 결과 (접힘/펼침) */

'use client';

import { useState } from 'react';
import type { CropRecommendation } from '../../_lib/recommend.types';
import { formatDisplayAiReason } from '../../_lib/recommend.utils';
import GaugeBar from '../../_components/GaugeBar/GaugeBar';
import styles from '../detail.module.css';
import acc from './ScoreAnalysis.module.css';

interface ScoreAnalysisProps {
  rec: CropRecommendation;
  fitnessLabel: string;
  supplyLabel: string;
}

export default function ScoreAnalysis({ rec, fitnessLabel, supplyLabel }: ScoreAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);

  const aiReason = formatDisplayAiReason(rec.aiReason);
  const summaryText = aiReason
    ? aiReason.length > 140
      ? aiReason.slice(0, 140) + '…'
      : aiReason
    : '토양·시세·수급 점수를 바탕으로 한 추천입니다.';

  const priceLevel =
    rec.priceForecastPercent >= 80 ? '높음' : rec.priceForecastPercent >= 60 ? '보통' : '낮음';

  return (
    <div className={`${styles.fadeIn} ${styles.fadeInDelay1}`}>
      <button
        type="button"
        className={acc.header}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className={acc.headerLeft}>
          <span className={acc.headerIcon}>🤖</span>
          <div>
            <div className={acc.headerTitle}>
              AI 종합 추천 점수
              <span className={acc.headerScore}>{rec.score}점</span>
            </div>
            {!isOpen && <p className={acc.headerSummary}>{summaryText}</p>}
          </div>
        </div>
        <div className={acc.headerRight}>
          <div className={acc.miniGauges}>
            <span className={acc.miniGauge}>
              <span className={acc.miniGaugeDot} style={{ background: '#10B981' }} />
              토양 {rec.soilFitnessPercent}
            </span>
            <span className={acc.miniGauge}>
              <span className={acc.miniGaugeDot} style={{ background: '#F59E0B' }} />
              시세 {rec.priceForecastPercent}
            </span>
            <span className={acc.miniGauge}>
              <span className={acc.miniGaugeDot} style={{ background: '#3B82F6' }} />
              수급 {rec.supplyStabilityPercent}
            </span>
          </div>
          <span className={`${acc.chevron} ${isOpen ? acc.chevronOpen : ''}`}>▼</span>
        </div>
      </button>

      <div className={`${acc.body} ${isOpen ? acc.bodyOpen : ''}`}>
        <div className={acc.bodyInner}>
          <div className={styles.gridTwo}>
            <div className={acc.section}>
              <h3 className={acc.sectionTitle}>점수 상세</h3>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <th>토양 적합도</th>
                    <td>
                      <div className={styles.scoreRow}>
                        <strong>{rec.soilFitnessPercent}점</strong>
                        <span>— {fitnessLabel}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>시세 전망</th>
                    <td>
                      <div className={styles.scoreRow}>
                        <strong>{rec.priceForecastPercent}점</strong>
                        <span>— 수익률 {priceLevel}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>수급 안정성</th>
                    <td>
                      <div className={styles.scoreRow}>
                        <strong>{rec.supplyStabilityPercent}점</strong>
                        <span>— {supplyLabel}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>AI 종합</th>
                    <td>
                      <span className={styles.totalScore}>{rec.score}점</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className={acc.gaugeBlock}>
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

            <div className={`${acc.section} ${acc.opinionSection}`}>
              <h3 className={acc.sectionTitle}>🤖 AI 분석 의견</h3>
              {aiReason ? (
                <p className={acc.opinionText}>{aiReason}</p>
              ) : (
                <p className={acc.opinionEmpty}>
                  이 작물에 대한 AI 코멘트가 아직 없습니다. 추천 목록에서 「다시 분석」을 실행하면
                  생성됩니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
