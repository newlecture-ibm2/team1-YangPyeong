'use client';

import Link from 'next/link';
import useRecommend from './useRecommend';
import SoilPanel from './_components/SoilPanel/SoilPanel';
import AnalyzeLoader from './_components/AnalyzeLoader/AnalyzeLoader';
import RankingCard from './_components/RankingCard/RankingCard';
import RecommendTable from './_components/RecommendTable/RecommendTable';
import MockupOverlay from '@/components/common/MockupOverlay/MockupOverlay';
import { DUMMY_RECOMMENDATIONS } from '@/lib/preview-data';
import { RECOMMEND_MODE_LABEL, type CropRecommendation } from './_lib/recommend.types';
import { recommendItemKey } from './_lib/recommend.utils';
import styles from './page.module.css';
import farmStyles from '../page.module.css';

export default function RecommendListPage() {
  const hook = useRecommend();

  if (hook.isFarmsLoading) {
    return (
      <div className={farmStyles.container}>
        <p className={styles.loading}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (hook.farms.length === 0) {
    const previewRecs = DUMMY_RECOMMENDATIONS.map((r, i) => ({
      cropId: i,
      cropName: r.cropName,
      score: r.score,
    })) as CropRecommendation[];

    return (
      <div className={farmStyles.container}>
        <div className={farmStyles.header}>
          <div>
            <h1 className={farmStyles.title}>AI 작물 추천 <span className={styles.italic}>{hook.hasUnapprovedFarms ? '심사 대기 중' : '미리보기'}</span></h1>
            <p className={farmStyles.subtitle}>농장 환경에 맞는 최적의 작물을 미리 체험해 보세요.</p>
          </div>
        </div>
        <MockupOverlay hasUnapprovedFarms={hook.hasUnapprovedFarms}>
          <div className={styles.content}>
            <div className={styles.rankingGrid}>
              {previewRecs.slice(0, 3).map((rec, idx) => (
                <RankingCard key={recommendItemKey(rec, 'recommendation', idx)} rec={rec} index={idx} />
              ))}
            </div>
            <RecommendTable recommendations={previewRecs} />
          </div>
        </MockupOverlay>
      </div>
    );
  }

  return (
    <div className={farmStyles.container}>
      <div className={farmStyles.header}>
        <div>
          <p className={farmStyles.breadcrumb}>
            <Link href="/" className={farmStyles.breadcrumbLink}>홈</Link> /
            <Link href="/farm" className={farmStyles.breadcrumbLink}> 내 농장</Link> / AI 작물 추천
          </p>
          <h1 className={farmStyles.title}>AI 작물 추천</h1>
          <p className={farmStyles.subtitle}>
            내 농장 환경에 꼭 맞는 최적의 작물을 AI가 추천해 드립니다.
          </p>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '32px', display: 'flex', gap: '32px' }}>
        <Link href="/farm" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px' }}>대시보드</Link>
        <Link href="/balance" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px' }}>수급 분석</Link>
        <button type="button" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, borderBottom: '2px solid var(--color-primary)', paddingBottom: '16px', marginBottom: '-1px', cursor: 'pointer' }}>AI 작물 추천</button>
        <Link href="/farm" style={{ textDecoration: 'none', color: 'var(--color-text-light)', fontWeight: 600, paddingBottom: '16px' }}>농장 일지</Link>
      </div>

      <div className={styles.content}>
        {hook.farm && (
          <SoilPanel
            area={hook.displayArea}
            values={hook.soilValues}
            isDirty={hook.isSoilDirty}
            isSaving={hook.isSavingSoil}
            onChange={hook.handleSoilChange}
            onSave={hook.handleSaveSoil}
          />
        )}
        <AnalyzeLoader
          isAnalyzing={hook.isAnalyzing}
          analyzeStepIndex={hook.analyzeStepIndex}
          isHydrating={hook.isHydrating}
          hasResult={hook.hasResult}
          disabled={!hook.farm}
          onAnalyze={hook.handleAnalyze}
        />

        {hook.result && !hook.isAnalyzing && (
          <>
            {hook.recommendMode && (
              <p className={styles.modeBanner}>
                분석 모드: <strong>{RECOMMEND_MODE_LABEL[hook.recommendMode] ?? hook.recommendMode}</strong>
              </p>
            )}

            {hook.currentCropAdvices.length > 0 && (
              <section className={styles.coachingSection}>
                <h3 className={styles.sectionTitle}>현재·예정 작물 코칭</h3>
                <div className={styles.rankingGrid}>
                  {hook.currentCropAdvices.map((rec, idx) => (
                    <RankingCard
                      key={recommendItemKey(rec, 'coaching', idx)}
                      rec={rec}
                      index={idx}
                      farmId={hook.farm?.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {hook.top3.length > 0 && (
              <>
                <h3 className={styles.sectionTitle}>
                  {hook.recommendMode === 'MANAGE' || hook.recommendMode === 'MIXED'
                    ? '다음 시즌·참고 작물'
                    : '추천 TOP 3'}
                </h3>
                <div className={styles.rankingGrid} data-guide="recommend-ranking">
                  {hook.top3.map((rec, idx) => (
                    <RankingCard
                      key={recommendItemKey(rec, 'recommendation', idx)}
                      rec={rec}
                      index={idx}
                      farmId={hook.farm?.id}
                    />
                  ))}
                </div>
              </>
            )}

            <div data-guide="recommend-detail">
              <RecommendTable farmId={hook.farm?.id} recommendations={hook.allRecs} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
