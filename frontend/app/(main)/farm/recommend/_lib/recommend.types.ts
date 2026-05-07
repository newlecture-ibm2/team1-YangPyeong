/* ════════════════════════════════════════════════════════
   AI 추천 도메인 타입 정의
   ════════════════════════════════════════════════════════ */

/** 수급 상태 */
export type SupplyStatus = 'EXCESS_WARN' | 'EXCESS_CAUTION' | 'BALANCED' | 'SHORT_CAUTION' | 'SHORT_WARN';

/** 토양 적합도 */
export type SoilFitness = 'HIGH_SUIT' | 'SUIT' | 'POSSIBLE' | 'LOW_SUIT' | 'NONE';

/** 작물 카테고리 */
export type CropCategory = '채소류' | '과일류' | '곡물' | '특용작물' | '화훼류';

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
  recommendations: CropRecommendation[];
  generatedAt: string;
}

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
