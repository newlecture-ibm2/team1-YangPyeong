/**
 * 정책 도메인 타입 정의
 */

/** 정책 목록 항목 */
export interface PolicyItem {
  id: number;
  title: string;
  organization: string;
  regionCode: string | null;
  regionName: string | null;
  category: string | null;
  target: string | null;
  contentSummary: string | null;
  supportAmount: string | null;
  applyEnd: string | null; // ISO date string (yyyy-MM-dd)
  source: string | null;
  sourceUrl: string | null;
}

/** 정책 검색 파라미터 */
export interface PolicySearchParams {
  keyword?: string;
  regionCode?: string;
  category?: string;
  period?: string;
  page?: number;
  size?: number;
}

/** 페이징 응답 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
}

/** 정책 카테고리 옵션 */
export const POLICY_CATEGORY_OPTIONS = [
  { value: '', label: '분야: 전체' },
  { value: '청년농', label: '청년농' },
  { value: '친환경', label: '친환경' },
  { value: '스마트팜', label: '스마트팜' },
  { value: '귀농귀촌', label: '귀농귀촌' },
  { value: '농기계', label: '농기계' },
  { value: '재해보험', label: '재해보험' },
  { value: '시설하우스', label: '시설하우스' },
  { value: '로컬푸드', label: '로컬푸드' },
  { value: '종자', label: '종자' },
  { value: '농업교육', label: '농업교육' },
  { value: '에너지', label: '에너지' },
  { value: '복지', label: '복지' },
  { value: '가공창업', label: '가공창업' },
  { value: '축산', label: '축산' },
  { value: '안전', label: '안전' },
];

/** 기간 필터 옵션 */
export const POLICY_PERIOD_OPTIONS = [
  { value: '', label: '기간: 전체' },
  { value: 'active', label: '신청 가능' },
  { value: 'closed', label: '마감' },
];

/**
 * 지역 필터 옵션 (더미).
 * TODO: 추후 regions 마스터 API (GET /api/regions)에서 동적 로딩으로 교체 예정.
 *       현재는 양평군 중심의 최소 옵션만 제공합니다.
 */
export const POLICY_REGION_OPTIONS = [
  { value: '', label: '지역: 전체' },
  { value: '0000', label: '전국' },
  { value: '4183', label: '양평군' },
  { value: '41', label: '경기도' },
];
