/* ════════════════════════════════════════════════════════
   AI 추천 도메인 타입 정의
   ════════════════════════════════════════════════════════ */

/** 수급 상태 */
export type SupplyStatus = 'EXCESS_WARN' | 'EXCESS_CAUTION' | 'BALANCED' | 'SHORT_CAUTION' | 'SHORT_WARN';

/** 토양 적합도 */
export type SoilFitness = 'HIGH_SUIT' | 'SUIT' | 'POSSIBLE' | 'LOW_SUIT' | 'NONE';

/** 작물 카테고리 */
export type CropCategory = '채소류' | '과일류' | '곡물' | '특용작물' | '화훼류';

/** 재배 캘린더 월별 단계 */
export interface CalendarPhase {
  label: string;
  startMonth: number;
  endMonth: number;
  color: string;
}

export type RecommendMode = 'PLAN' | 'PLANNED' | 'MANAGE' | 'MIXED';

export type AdviceType =
  | 'NEW_RECOMMEND'
  | 'PLANNED_CROP'
  | 'IN_SEASON_COACHING'
  | 'NEXT_SEASON';

/** AI 코칭 요청 가능 상태 (백엔드 AiCoachingEligibility.Status) */
export type AiCoachingStatus =
  | 'ELIGIBLE'
  | 'NEEDS_DATA'
  | 'COMPLETED_IDLE'
  | 'HAS_AI'
  | 'OPTIONAL'
  | 'NOT_APPLICABLE';

/** 개별 추천 작물 */
export interface CropRecommendation {
  rank: number;
  cropId: number;
  cropName: string;
  category: CropCategory;
  score: number;
  soilFitness: SoilFitness;
  soilFitnessPercent: number;
  priceForecastPercent: number;
  supplyStabilityPercent: number;
  supplyStatus: SupplyStatus;
  expectedRevenuePerKg: number;
  expectedYield?: number;
  aiReason?: string;
  growthDays?: number;
  optimalTemp?: string;
  sowingPeriod?: string;
  harvestPeriod?: string;
  difficulty?: number;
  pests?: string[];
  adviceType?: AdviceType;
  mismatchNote?: string;
  registrationId?: number;
  aiCoachingStatus?: AiCoachingStatus;
  aiCoachingHint?: string;
}

/** 추천 API 응답 */
export interface CropRecommendResponse {
  farmInfo: {
    id: number;
    name: string;
    address: string;
    area: number;
    soilPh?: number;
    organicMatter?: number;
    soilType?: string;
  };
  recommendMode?: RecommendMode;
  currentCropAdvices?: CropRecommendation[];
  recommendations: CropRecommendation[];
  generatedAt: string;
}

export const RECOMMEND_MODE_LABEL: Record<RecommendMode, string> = {
  PLAN: '신규 재배 추천',
  PLANNED: '재배 예정 작물 가이드',
  MANAGE: '현재 재배 관리',
  MIXED: '재배 관리 + 참고 추천',
};

export const ADVICE_TYPE_LABEL: Record<AdviceType, string> = {
  NEW_RECOMMEND: '신규 추천',
  PLANNED_CROP: '재배 예정',
  IN_SEASON_COACHING: '재배 중',
  NEXT_SEASON: '다음 시즌 참고',
};

export const AI_COACHING_STATUS_LABEL: Partial<Record<AiCoachingStatus, string>> = {
  ELIGIBLE: 'AI 코칭 받기',
  COMPLETED_IDLE: 'AI 코칭 받기',
  OPTIONAL: 'AI 코칭 받기',
};

/** 수급 상태 라벨 매핑 */
export const SUPPLY_STATUS_MAP: Record<SupplyStatus, { label: string; variant: 'green' | 'orange' | 'red' }> = {
  EXCESS_WARN:    { label: '과잉',   variant: 'red' },
  EXCESS_CAUTION: { label: '과잉주의', variant: 'orange' },
  BALANCED:       { label: '안정',   variant: 'green' },
  SHORT_CAUTION:  { label: '부족주의', variant: 'orange' },
  SHORT_WARN:     { label: '부족',   variant: 'red' },
};

/** 토양 적합도 라벨 매핑 */
export const SOIL_FITNESS_MAP: Record<SoilFitness, string> = {
  HIGH_SUIT: '최적지',
  SUIT:      '적지',
  POSSIBLE:  '가능지',
  LOW_SUIT:  '저위생산지',
  NONE:      '부적합',
};
