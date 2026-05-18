/* ScoreAnalysis — 아코디언 형태의 AI 분석 결과 (접힘/펼침) */

'use client';

import { useState } from 'react';
import type { CropRecommendation } from '../../_lib/recommend.types';
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

  const summaryText =
    rec.aiReason
      ? rec.aiReason.length > 80
        ? rec.aiReason.slice(0, 80) + '…'
        : rec.aiReason
      : '이 작물에 대한 AI 분석 결과를 확인해 보세요.';

  return (
    <div className={`${styles.fadeIn} ${styles.fadeInDelay1}`}>
      {/* ── 아코디언 헤더 (항상 노출) ── */}
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
            {!isOpen && (
              <p className={acc.headerSummary}>{summaryText}</p>
            )}
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

      {/* ── 아코디언 본문 (펼침 시) ── */}
      <div className={`${acc.body} ${isOpen ? acc.bodyOpen : ''}`}>
        <div className={acc.bodyInner}>
          <div className={styles.gridTwo}>
            {/* 추천 근거 */}
            <div className={acc.section}>
              <h3 className={acc.sectionTitle}>추천 근거</h3>
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
            <div className={acc.section}>
              <h3 className={acc.sectionTitle}>적합도 분석</h3>
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
        </div>
      </div>
    </div>
  );
}
