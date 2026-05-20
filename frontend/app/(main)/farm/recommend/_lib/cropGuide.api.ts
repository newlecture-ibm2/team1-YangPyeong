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
  experience_level: GrowerExperience;
  sowing_period?: string;
  harvest_period?: string;
  optimal_temp?: string;
  growth_days?: number;
  difficulty?: number;
  pests?: string[];
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

export async function getCachedCropDetailedGuide(
  farmId: number,
  cropId: number,
  experienceLevel: GrowerExperience,
): Promise<CropDetailedGuideDto | null> {
  const params = new URLSearchParams({ experienceLevel });
  const res = await fetch(
    `/api/recommend/farms/${farmId}/crops/${cropId}/detailed-guide?${params}`,
    { cache: 'no-store' },
  );
  const json = (await res.json()) as ApiResponse<CropDetailedGuideDto | null>;
  if (!res.ok || !json.success) {
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
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message ?? '재배 가이드 생성에 실패했습니다.');
  }
  return json.data;
}
