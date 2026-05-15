'use client';

import Link from 'next/link';
import { usePolicyRecommend } from '../_lib/usePolicyRecommend';
import PolicyRecommendGuideBanner from '@/components/common/PolicyRecommendGuideBanner/PolicyRecommendGuideBanner';
import styles from './page.module.css';

export default function PolicyRecommendPage() {
  const { data, isLoading, error, statusCode } = usePolicyRecommend();

  const getScoreClass = (score: number) => {
    if (score >= 80) return styles.matchBadgeHigh;
    if (score >= 60) return styles.matchBadgeMedium;
    if (score >= 40) return styles.matchBadgeLow;
    return styles.matchBadgeNone;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>나에게 맞는 정책 추천</h1>
        <p className={styles.description}>
          등록된 농장과 재배 작물 정보를 바탕으로 신청 가능성이 높은 정책을 추천합니다.
        </p>
      </div>

      <div className={styles.content}>
        {isLoading && (
          <div className={styles.stateContainer}>
            <span className={styles.icon}>⏳</span>
            <p className={styles.stateMessage}>맞춤 정책을 찾고 있습니다...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className={styles.stateContainer}>
            <span className={styles.icon}>🔒</span>
            {statusCode === 401 ? (
              <>
                <h2 className={styles.stateTitle}>맞춤 정책 추천은 로그인이 필요합니다</h2>
                <p className={styles.stateMessage}>등록된 농장과 재배 작물 정보를 기반으로 맞춤 정책을 추천하기 위해 로그인이 필요합니다.</p>
                <div className={styles.buttonGroup}>
                  <Link href="/login" className={styles.actionButton}>로그인하러 가기</Link>
                  <Link href="/policy" className={styles.secondaryButton}>전체 정책 보기</Link>
                </div>
              </>
            ) : statusCode === 403 ? (
              <PolicyRecommendGuideBanner userRole="GENERAL" farmCount={0} variant="page" />
            ) : (
              <>
                <h2 className={styles.stateTitle}>알 수 없는 오류가 발생했습니다</h2>
                <p className={styles.stateMessage}>{error}</p>
                <Link href="/policy" className={styles.actionButton}>정책 목록으로 돌아가기</Link>
              </>
            )}
          </div>
        )}

        {!isLoading && !error && data && (
          <div className={styles.resultContainer}>
            {data.farmerProfile.farmCount === 0 ? (
              // 농장이 하나도 없을 때는 추천 리스트나 프로필을 숨기고 등록 유도 가이드만 표시
              <PolicyRecommendGuideBanner userRole="FARMER" farmCount={0} variant="page" />
            ) : (
              // 농장이 1개 이상 있을 때 정상적으로 추천 결과 표시
              <>
                {/* 1. 프로필 요약 카드 */}
                <div className={styles.profileCard}>
                  <h3 className={styles.profileTitle}>✨ {data.farmerProfile.name || '농업인'}님의 프로필 분석</h3>
                  <div className={styles.profileGrid}>
                    <div className={styles.profileItem}>
                      <span className={styles.profileLabel}>지역</span>
                      <span className={styles.profileValue}>{data.farmerProfile.regionName || '정보 없음'}</span>
                    </div>
                    <div className={styles.profileItem}>
                      <span className={styles.profileLabel}>등록 농장</span>
                      <span className={styles.profileValue}>{data.farmerProfile.farmCount}개</span>
                    </div>
                    <div className={styles.profileItem}>
                      <span className={styles.profileLabel}>총 재배 면적</span>
                      <span className={styles.profileValue}>{data.farmerProfile.totalArea.toLocaleString()}㎡</span>
                    </div>
                    <div className={styles.profileItem}>
                      <span className={styles.profileLabel}>재배 작물</span>
                      <span className={styles.profileValue}>
                        {data.farmerProfile.crops.length > 0 ? data.farmerProfile.crops.join(', ') : '정보 없음'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 작물 미등록 상태 처리 */}
                {data.farmerProfile.crops.length === 0 && (
                  <div className={styles.emptyState}>
                    <span className={styles.icon}>🌾</span>
                    <h3 className={styles.emptyStateTitle}>재배 작물 정보가 부족합니다</h3>
                    <p className={styles.emptyStateDesc}>현재 재배 중인 작물을 등록하면 작물별 지원사업과 보조금 정책을 더 정확히 추천할 수 있습니다.</p>
                    <div className={styles.buttonGroup}>
                      <Link href="/farm/seed" className={styles.actionButton}>재배 정보 등록하기</Link>
                    </div>
                  </div>
                )}

                {/* 2. 추천 정책 리스트 */}
                {data.recommendedPolicies.length === 0 && (
                  <div className={styles.emptyState}>
                    <span className={styles.icon}>📭</span>
                    <h3 className={styles.emptyStateTitle}>현재 조건에 딱 맞는 추천 정책이 없습니다</h3>
                    <p className={styles.emptyStateDesc}>전체 정책 목록에서 지역/분야 필터를 활용해 직접 확인해 보세요.</p>
                    <Link href="/policy" className={styles.actionButton}>전체 정책 보기</Link>
                  </div>
                )}

                {data.recommendedPolicies.length > 0 && (
                  <>
                    {data.farmerProfile.crops.length === 0 && (
                      <div className={styles.fallbackNotice}>
                        <p>💡 재배 작물 정보가 없어 <strong>거주 지역 기반</strong>으로 우선 추천된 정책입니다.</p>
                      </div>
                    )}
                    <div className={styles.policyList}>
                      {[...data.recommendedPolicies].sort((a, b) => b.matchScore - a.matchScore).map((policy) => (
                        <div key={policy.policyId} className={styles.policyCard}>
                          <div className={styles.policyHeader}>
                            <div className={`${styles.matchBadge} ${getScoreClass(policy.matchScore)}`}>
                              <span className={styles.scoreText}>{policy.matchScore}점</span>
                              <span className={styles.scoreLabel}>
                                {policy.matchScore >= 80 ? '매우 적합' : 
                                 policy.matchScore >= 60 ? '적합' : 
                                 policy.matchScore >= 40 ? '검토 가능' : '참고'}
                              </span>
                            </div>
                            <span className={styles.categoryBadge}>{policy.category || '기타'}</span>
                          </div>
                          <h4 className={styles.policyTitle}>{policy.title}</h4>
                          <p className={styles.policySummary}>{policy.summary}</p>
                          
                          <div className={styles.policyMeta}>
                            <span className={styles.metaItem}>🏢 {policy.organization || '기관 미상'}</span>
                            {policy.supportAmount && <span className={styles.metaItem}>💰 {policy.supportAmount}</span>}
                            {policy.applyEnd && <span className={styles.metaItem}>🗓 마감일: {policy.applyEnd}</span>}
                          </div>

                          <div className={styles.reasonsBox}>
                            <p className={styles.reasonsTitle}>🤖 AI 추천 분석</p>
                            <div className={styles.reasonsList} style={{ fontSize: '0.9rem', lineHeight: '1.5', marginTop: '0.5rem', color: 'var(--color-text)' }}>
                              {policy.matchReason}
                            </div>
                          </div>

                          {policy.sourceUrl ? (
                            <a href={policy.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.detailButton}>
                              원문 보기
                            </a>
                          ) : (
                            <Link href={`/policy/${policy.policyId}`} className={styles.detailButton}>
                              자세히 보기
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
