/**
 * 작물별 파종·수확 월 — crop_cultivation_env 시드(V2) 및 품종 alias 기준.
 * 캘린더·세부계획서·fallback의 단일 출처.
 */

import { normCropName } from './cropPeriodFallback';

export type CropPlanKind =
  | 'rice'
  | 'barley'
  | 'pepper'
  | 'cherry_tomato'
  | 'tomato'
  | 'potato'
  | 'sweet_potato'
  | 'soybean'
  | 'cabbage'
  | 'ginseng'
  | 'leafy'
  | 'fruit'
  | 'onion'
  | 'garlic'
  | 'radish'
  | 'melon'
  | 'corn'
  | 'generic';

export interface MonthRange {
  start: number;
  end: number;
}

export interface CropPeriodEntry {
  /** normCropName에 includes 로 매칭 (긴 패턴을 앞에 배치) */
  match: (n: string) => boolean;
  sow: MonthRange;
  harvest: MonthRange;
  /** 파종 종료월 > 수확 종료월 (보리·마늘·인삼 등) */
  winterCycle?: boolean;
  planKind: CropPlanKind;
  sowingLabel?: string;
  harvestLabel?: string;
  growthDays?: number;
}

/** V2 crop_cultivation_env + 주요 품종 alias */
const CROP_PERIOD_ENTRIES: CropPeriodEntry[] = [
  { match: (n) => n.includes('방울토마토') || (n.includes('방울') && n.includes('토마토')), sow: { start: 3, end: 4 }, harvest: { start: 5, end: 11 }, planKind: 'cherry_tomato', sowingLabel: '3월 ~ 4월(정식)', harvestLabel: '5월 ~ 11월' },
  { match: (n) => n.includes('청양고추') || n.includes('홍고추') || n.includes('풋고추'), sow: { start: 2, end: 4 }, harvest: { start: 7, end: 10 }, planKind: 'pepper', sowingLabel: '2월(육묘) ~ 4월(정식)', harvestLabel: '7월 ~ 10월' },
  { match: (n) => n.includes('유기농배추') || n.includes('봄배추') || n.includes('가을배추'), sow: { start: 8, end: 9 }, harvest: { start: 10, end: 11 }, planKind: 'cabbage', sowingLabel: '8월중순 ~ 9월순', harvestLabel: '10월순 ~ 11월중순' },
  { match: (n) => n.includes('쌀') || n.includes('벼'), sow: { start: 4, end: 5 }, harvest: { start: 9, end: 10 }, planKind: 'rice', growthDays: 150 },
  { match: (n) => n.includes('보리'), sow: { start: 10, end: 10 }, harvest: { start: 5, end: 6 }, winterCycle: true, planKind: 'barley', growthDays: 240 },
  { match: (n) => n.includes('밀'), sow: { start: 10, end: 11 }, harvest: { start: 6, end: 6 }, winterCycle: true, planKind: 'barley', growthDays: 240 },
  { match: (n) => n.includes('수수'), sow: { start: 4, end: 5 }, harvest: { start: 7, end: 8 }, planKind: 'corn', growthDays: 90 },
  { match: (n) => n.includes('조'), sow: { start: 5, end: 6 }, harvest: { start: 9, end: 10 }, planKind: 'corn', growthDays: 120 },
  { match: (n) => n.includes('메밀'), sow: { start: 5, end: 5 }, harvest: { start: 9, end: 9 }, planKind: 'generic', growthDays: 120 },
  { match: (n) => n.includes('옥수수'), sow: { start: 5, end: 6 }, harvest: { start: 10, end: 10 }, planKind: 'corn', growthDays: 130 },
  { match: (n) => n.includes('팥'), sow: { start: 6, end: 6 }, harvest: { start: 10, end: 10 }, planKind: 'soybean', growthDays: 120 },
  { match: (n) => n.includes('들깨'), sow: { start: 5, end: 6 }, harvest: { start: 9, end: 10 }, planKind: 'generic', growthDays: 100 },
  { match: (n) => n.includes('참깨'), sow: { start: 5, end: 6 }, harvest: { start: 8, end: 9 }, planKind: 'generic', growthDays: 90 },
  { match: (n) => n.includes('콩') || n.includes('대두') || n.includes('강낭콩'), sow: { start: 6, end: 7 }, harvest: { start: 9, end: 10 }, planKind: 'soybean', growthDays: 75 },
  { match: (n) => n.includes('감자'), sow: { start: 3, end: 4 }, harvest: { start: 6, end: 7 }, planKind: 'potato', growthDays: 90 },
  { match: (n) => n.includes('고구마'), sow: { start: 4, end: 5 }, harvest: { start: 9, end: 10 }, planKind: 'sweet_potato', growthDays: 120 },
  { match: (n) => n.includes('참마'), sow: { start: 2, end: 3 }, harvest: { start: 6, end: 10 }, planKind: 'generic', growthDays: 120 },
  { match: (n) => n.includes('고추') || n.includes('피망') || n.includes('파프리카'), sow: { start: 2, end: 5 }, harvest: { start: 7, end: 10 }, planKind: 'pepper', growthDays: 150 },
  { match: (n) => n.includes('토마토'), sow: { start: 3, end: 4 }, harvest: { start: 5, end: 9 }, planKind: 'tomato', growthDays: 90 },
  { match: (n) => n.includes('수박'), sow: { start: 3, end: 5 }, harvest: { start: 7, end: 8 }, planKind: 'melon', growthDays: 90 },
  { match: (n) => n.includes('참외') || n.includes('멜론'), sow: { start: 2, end: 3 }, harvest: { start: 5, end: 8 }, planKind: 'melon', growthDays: 80 },
  { match: (n) => n.includes('호박') || n.includes('애호박') || n.includes('단호박'), sow: { start: 4, end: 5 }, harvest: { start: 7, end: 10 }, planKind: 'generic', growthDays: 90 },
  { match: (n) => n.includes('인삼'), sow: { start: 8, end: 9 }, harvest: { start: 12, end: 5 }, winterCycle: true, planKind: 'ginseng', growthDays: 240 },
  { match: (n) => n.includes('양배추'), sow: { start: 7, end: 8 }, harvest: { start: 11, end: 12 }, planKind: 'cabbage', growthDays: 90 },
  { match: (n) => n.includes('배추'), sow: { start: 8, end: 9 }, harvest: { start: 10, end: 11 }, planKind: 'cabbage', growthDays: 70 },
  { match: (n) => n.includes('브로콜리'), sow: { start: 7, end: 7 }, harvest: { start: 10, end: 11 }, planKind: 'cabbage', growthDays: 100 },
  { match: (n) => n.includes('상추') || n.includes('양상추') || n.includes('청경채') || n.includes('시금치'), sow: { start: 3, end: 5 }, harvest: { start: 5, end: 10 }, planKind: 'leafy', growthDays: 45, sowingLabel: '3월 ~ 5월', harvestLabel: '5월 ~ 10월(연속 수확)' },
  { match: (n) => n.includes('셀러리'), sow: { start: 3, end: 4 }, harvest: { start: 6, end: 9 }, planKind: 'leafy', growthDays: 40, sowingLabel: '3월 ~ 4월', harvestLabel: '6월 ~ 9월' },
  { match: (n) => n.includes('총각무') || n === '무', sow: { start: 8, end: 9 }, harvest: { start: 10, end: 11 }, planKind: 'radish', growthDays: 60 },
  { match: (n) => n.includes('대파') || n.includes('쪽파') || (n.includes('파') && !n.includes('파프리카')), sow: { start: 9, end: 11 }, harvest: { start: 5, end: 6 }, winterCycle: true, planKind: 'generic', growthDays: 240 },
  { match: (n) => n.includes('마늘'), sow: { start: 9, end: 10 }, harvest: { start: 5, end: 6 }, winterCycle: true, planKind: 'garlic', growthDays: 240 },
  { match: (n) => n.includes('양파'), sow: { start: 3, end: 4 }, harvest: { start: 10, end: 12 }, planKind: 'onion', growthDays: 120 },
  { match: (n) => n.includes('생강'), sow: { start: 4, end: 5 }, harvest: { start: 10, end: 11 }, planKind: 'generic', growthDays: 180 },
  { match: (n) => n.includes('블루베리'), sow: { start: 3, end: 3 }, harvest: { start: 6, end: 8 }, planKind: 'fruit', growthDays: 120 },
  { match: (n) => n.includes('복숭아'), sow: { start: 3, end: 3 }, harvest: { start: 7, end: 9 }, planKind: 'fruit', growthDays: 150 },
  { match: (n) => n.includes('자두'), sow: { start: 3, end: 3 }, harvest: { start: 8, end: 10 }, planKind: 'fruit', growthDays: 180 },
  { match: (n) => n.includes('포도'), sow: { start: 3, end: 3 }, harvest: { start: 9, end: 10 }, planKind: 'fruit', growthDays: 180 },
  { match: (n) => n.includes('사과'), sow: { start: 3, end: 3 }, harvest: { start: 9, end: 11 }, planKind: 'fruit', growthDays: 180 },
  { match: (n) => n.includes('배') && !n.includes('배추'), sow: { start: 3, end: 4 }, harvest: { start: 10, end: 11 }, planKind: 'fruit', growthDays: 180 },
  { match: (n) => n.includes('감귤') || n.includes('귤'), sow: { start: 3, end: 3 }, harvest: { start: 10, end: 12 }, planKind: 'fruit', growthDays: 270 },
  { match: (n) => n.includes('감') && !n.includes('감자') && !n.includes('감귤'), sow: { start: 3, end: 3 }, harvest: { start: 10, end: 11 }, planKind: 'fruit', growthDays: 180 },
  { match: (n) => n.includes('가지'), sow: { start: 4, end: 5 }, harvest: { start: 7, end: 10 }, planKind: 'pepper', growthDays: 120 },
  { match: (n) => n.includes('오이'), sow: { start: 4, end: 5 }, harvest: { start: 6, end: 9 }, planKind: 'leafy', growthDays: 60 },
  { match: (n) => n.includes('딸기'), sow: { start: 9, end: 10 }, harvest: { start: 12, end: 5 }, winterCycle: true, planKind: 'fruit', growthDays: 120 },
  { match: (n) => n.includes('카틀레야'), sow: { start: 1, end: 2 }, harvest: { start: 6, end: 8 }, planKind: 'generic', growthDays: 25 },
  { match: (n) => n.includes('세고버섯'), sow: { start: 3, end: 4 }, harvest: { start: 9, end: 11 }, planKind: 'generic', growthDays: 180 },
];

export function findCropPeriodEntry(cropName: string): CropPeriodEntry | undefined {
  const n = normCropName(cropName);
  return CROP_PERIOD_ENTRIES.find((e) => e.match(n));
}

export function resolveCropPlanKind(cropName: string): CropPlanKind {
  return findCropPeriodEntry(cropName)?.planKind ?? 'generic';
}

function monthLabel(m: number): string {
  return `${m}월`;
}

export function formatMonthRange(range: MonthRange): string {
  if (range.start === range.end) return monthLabel(range.start);
  return `${monthLabel(range.start)} ~ ${monthLabel(range.end)}`;
}

/** API/DB 문자열용 파종·수확 라벨 (캘린더 파싱 가능한 형식) */
export function resolveCropPeriodLabels(
  cropName: string,
  apiSowing?: string | null,
  apiHarvest?: string | null,
): { sowing?: string; harvest?: string } {
  const entry = findCropPeriodEntry(cropName);
  if (entry) {
    return {
      sowing: entry.sowingLabel ?? formatMonthRange(entry.sow),
      harvest: entry.harvestLabel ?? formatMonthRange(entry.harvest),
    };
  }
  const sowing = apiSowing?.trim() || undefined;
  const harvest = apiHarvest?.trim() || undefined;
  return { sowing, harvest };
}

export interface ResolvedCalendarMonths {
  sow: MonthRange;
  harvest: MonthRange;
  winterCycle: boolean;
  source: 'registry' | 'parsed' | 'estimated';
}

function isWinterCycle(sow: MonthRange, harv: MonthRange): boolean {
  return sow.start > harv.end;
}

/** "파종 후 30~50일" 등에서 일수 추출 */
export function parseDaysAfterSowing(text?: string | null): number | null {
  if (!text?.trim()) return null;
  const m = text.match(/파종\s*후\s*(\d+)\s*[~\-]?\s*(\d+)?\s*일/);
  if (!m) return null;
  const a = parseInt(m[1], 10);
  const b = m[2] ? parseInt(m[2], 10) : a;
  if (Number.isNaN(a)) return null;
  return Math.round((a + b) / 2);
}

/** 수확 월 추정: 파종 중심월 + growthDays */
export function estimateHarvestRangeFromGrowth(
  sow: MonthRange,
  growthDays: number,
): MonthRange {
  const mid = Math.round((sow.start + sow.end) / 2);
  const offsetStart = Math.max(1, Math.ceil((growthDays * 0.7) / 30));
  const offsetEnd = Math.max(offsetStart, Math.ceil(growthDays / 30));
  let start = mid + offsetStart;
  let end = mid + offsetEnd;
  while (start > 12) {
    start -= 12;
    end -= 12;
  }
  while (end > 12) {
    end -= 12;
  }
  if (end < start) end = Math.min(12, start + 1);
  return { start, end };
}

/**
 * 캘린더 phase 생성용 최종 월 구간 (레지스트리 > API 파싱 > 일수 추정)
 */
export function resolveCalendarMonthRanges(
  cropName: string,
  options?: {
    sowingText?: string | null;
    harvestText?: string | null;
    growthDays?: number | null;
    parsedSow?: MonthRange | null;
    parsedHarv?: MonthRange | null;
  },
): ResolvedCalendarMonths | null {
  const entry = findCropPeriodEntry(cropName);
  if (entry) {
    return {
      sow: { ...entry.sow },
      harvest: { ...entry.harvest },
      winterCycle: Boolean(entry.winterCycle),
      source: 'registry',
    };
  }

  const growthDays =
    options?.growthDays ??
    parseDaysAfterSowing(options?.harvestText) ??
    undefined;

  let sow = options?.parsedSow ?? null;
  let harv = options?.parsedHarv ?? null;

  if (!sow && options?.sowingText) {
    sow = parseMonthsFromPeriodText(options.sowingText);
  }
  if (!harv && options?.harvestText) {
    harv = parseMonthsFromPeriodText(options.harvestText);
    if (!harv) {
      const days = parseDaysAfterSowing(options.harvestText) ?? growthDays;
      if (days && sow) {
        harv = estimateHarvestRangeFromGrowth(sow, days);
      }
    }
  }

  if (!sow && !harv) return null;
  if (!sow && harv) sow = { start: harv.start, end: harv.start };
  if (sow && !harv) {
    if (growthDays) {
      harv = estimateHarvestRangeFromGrowth(sow, growthDays);
    } else {
      harv = { start: sow.end, end: Math.min(12, sow.end + 1) };
    }
  }

  return {
    sow: sow!,
    harvest: harv!,
    winterCycle: isWinterCycle(sow!, harv!),
    source: harv && options?.parsedHarv ? 'parsed' : 'estimated',
  };
}

/** 월 숫자 추출 (4월순, 4월 상순, 3월 ~ 5월 등) */
export function parseMonthsFromPeriodText(text?: string | null): MonthRange | null {
  if (!text?.trim()) return null;
  const months = [...text.matchAll(/(\d{1,2})\s*월/g)]
    .map((m) => parseInt(m[1], 10))
    .filter((m) => m >= 1 && m <= 12);
  if (months.length === 0) return null;
  return { start: Math.min(...months), end: Math.max(...months) };
}

/** 캘린더 막대용: 파종 phase가 3개월 초과면 표시만 좁힘 */
export function narrowSowRangeForDisplay(sow: MonthRange, maxSpan = 2): MonthRange {
  const span = sow.start <= sow.end ? sow.end - sow.start + 1 : 12 - sow.start + 1 + sow.end;
  if (span <= maxSpan) return sow;
  return { start: sow.start, end: Math.min(12, sow.start + maxSpan - 1) };
}
