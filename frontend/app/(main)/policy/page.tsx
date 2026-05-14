'use client';

import { usePolicyList } from './_lib/usePolicyList';
import {
  POLICY_CATEGORY_OPTIONS,
  POLICY_PERIOD_OPTIONS,
  POLICY_REGION_OPTIONS,
} from './_lib/policy.types';
import type { PolicyItem } from './_lib/policy.types';

import FilterBar from '@/components/common/FilterBar/FilterBar';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import SearchInput from '@/components/common/SearchInput/SearchInput';
import Badge from '@/components/common/Badge/Badge';
import Link from 'next/link';

import styles from './page.module.css';

/**
 * 정책 목록 페이지
 * GET /api/policies 조회 결과를 카드형 리스트로 렌더링합니다.
 * - 하드코딩 카드 없음 — DB 연동
 * - 빈 상태 / 로딩 / 에러 상태 처리
 * - 상세보기: sourceUrl 새 창 이동, sourceUrl 없으면 비활성화
 */
export default function PolicyListPage() {
  const {
    policies,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    goToPage,
  } = usePolicyList();

  return (
    <div className="page">
      {/* 페이지 헤더 */}
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <a href="/">홈</a> › <strong>정책 목록</strong>
        </div>
        <h1 className={styles.pageTitle}>📜 정책 목록</h1>
        <p className={styles.pageSub}>
          농업 지원 정책을 확인하고 지원 조건을 살펴보세요.
        </p>
      </div>

      {/* 필터 영역 */}
      <div className={styles.filterSection} data-guide="policy-filter">
        <FilterBar
          dropdowns={[
            <Dropdown
              key="region"
              options={POLICY_REGION_OPTIONS}
              value={searchParams.regionCode || ''}
              onChange={(v) => setSearchParams({ regionCode: v })}
              placeholder="지역: 전체"
              size="sm"
            />,
            <Dropdown
              key="category"
              options={POLICY_CATEGORY_OPTIONS}
              value={searchParams.category || ''}
              onChange={(v) => setSearchParams({ category: v })}
              placeholder="분야: 전체"
              size="sm"
            />,
            <Dropdown
              key="period"
              options={POLICY_PERIOD_OPTIONS}
              value={searchParams.period || ''}
              onChange={(v) => setSearchParams({ period: v })}
              placeholder="기간: 전체"
              size="sm"
            />,
          ]}
          search={
            <SearchInput
              placeholder="정책명, 기관, 내용 검색..."
              value={searchParams.keyword || ''}
              onChange={(e) =>
                setSearchParams({ keyword: e.target.value })
              }
              onSearch={(v) => setSearchParams({ keyword: v })}
              size="sm"
            />
          }
        />
      </div>

      {/* 맞춤 정책 추천 진입 배너 */}
      <div className={styles.recommendBanner}>
        <div className={styles.bannerContent}>
          <span className={styles.bannerIcon}>✨</span>
          <div className={styles.bannerText}>
            <h3 className={styles.bannerTitle}>나에게 맞는 정책 추천</h3>
            <p className={styles.bannerDesc}>
              등록된 농장, 재배 작물, 지역 정보를 바탕으로 신청 가능성이 높은 정책을 AI가 찾아드려요.
              <span className={styles.bannerSubText}> (농장 정보가 많을수록 추천 정확도가 높아집니다)</span>
            </p>
          </div>
        </div>
        <Link href="/policy/recommend" className={styles.bannerButton}>
          맞춤 정책 보러가기
        </Link>
      </div>

      {/* 결과 요약 */}
      {!isLoading && !error && (
        <div className={styles.resultSummary}>
          <span className={styles.resultCount}>
            총 <strong>{totalCount}</strong>건의 정책
          </span>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && <LoadingSkeleton />}

      {/* 에러 상태 */}
      {!isLoading && error && (
        <div className={styles.stateContainer}>
          <span className={styles.stateIcon}>⚠️</span>
          <p className={styles.stateTitle}>정책 정보를 불러올 수 없습니다</p>
          <p className={styles.stateMessage}>{error}</p>
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && policies.length === 0 && (
        <div className={styles.stateContainer}>
          <span className={styles.stateIcon}>📭</span>
          <p className={styles.stateTitle}>검색 결과가 없습니다</p>
          <p className={styles.stateMessage}>
            필터 조건을 변경하거나 다른 검색어를 입력해보세요.
          </p>
        </div>
      )}

      {/* 정책 카드 리스트 */}
      {!isLoading && !error && policies.length > 0 && (
        <>
          <div className={styles.policyList} data-guide="policy-list">
            {policies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── 정책 뱃지 정보 생성 함수 ──
function getPolicyBadges(policy: PolicyItem): { regionBadge: string; categoryBadge: string } {
  let regionBadge = '전국';

  // 1. 지역명이 있으면 우선 표시 (예: "양평군", "경기도")
  if (policy.regionName && policy.regionName.trim() !== '') {
    regionBadge = policy.regionName;
  } else {
    // 2. 지역 코드가 전국을 의미하면 표시
    const rc = policy.regionCode?.toUpperCase();
    if (rc === 'ALL' || rc === 'NATIONAL' || rc === '0000') {
      regionBadge = '전국';
    } else {
      // 3. 대상이나 요약 내용에 '전국' 키워드가 있는지 확인
      const text = `${policy.target ?? ''} ${policy.contentSummary ?? ''}`;
      if (text.includes('전국')) {
        regionBadge = '전국';
      }
    }
  }

  // 카테고리 뱃지는 실제 값을 그대로 사용 (없으면 '기타')
  const categoryBadge = policy.category?.trim() || '기타';

  return { regionBadge, categoryBadge };
}

// ── 정책 카드 컴포넌트 ──

function PolicyCard({ policy }: { policy: PolicyItem }) {
  const isExpired = policy.applyEnd
    ? new Date(policy.applyEnd) < new Date()
    : false;

  const formattedDate = policy.applyEnd
    ? new Date(policy.applyEnd).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '상시';

  const hasSourceUrl = !!policy.sourceUrl;

  const handleDetailClick = () => {
    if (hasSourceUrl && policy.sourceUrl) {
      window.open(policy.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const { regionBadge, categoryBadge } = getPolicyBadges(policy);

  return (
    <div
      className={`${styles.policyCard} ${hasSourceUrl ? '' : styles.policyCardNoLink}`}
      onClick={hasSourceUrl ? handleDetailClick : undefined}
      role={hasSourceUrl ? 'button' : undefined}
      tabIndex={hasSourceUrl ? 0 : undefined}
      onKeyDown={
        hasSourceUrl
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDetailClick();
              }
            }
          : undefined
      }
      id={`policy-card-${policy.id}`}
    >
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.categoryTag}>{regionBadge}</span>
          <span className={styles.categoryTag}>{categoryBadge}</span>
          <span className={styles.cardTitle}>{policy.title}</span>
        </div>
        {policy.supportAmount && (
          <Badge variant="green" className={styles.supportBadge}>
            {policy.supportAmount}
          </Badge>
        )}
      </div>

      <div className={styles.cardMeta}>
        {policy.organization && policy.organization.trim() !== '-' && (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>지원기관:</span>{' '}
            {policy.organization}
          </span>
        )}
        {policy.regionName && (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>지역:</span>{' '}
            {policy.regionName}
          </span>
        )}
        {policy.target && (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>대상:</span> {policy.target}
          </span>
        )}
      </div>

      {policy.contentSummary && (
        <div className={styles.cardContent}>{policy.contentSummary}</div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.applyDeadline}>
          신청기한:{' '}
          <span
            className={`${styles.deadlineDate} ${
              isExpired ? styles.deadlineExpired : styles.deadlineActive
            }`}
          >
            {formattedDate}
            {isExpired && ' (마감)'}
          </span>
        </span>
        {hasSourceUrl ? (
          <span className={styles.detailLink}>상세보기 →</span>
        ) : (
          <span className={styles.detailLinkDisabled}>상세보기 →</span>
        )}
      </div>
    </div>
  );
}

// ── 로딩 스켈레톤 ──

function LoadingSkeleton() {
  return (
    <div className={styles.policyList}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ))}
    </div>
  );
}

// ── 페이지네이션 ──

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const maxVisible = 5;
  let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible);
  if (endPage - startPage < maxVisible) {
    startPage = Math.max(0, endPage - maxVisible);
  }

  const pages = Array.from(
    { length: endPage - startPage },
    (_, i) => startPage + i
  );

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageButton}
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="이전 페이지"
      >
        ‹
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={`${styles.pageButton} ${
            page === currentPage ? styles.pageButtonActive : ''
          }`}
          onClick={() => onPageChange(page)}
          aria-label={`${page + 1} 페이지`}
        >
          {page + 1}
        </button>
      ))}
      <button
        className={styles.pageButton}
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  );
}
