/**
 * 재배 가이드 카드용 fallback — API/이력에 growthDays·pests가 비었을 때 표시 보완
 */

import type { CropRecommendation } from './recommend.types';

function norm(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

const DEFAULT_PERIODS: { match: (n: string) => boolean; sowing: string; harvest: string }[] = [
  { match: (n) => n.includes('쌀') || n.includes('벼'), sowing: '4월순 ~ 5월순', harvest: '9월순 ~ 10월중순' },
  { match: (n) => n.includes('보리'), sowing: '10월순 ~ 10월순', harvest: '5월순 ~ 6월중순' },
  { match: (n) => n.includes('콩'), sowing: '6월중순 ~ 7월순', harvest: '9월순 ~ 10월중순' },
  { match: (n) => n.includes('감자'), sowing: '3월순 ~ 4월순', harvest: '6월중순 ~ 7월순' },
  { match: (n) => n.includes('고구마'), sowing: '4월순 ~ 5월중순', harvest: '9월순 ~ 10월중순' },
  { match: (n) => n.includes('방울'), sowing: '3월 ~ 4월(정식)', harvest: '5월 ~ 11월' },
  { match: (n) => n.includes('토마토'), sowing: '3월 ~ 4월(정식)', harvest: '5월 ~ 9월' },
  { match: (n) => n.includes('고추') || n.includes('피망'), sowing: '2월(정식) ~ 5월(정식)', harvest: '7월 ~ 10월' },
  { match: (n) => n.includes('배추') || n.includes('양배추'), sowing: '3월 ~ 5월', harvest: '7월 ~ 8월' },
  { match: (n) => n.includes('인삼'), sowing: '8월 ~ 9월(정식)', harvest: '12월 ~ 5월' },
];

const DEFAULT_GROWTH_DAYS: { match: (n: string) => boolean; days: number }[] = [
  { match: (n) => n.includes('쌀') || n.includes('벼'), days: 150 },
  { match: (n) => n.includes('보리'), days: 240 },
  { match: (n) => n.includes('콩'), days: 75 },
  { match: (n) => n.includes('감자'), days: 90 },
  { match: (n) => n.includes('고구마'), days: 120 },
  { match: (n) => n.includes('토마토') || n.includes('방울'), days: 90 },
  { match: (n) => n.includes('고추') || n.includes('피망'), days: 150 },
  { match: (n) => n.includes('배추') || n.includes('양배추'), days: 70 },
  { match: (n) => n.includes('사과') || n.includes('배') || n.includes('포도'), days: 180 },
  { match: (n) => n.includes('인삼'), days: 240 },
];

const DEFAULT_PESTS: { match: (n: string) => boolean; pests: string[] }[] = [
  { match: (n) => n.includes('쌀') || n.includes('벼'), pests: ['잎집무늬마름병', '멸구류'] },
  { match: (n) => n.includes('보리'), pests: ['줄무늬병', '붉은곰팡이병'] },
  { match: (n) => n.includes('콩'), pests: ['붉은병', '가루깍지벌레'] },
  { match: (n) => n.includes('감자'), pests: ['역병', '가루뿌리병'] },
  { match: (n) => n.includes('고구마'), pests: ['검은무늬병', '뿌리썩음병'] },
  { match: (n) => n.includes('토마토') || n.includes('방울'), pests: ['곰팡이병', '진딧물'] },
  { match: (n) => n.includes('고추'), pests: ['탄저병', '역병', '진딧물'] },
  { match: (n) => n.includes('배추') || n.includes('무'), pests: ['무름병', '배추좀나방'] },
  { match: (n) => n.includes('사과'), pests: ['검은별무늬병', '진딧물'] },
  { match: (n) => n.includes('인삼'), pests: ['가루깍지벌레', '진딧물'] },
];

function fallbackGrowthDays(cropName: string): number | undefined {
  const n = norm(cropName);
  for (const row of DEFAULT_GROWTH_DAYS) {
    if (row.match(n)) return row.days;
  }
  return undefined;
}

function fallbackPeriods(cropName: string): { sowing?: string; harvest?: string } {
  const n = norm(cropName);
  for (const row of DEFAULT_PERIODS) {
    if (row.match(n)) return { sowing: row.sowing, harvest: row.harvest };
  }
  return {};
}

function fallbackPests(cropName: string): string[] {
  const n = norm(cropName);
  for (const row of DEFAULT_PESTS) {
    if (row.match(n)) return [...row.pests];
  }
  return [];
}

/** 카드·헤더 표시용 — 비어 있는 필드만 보완 (기존 API 값 우선) */
export function enrichCropGuideCardFields(rec: CropRecommendation): CropRecommendation {
  const growthDays = rec.growthDays ?? fallbackGrowthDays(rec.cropName);
  const pests =
    rec.pests && rec.pests.length > 0 ? rec.pests : fallbackPests(rec.cropName);
  const periods = fallbackPeriods(rec.cropName);
  const sowingPeriod = rec.sowingPeriod?.trim() || periods.sowing;
  const harvestPeriod = rec.harvestPeriod?.trim() || periods.harvest;

  if (
    growthDays === rec.growthDays &&
    pests === rec.pests &&
    sowingPeriod === rec.sowingPeriod &&
    harvestPeriod === rec.harvestPeriod
  ) {
    return rec;
  }

  return {
    ...rec,
    ...(growthDays != null ? { growthDays } : {}),
    ...(pests.length > 0 ? { pests } : {}),
    ...(sowingPeriod ? { sowingPeriod } : {}),
    ...(harvestPeriod ? { harvestPeriod } : {}),
  };
}
