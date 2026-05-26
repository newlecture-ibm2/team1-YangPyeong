'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePolicyRecommend } from '../_lib/usePolicyRecommend';
import { useMyFarms } from '../../farm/useFarm';
import MockupOverlay from '@/components/common/MockupOverlay/MockupOverlay';
import { DUMMY_POLICIES } from '@/lib/preview-data';
import type { RecommendedPolicy } from '../_lib/policy.types';
import styles from './page.module.css';

export default function PolicyRecommendPage() {
  const { data, isLoading: isRecommendLoading, error, statusCode } = usePolicyRecommend();
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isLowRelevanceOpen, setIsLowRelevanceOpen] = useState(false);
  
  const isLoggedIn = typeof document !== 'undefined' && document.cookie.includes('fb-user=');
  const { farms: allFarms, isLoading: isFarmsLoading } = useMyFarms(isLoggedIn);

  const approvedFarms = allFarms.filter(f => f.certificationStatus === 'APPROVED');
  const hasUnapprovedFarms = allFarms.length > approvedFarms.length;
  const isPreviewMode = !isFarmsLoading && !isLoggedIn;
  const isLoading = isRecommendLoading || isFarmsLoading;

  // v2.1: topRecommendations 또는 하위 호환 recommendedPolicies
  const topList = data?.topRecommendations ?? data?.recommendedPolicies ?? [];
  const refList = data?.referencePolicies ?? [];
  const lowList = data?.lowRelevancePolicies ?? [];
  const hasAnyPolicy = topList.length > 0 || refList.length > 0 || lowList.length > 0;

  const getScoreClass = (score: number) => {
    if (score >= 85) return styles.matchBadgeVeryHigh;
    if (score >= 70) return styles.matchBadgeHigh;
    if (score >= 50) return styles.matchBadgeMedium;
    if (score >= 30) return styles.matchBadgeLow;
    return styles.matchBadgeNone;
  };

  const getGradeEmoji = (grade: string) => {
    switch (grade) {
      case 'VERY_SUITABLE': return '🏆';
      case 'SUITABLE': return '✅';
      case 'REFERENCEABLE': return '📋';
      case 'LOW_RELEVANCE': return '💡';
      default: return '📄';
    }
  };

  /** 정책 카드 렌더 (모든 그룹 공용) */
  const renderPolicyCard = (policy: RecommendedPolicy, isCompact?: boolean) => (
    <div key={policy.policyId} className={`${isCompact ? styles.referenceCard : styles.policyCard} ${policy.aiPick ? styles.aiPickCard : ''}`}>
      <div className={styles.policyHeader}>
        <div className={styles.headerLeft}>
          <div className={`${styles.matchBadge} ${getScoreClass(policy.matchScore)}`}>
            <span className={styles.scoreText}>{policy.matchScore}점</span>
            <span className={styles.scoreLabel}>
              {policy.gradeLabel || (
                policy.matchScore >= 85 ? '매우 적합' : 
                policy.matchScore >= 70 ? '적합' : 
                policy.matchScore >= 50 ? '참고 가능' : '관련 낮음'
              )}
            </span>
          </div>
          {policy.aiPick && (
            <span className={styles.aiPickBadge}>🤖 AI 추천</span>
          )}
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

      {/* AI 추천 사유 (aiPick일 때 우선 표시) */}
      {policy.aiPick && policy.aiReason && (
        <div className={styles.aiReasonBox}>
          <p className={styles.aiReasonTitle}>🤖 AI 추천 사유</p>
          <p className={styles.aiReasonText}>{policy.aiReason}</p>
        </div>
      )}

      <div className={styles.reasonsBox}>
        <p className={styles.reasonsTitle}>{getGradeEmoji(policy.grade)} 매칭 분석</p>
        {policy.reasons && policy.reasons.length > 0 ? (
          <ul className={styles.reasonsList}>
            {policy.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        ) : (
          <div className={styles.reasonsList} style={{ fontSize: '0.9rem', lineHeight: '1.5', marginTop: '0.5rem', color: 'var(--color-text)' }}>
            {policy.matchReason}
          </div>
        )}
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
  );

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
            <div className={styles.progressBar}>
              <div className={styles.progressFill} />
            </div>
          </div>
        )}

        {isPreviewMode && !isLoading && (
          <MockupOverlay hasUnapprovedFarms={hasUnapprovedFarms} isGuest={!isLoggedIn} guestCallbackUrl="/policy/recommend">
            <div className={styles.resultContainer}>
              <div className={styles.policyList}>
                {DUMMY_POLICIES.map((policy) => (
                  <div key={policy.id} className={styles.policyCard}>
                    <div className={styles.policyHeader}>
                      <div className={`${styles.matchBadge} ${getScoreClass(95)}`}>
                        <span className={styles.scoreText}>95점</span>
                        <span className={styles.scoreLabel}>매우 적합</span>
                      </div>
                      <span className={styles.categoryBadge}>지원금</span>
                    </div>
                    <h4 className={styles.policyTitle}>{policy.title}</h4>
                    <p className={styles.policySummary}>양평군 거주 농업인을 위한 맞춤형 지원 정책(미리보기)입니다.</p>
                    
                    <div className={styles.policyMeta}>
                      <span className={styles.metaItem}>🏢 양평군청</span>
                      {policy.amount && <span className={styles.metaItem}>💰 {policy.amount}</span>}
                      {policy.deadline && <span className={styles.metaItem}>🗓 마감일: {policy.deadline}</span>}
                    </div>

                    <div className={styles.reasonsBox}>
                      <p className={styles.reasonsTitle}>🏆 AI 추천 분석</p>
                      <ul className={styles.reasonsList}>
                        <li>양평군 지역 조건과 일치</li>
                        <li>등록 작물과 직접 관련</li>
                        <li>농업인 대상 정책</li>
                      </ul>
                    </div>

                    <div className={styles.detailButton}>자세히 보기</div>
                  </div>
                ))}
              </div>
            </div>
          </MockupOverlay>
        )}

        {!isPreviewMode && !isLoading && error && (
          <div className={styles.stateContainer}>
            <span className={styles.icon}>🔒</span>
            <h2 className={styles.stateTitle}>알 수 없는 오류가 발생했습니다</h2>
            <p className={styles.stateMessage}>{error}</p>
            <Link href="/policy" className={styles.actionButton}>정책 목록으로 돌아가기</Link>
          </div>
        )}

        {!isPreviewMode && !isLoading && !error && data && (
          <div className={styles.resultContainer}>
            {data.farmerProfile.farmCount > 0 ? (
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

                {/* 상단 안내 문구 */}
                {hasAnyPolicy && (
                  <div className={styles.guidanceNotice}>
                    <p>
                      회원님의 농장 정보와 정책 조건을 기준으로 관련도가 높은 정책을 먼저 보여드려요.
                      점수가 낮더라도 참고할 수 있는 정책은 접힌 목록에서 확인할 수 있습니다.
                    </p>
                  </div>
                )}

                {/* 작물 미등록 안내 */}
                {data.farmerProfile.crops.length === 0 && (
                  <div className={styles.emptyState}>
                    <span className={styles.icon}>🌾</span>
                    <h3 className={styles.emptyStateTitle}>재배 작물 정보가 부족합니다</h3>
                    <p className={styles.emptyStateDesc}>현재 재배 중인 작물을 등록하면 작물별 지원사업과 보조금 정책을 더 정확히 추천할 수 있습니다.</p>
                    <div className={styles.buttonGroup}>
                      <Link href="/farm/cultivation-register" className={styles.actionButton}>재배 정보 등록하기</Link>
                    </div>
                  </div>
                )}

                {/* 2. 맞춤 추천 정책 (TOP_RECOMMENDATION) */}
                {topList.length === 0 && (
                  <div className={styles.emptyState}>
                    <span className={styles.icon}>📭</span>
                    <h3 className={styles.emptyStateTitle}>현재 조건에 딱 맞는 고득점 추천 정책이 없습니다</h3>
                    <p className={styles.emptyStateDesc}>
                      아래 참고 정책이나 전체 정책 목록에서 지원사업을 확인해보세요.
                    </p>
                    <Link href="/policy" className={styles.actionButton}>전체 정책 보기</Link>
                  </div>
                )}

                {topList.length > 0 && (
                  <>
                    {data.insufficientNotice && (
                      <div className={styles.insufficientNotice}>
                        <span className={styles.insufficientIcon}>💡</span>
                        <p>{data.insufficientNotice}</p>
                        <Link href="/policy" className={styles.insufficientLink}>전체 정책 보기 →</Link>
                      </div>
                    )}
                    {data.farmerProfile.crops.length === 0 && (
                      <div className={styles.fallbackNotice}>
                        <p>💡 재배 작물 정보가 없어 <strong>거주 지역 기반</strong>으로 우선 추천된 정책입니다.</p>
                      </div>
                    )}
                    <h3 className={styles.sectionTitle}>🎯 맞춤 추천 정책 <span className={styles.sectionCount}>{topList.length}건</span></h3>
                    <div className={styles.policyList}>
                      {topList.map((policy) => renderPolicyCard(policy))}
                    </div>
                  </>
                )}

                {/* 3. 참고 가능 정책 아코디언 (REFERENCE_COLLAPSED) */}
                {refList.length > 0 && (
                  <div className={styles.accordionSection}>
                    <button
                      className={styles.accordionToggle}
                      onClick={() => setIsReferenceOpen(!isReferenceOpen)}
                      aria-expanded={isReferenceOpen}
                    >
                      <span className={styles.accordionTitle}>
                        📋 참고 가능한 정책 더 보기 ({refList.length}건)
                      </span>
                      <span className={styles.accordionDesc}>
                        맞춤 추천에 포함되지 못한 관련 정책입니다
                      </span>
                      <span className={`${styles.accordionArrow} ${isReferenceOpen ? styles.accordionArrowOpen : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isReferenceOpen && (
                      <div className={styles.accordionContent}>
                        <div className={styles.policyList}>
                          {refList.map((policy) => renderPolicyCard(policy, true))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. 관련 낮음 정책 아코디언 (LOW_RELEVANCE_COLLAPSED) */}
                {lowList.length > 0 && (
                  <div className={styles.accordionSection}>
                    <button
                      className={`${styles.accordionToggle} ${styles.accordionToggleLow}`}
                      onClick={() => setIsLowRelevanceOpen(!isLowRelevanceOpen)}
                      aria-expanded={isLowRelevanceOpen}
                    >
                      <span className={styles.accordionTitle}>
                        💡 관련은 낮지만 확인해볼 수 있는 정책 ({lowList.length}건)
                      </span>
                      <span className={styles.accordionDesc}>
                        조건이 일부만 맞는 정책입니다
                      </span>
                      <span className={`${styles.accordionArrow} ${isLowRelevanceOpen ? styles.accordionArrowOpen : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isLowRelevanceOpen && (
                      <div className={styles.accordionContent}>
                        <div className={styles.policyList}>
                          {lowList.map((policy) => renderPolicyCard(policy, true))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.stateContainer}>
                <span className={styles.icon}>🌱</span>
                <h2 className={styles.stateTitle}>등록된 농장이 없습니다</h2>
                <p className={styles.stateMessage}>농장을 먼저 등록하면 맞춤 정책을 추천받을 수 있습니다.</p>
                <Link href="/farm/register" className={styles.actionButton}>농장 등록하기</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
