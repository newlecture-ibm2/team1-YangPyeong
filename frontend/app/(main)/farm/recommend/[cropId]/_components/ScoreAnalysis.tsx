/* ScoreAnalysis — 아코디언 형태의 AI 분석 결과 (접힘/펼침) */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CropRecommendation } from '../../_lib/recommend.types';
import {
  canRequestAiCoaching,
  cultivationRegisterHref,
  formatDisplayAiReason,
} from '../../_lib/recommend.utils';
import { summarizeAiReason } from '../../_lib/formatAiReason';
import GaugeBar from '../../_components/GaugeBar/GaugeBar';
import AiReasonDisplay from './AiReasonDisplay';
import styles from '../detail.module.css';
import acc from './ScoreAnalysis.module.css';

interface ScoreAnalysisProps {
  rec: CropRecommendation;
  fitnessLabel: string;
  supplyLabel: string;
  isCoaching?: boolean;
  onRequestCoaching?: () => void;
}

export default function ScoreAnalysis({
  rec,
  fitnessLabel,
  supplyLabel,
  isCoaching = false,
  onRequestCoaching,
}: ScoreAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);

  const aiReason = formatDisplayAiReason(rec.aiReason);
  const canRequest = canRequestAiCoaching(rec.aiCoachingStatus);
  const summaryText = aiReason
    ? summarizeAiReason(aiReason, 140)
    : '토양·시세·수급 점수를 바탕으로 한 추천입니다.';

  const priceLevel =
    rec.priceForecastPercent >= 80 ? '높음' : rec.priceForecastPercent >= 60 ? '보통' : '낮음';

  useEffect(() => {
    if (isCoaching) {
      setIsOpen(true);
    }
  }, [isCoaching]);

  const handleRequestCoaching = () => {
    setIsOpen(true);
    onRequestCoaching?.();
  };

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
              {isCoaching ? (
                <div className={acc.coachingLoading}>
                  <span className={acc.coachingSpinner} aria-hidden />
                  <p>AI 맞춤 코칭을 생성 중입니다…</p>
                  <span className={acc.coachingEta}>보통 15~30초 소요</span>
                </div>
              ) : aiReason ? (
                <AiReasonDisplay text={aiReason} />
              ) : canRequest && onRequestCoaching ? (
                <div className={acc.opinionEmptyState}>
                  <p className={acc.opinionEmpty}>이 작물에 대한 AI 맞춤 코칭을 생성할 수 있습니다.</p>
                  <button type="button" className={acc.coachingButton} onClick={handleRequestCoaching}>
                    🤖 AI 코칭 받기
                  </button>
                </div>
              ) : rec.aiCoachingStatus === 'NEEDS_DATA' ? (
                <div className={acc.opinionEmptyState}>
                  {rec.aiCoachingHint && <p className={acc.opinionEmpty}>{rec.aiCoachingHint}</p>}
                  <Link href={cultivationRegisterHref(rec)} className={acc.dataLink}>
                    재배 데이터 입력 →
                  </Link>
                </div>
              ) : (
                <p className={acc.opinionEmpty}>AI 코칭 대상이 아닌 작물입니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
