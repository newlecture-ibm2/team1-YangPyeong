/* CropGuide — 재배 가이드 (AI 우선, 실패 시 기본 fallback) */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/common/Toast/ToastContext';
import type { CropRecommendation, CropRecommendResponse } from '../../_lib/recommend.types';
import type { CropDetailedGuide } from '../../_lib/cropGuideData';
import {
  buildCropDetailedGuide,
  mapServerGuideToDetailedGuide,
  mergeGuideWithStructuredPests,
} from '../../_lib/cropGuideData';
import {
  buildCropGuideGenerateRequest,
  generateCropDetailedGuide,
  getCachedCropDetailedGuide,
  resolveExperienceForGuide,
  CropGuideApiError,
} from '../../_lib/cropGuide.api';
import CropGuideTopics from '../../_components/CropGuideTopics/CropGuideTopics';
import styles from '../detail.module.css';
import guide from './CropGuide.module.css';

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className={styles.difficultyStars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= level ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

/** idle: 미요청 | ai: AI 가이드 | basic: AI 실패 fallback */
type GuideView = 'idle' | 'ai' | 'basic';

interface CropGuideProps {
  rec: CropRecommendation;
  recommendResult?: CropRecommendResponse | null;
}

export default function CropGuide({ rec, recommendResult }: CropGuideProps) {
  const [guideView, setGuideView] = useState<GuideView>('idle');
  const [displayGuide, setDisplayGuide] = useState<CropDetailedGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const loadInFlightRef = useRef(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const diffLevel = rec.difficulty || 0;
  const diffText = diffLevel <= 2 ? '(초보 가능)' : diffLevel <= 3 ? '(보통)' : '(숙련 필요)';

  const experienceLevel = useMemo(
    () => resolveExperienceForGuide(rec, recommendResult),
    [rec, recommendResult],
  );

  const basicGuide = useMemo(
    () => buildCropDetailedGuide(rec, { recommendResult }),
    [rec, recommendResult],
  );

  useEffect(() => {
    setGuideView('idle');
    setDisplayGuide(null);
  }, [basicGuide]);

  const applyBasicFallback = useCallback(
    (message?: string) => {
      setDisplayGuide(basicGuide);
      setGuideView('basic');
      if (message) {
        toastError(message);
      }
    },
    [basicGuide, toastError],
  );

  const requestAiGuide = useCallback(async () => {
    if (loadInFlightRef.current) return;

    const farmId = recommendResult?.farmInfo?.id;
    if (farmId == null) {
      applyBasicFallback('농장 정보를 찾을 수 없어 AI 가이드를 생성할 수 없습니다. 기본 가이드를 표시합니다.');
      return;
    }

    loadInFlightRef.current = true;
    setGuideLoading(true);
    setDisplayGuide(null);
    setGuideView('idle');

    try {
      const cached = await getCachedCropDetailedGuide(
        farmId,
        rec.cropId,
        rec,
        recommendResult,
        experienceLevel,
      );

      if (cached?.topics?.length) {
        const mapped = mapServerGuideToDetailedGuide(cached);
        if (mapped.topics.length > 0) {
          setDisplayGuide(mergeGuideWithStructuredPests(mapped, rec));
          setGuideView('ai');
          toastSuccess('AI 맞춤 재배 가이드를 불러왔습니다.');
          return;
        }
      }

      const generated = await generateCropDetailedGuide(
        farmId,
        rec.cropId,
        buildCropGuideGenerateRequest(rec, recommendResult, experienceLevel),
      );

      const mapped = mapServerGuideToDetailedGuide(generated);
      if (mapped.topics.length > 0) {
        setDisplayGuide(mergeGuideWithStructuredPests(mapped, rec));
        setGuideView('ai');
        toastSuccess('AI 맞춤 재배 가이드가 생성되었습니다.');
      } else {
        applyBasicFallback('AI 가이드 내용이 비어 있어 기본 가이드를 표시합니다.');
      }
    } catch (e) {
      if (e instanceof CropGuideApiError && e.isUnauthorized) {
        applyBasicFallback('로그인이 필요합니다. 기본 가이드를 표시합니다.');
      } else {
        const message = e instanceof Error ? e.message : 'AI 재배 가이드 생성에 실패했습니다.';
        applyBasicFallback(`${message} 기본 가이드를 표시합니다.`);
      }
    } finally {
      loadInFlightRef.current = false;
      setGuideLoading(false);
    }
  }, [
    rec,
    recommendResult,
    experienceLevel,
    applyBasicFallback,
    toastSuccess,
  ]);

  const farmId = recommendResult?.farmInfo?.id;
  const hasGuideContent = displayGuide != null && (guideView === 'ai' || guideView === 'basic');

  return (
    <div className={`${styles.card} ${styles.fadeIn} ${styles.fadeInDelay2}`}>
      <h2 className={styles.cardTitle}>재배 가이드</h2>
      <div className={styles.gridTwo} style={{ marginBottom: 0 }}>
        <table className={styles.infoTable}>
          <tbody>
            <tr><th>적정 파종시기</th><td>{rec.sowingPeriod || '—'}</td></tr>
            <tr><th>수확 시기</th><td>{rec.harvestPeriod || '—'}</td></tr>
            <tr><th>적정 온도</th><td>{rec.optimalTemp || '—'}</td></tr>
            <tr><th>생육 기간</th><td>{rec.growthDays ? `약 ${rec.growthDays}일` : '—'}</td></tr>
          </tbody>
        </table>
        <table className={styles.infoTable}>
          <tbody>
            <tr><th>예상 수확량</th><td>{rec.expectedYield ? `${rec.expectedYield.toLocaleString('ko-KR')} kg` : '—'}</td></tr>
            <tr><th>예상 수익</th><td className={styles.revenueHighlight}>₩{rec.expectedRevenuePerKg.toLocaleString('ko-KR')}/kg</td></tr>
            <tr>
              <th>주요 병해충</th>
              <td>
                {rec.pests && rec.pests.length > 0
                  ? rec.pests.map((p) => <span key={p} className={styles.pestTag}>{p}</span>)
                  : '—'}
              </td>
            </tr>
            <tr>
              <th>난이도</th>
              <td><DifficultyStars level={diffLevel} /> <span className={styles.diffLabel}>{diffText}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={guide.detailSection}>
        <div className={guide.detailHeader}>
          <h3 className={guide.detailTitle}>재배 상세 가이드</h3>
          {guideView === 'ai' && <span className={guide.badgeAi}>AI 맞춤</span>}
          {guideView === 'basic' && <span className={guide.badgeBasic}>기본 가이드</span>}
        </div>

        {guideView === 'idle' && !guideLoading && (
          <p className={guide.detailHint}>
            농장 토양·재배 상황을 반영한 AI 맞춤 재배 가이드는 아래 버튼을 눌러 생성할 수 있습니다.
          </p>
        )}

        {guideView === 'basic' && !guideLoading && (
          <p className={guide.fallbackWarn}>
            AI 서버 연동에 실패해 기본 재배 가이드를 대신 표시합니다. 네트워크 확인 후 AI 분석을 다시 시도해 주세요.
          </p>
        )}

        {guideLoading && (
          <div className={guide.loadingBlock}>
            <span className={guide.aiSpinnerDark} aria-hidden />
            <p>AI 맞춤 재배 가이드를 생성하고 있습니다…</p>
            <span className={guide.detailHintMuted}>보통 15~30초 소요</span>
          </div>
        )}

        {hasGuideContent && displayGuide && (
          <CropGuideTopics
            guide={displayGuide}
            loading={false}
            showIntro={guideView === 'ai'}
            showFooter
          />
        )}

        <div className={guide.actionRow}>
          {(guideView === 'idle' || guideView === 'basic') && (
            <button
              type="button"
              className={guide.aiButton}
              onClick={() => void requestAiGuide()}
              disabled={guideLoading}
            >
              {guideLoading ? (
                <>
                  <span className={guide.aiSpinner} aria-hidden />
                  AI 가이드 생성 중…
                </>
              ) : (
                <>🤖 AI 맞춤 재배 가이드 받기</>
              )}
            </button>
          )}

          {guideView === 'ai' && !guideLoading && (
            <button
              type="button"
              className={guide.aiButtonSecondary}
              onClick={() => void requestAiGuide()}
            >
              AI 가이드 새로고침
            </button>
          )}
        </div>

        {guideView === 'idle' && !guideLoading && farmId == null && (
          <p className={guide.detailHintMuted}>
            농장 정보가 없으면 AI 생성 대신 기본 가이드가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
