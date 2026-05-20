import { ApiResponse } from '@/lib/constants';
import type { CropRecommendation, CropRecommendResponse } from './recommend.types';
import { resolveGrowerExperience, type GrowerExperience } from './cropGuideBuilders';

export interface CropGuideTopicDto {
  icon: string;
  title: string;
  content: string[];
}

export interface CropDetailedGuideDto {
  crop_name: string;
  crop_id?: number;
  experience_level?: string;
  topics: CropGuideTopicDto[];
  source?: 'cache' | 'ai' | 'local';
  generated_at?: string;
}

export interface GenerateCropGuideRequest {
  crop_name: string;
  crop_category: string;
  advice_type?: string;
  recommend_mode?: string;
  experience_level: GrowerExperience;
  sowing_period?: string;
  harvest_period?: string;
  optimal_temp?: string;
  growth_days?: number;
  difficulty?: number;
  pests?: string[];
}

export class CropGuideApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'CropGuideApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export function buildCropGuideGenerateRequest(
  rec: CropRecommendation,
  recommendResult: CropRecommendResponse | null | undefined,
  experienceLevel: GrowerExperience,
): GenerateCropGuideRequest {
  return {
    crop_name: rec.cropName,
    crop_category: rec.category,
    advice_type: rec.adviceType,
    recommend_mode: recommendResult?.recommendMode,
    experience_level: experienceLevel,
    sowing_period: rec.sowingPeriod,
    harvest_period: rec.harvestPeriod,
    optimal_temp: rec.optimalTemp,
    growth_days: rec.growthDays,
    difficulty: rec.difficulty,
    pests: rec.pests ?? [],
  };
}

export function resolveExperienceForGuide(
  rec: CropRecommendation,
  recommendResult?: CropRecommendResponse | null,
): GrowerExperience {
  return resolveGrowerExperience(rec, recommendResult);
}

function buildGuideQuery(
  rec: CropRecommendation,
  recommendResult: CropRecommendResponse | null | undefined,
  experienceLevel: GrowerExperience,
): string {
  const params = new URLSearchParams({ experienceLevel });
  if (rec.adviceType) params.set('adviceType', rec.adviceType);
  if (recommendResult?.recommendMode) params.set('recommendMode', recommendResult.recommendMode);
  return params.toString();
}

export async function getCachedCropDetailedGuide(
  farmId: number,
  cropId: number,
  rec: CropRecommendation,
  recommendResult: CropRecommendResponse | null | undefined,
  experienceLevel: GrowerExperience,
): Promise<CropDetailedGuideDto | null> {
  const query = buildGuideQuery(rec, recommendResult, experienceLevel);
  const res = await fetch(
    `/api/recommend/farms/${farmId}/crops/${cropId}/detailed-guide?${query}`,
    { cache: 'no-store' },
  );
  const json = (await res.json()) as ApiResponse<CropDetailedGuideDto | null>;

  if (res.status === 401) {
    throw new CropGuideApiError(json.error?.message ?? '로그인이 필요합니다.', 401, json.error?.code);
  }
  if (!res.ok) {
    throw new CropGuideApiError(
      json.error?.message ?? '재배 가이드 조회에 실패했습니다.',
      res.status,
      json.error?.code,
    );
  }
  if (!json.success) {
    return null;
  }
  return json.data ?? null;
}

export async function generateCropDetailedGuide(
  farmId: number,
  cropId: number,
  body: GenerateCropGuideRequest,
): Promise<CropDetailedGuideDto> {
  const res = await fetch(`/api/recommend/farms/${farmId}/crops/${cropId}/detailed-guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<CropDetailedGuideDto>;

  if (res.status === 401) {
    throw new CropGuideApiError(json.error?.message ?? '로그인이 필요합니다.', 401, json.error?.code);
  }
  if (!res.ok || !json.success || !json.data) {
    throw new CropGuideApiError(
      json.error?.message ?? '재배 가이드 생성에 실패했습니다.',
      res.status,
      json.error?.code,
    );
  }
  return json.data;
}
