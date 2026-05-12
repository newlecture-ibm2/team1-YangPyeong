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
  { value: '귀농귀촌', label: '귀농귀촌' },
  { value: '농기계', label: '농기계' },
  { value: '축산', label: '축산' },
  { value: '금융지원', label: '금융지원' },
  { value: '판로지원', label: '판로지원' },
  { value: '교육', label: '교육' },
  { value: '기타', label: '기타' },
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
  { value: '4183', label: '양평군' },
  { value: '41', label: '경기도' },
];

/** 농업인 프로필 요약 (추천용) */
export interface FarmerProfileSummary {
  name: string;
  regionName: string | null;
  farmCount: number;
  totalArea: number;
  crops: string[];
}

/** 추천된 정책 항목 */
export interface RecommendedPolicy {
  policyId: number;
  title: string;
  category: string;
  supportAmount: string | null;
  organization: string | null;
  applyEnd: string | null;
  sourceUrl: string | null;
  matchScore: number;
  matchReason: string;
  summary: string;
}

/** 맞춤 정책 추천 API 응답 */
export interface PolicyRecommendResponse {
  farmerProfile: FarmerProfileSummary;
  recommendedPolicies: RecommendedPolicy[];
}
