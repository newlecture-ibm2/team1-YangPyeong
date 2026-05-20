/* CropGuide — 재배 가이드 카드 + AI 상세 가이드북 모달 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { CropRecommendation, CropRecommendResponse } from '../../_lib/recommend.types';
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
import CropGuideModal from '../../_components/CropGuideModal/CropGuideModal';
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

interface CropGuideProps {
  rec: CropRecommendation;
  recommendResult?: CropRecommendResponse | null;
}

export default function CropGuide({ rec, recommendResult }: CropGuideProps) {
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const loadInFlightRef = useRef(false);

  const diffLevel = rec.difficulty || 0;
  const diffText = diffLevel <= 2 ? '(초보 가능)' : diffLevel <= 3 ? '(보통)' : '(숙련 필요)';

  const experienceLevel = useMemo(
    () => resolveExperienceForGuide(rec, recommendResult),
    [rec, recommendResult],
  );

  const fallbackGuide = useMemo(
    () => buildCropDetailedGuide(rec, { recommendResult }),
    [rec, recommendResult],
  );

  const [displayGuide, setDisplayGuide] = useState(fallbackGuide);

  useEffect(() => {
    setDisplayGuide(fallbackGuide);
  }, [fallbackGuide]);

  const openDetailedGuide = useCallback(async () => {
    if (loadInFlightRef.current) return;

    setIsGuideModalOpen(true);
    setDisplayGuide(fallbackGuide);

    const farmId = recommendResult?.farmInfo?.id;
    if (farmId == null) return;

    loadInFlightRef.current = true;
    setGuideLoading(true);

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
      }
    } catch (e) {
      if (e instanceof CropGuideApiError && e.isUnauthorized) {
        console.warn('재배 가이드: 로그인 필요, 로컬 가이드 사용');
      } else {
        console.warn('AI 재배 가이드 로드 실패, 로컬 가이드 사용:', e);
      }
      setDisplayGuide(fallbackGuide);
    } finally {
      loadInFlightRef.current = false;
      setGuideLoading(false);
    }
  }, [rec, recommendResult, experienceLevel, fallbackGuide]);

  return (
    <>
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

        <button
          type="button"
          className={guide.detailBtn}
          onClick={() => void openDetailedGuide()}
          disabled={guideLoading}
        >
          <span className={guide.detailBtnIcon}>📖</span>
          {guideLoading ? 'AI 가이드 생성 중…' : '더 자세한 재배 전문 가이드북 보기'}
          <span className={guide.detailBtnArrow}>→</span>
        </button>
      </div>

      <CropGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        guide={displayGuide}
        loading={guideLoading}
      />
    </>
  );
}
