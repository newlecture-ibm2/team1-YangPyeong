/**
 * 재배 가이드(rec)와 재배 캘린더·세부 계획서의 기간·월별 일정을 동기화
 */

import type { CalendarPhase, CropRecommendation } from './recommend.types';
import type { CropDetailedPlan } from './calendarPlanData';

const COLORS = {
  sow: '#52B788',
  growth: '#2D6A4F',
  harvest: '#CCFF33',
} as const;

function norm(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

/** crop_cultivation_env 시드와 동일한 파종·수확 fallback */
const PERIOD_FALLBACK: { match: (n: string) => boolean; sowing: string; harvest: string }[] = [
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

export function parseMonthsFromPeriod(text?: string | null): { start: number; end: number } | null {
  if (!text?.trim()) return null;
  const months = [...text.matchAll(/(\d{1,2})\s*월/g)]
    .map((m) => parseInt(m[1], 10))
    .filter((m) => m >= 1 && m <= 12);
  if (months.length === 0) return null;
  return { start: Math.min(...months), end: Math.max(...months) };
}

export function resolveSowingHarvestPeriods(rec: CropRecommendation): {
  sowing?: string;
  harvest?: string;
  sow?: { start: number; end: number };
  harv?: { start: number; end: number };
} {
  let sowing = rec.sowingPeriod?.trim() || undefined;
  let harvest = rec.harvestPeriod?.trim() || undefined;

  if (!sowing || !harvest) {
    const n = norm(rec.cropName);
    for (const row of PERIOD_FALLBACK) {
      if (!row.match(n)) continue;
      if (!sowing) sowing = row.sowing;
      if (!harvest) harvest = row.harvest;
      break;
    }
  }

  const sowParsed = parseMonthsFromPeriod(sowing);
  const harvParsed = parseMonthsFromPeriod(harvest);
  return {
    sowing,
    harvest,
    sow: sowParsed ?? undefined,
    harv: harvParsed ?? undefined,
  };
}

function isWinterCycle(sow: { start: number; end: number }, harv: { start: number; end: number }): boolean {
  return sow.start > harv.end;
}

/** 파종·생육·수확 막대 — rec(및 fallback)의 파종/수확 월 기준 */
export function buildCalendarPhasesFromRecommendation(rec: CropRecommendation): CalendarPhase[] | null {
  const { sow, harv } = resolveSowingHarvestPeriods(rec);
  if (!sow && !harv) return null;

  if (sow && harv && isWinterCycle(sow, harv)) {
    const growthEnd = harv.start > 1 ? harv.start - 1 : 4;
    return [
      { label: '파종·육묘', startMonth: sow.start, endMonth: 12, color: COLORS.sow },
      { label: '생육', startMonth: 1, endMonth: growthEnd, color: COLORS.growth },
      { label: '수확', startMonth: harv.start, endMonth: harv.end, color: COLORS.harvest },
    ];
  }

  const sowStart = sow?.start ?? harv!.start;
  const sowEnd = sow?.end ?? sow?.start ?? sowStart;
  const harvStart = harv?.start ?? sowEnd;
  const harvEnd = harv?.end ?? harv?.start ?? harvStart;

  const phases: CalendarPhase[] = [
    { label: '파종·육묘', startMonth: sowStart, endMonth: sowEnd, color: COLORS.sow },
  ];

  const growthStart = Math.min(sowEnd + 1, 12);
  let growthEnd = harvStart > sowEnd ? harvStart - 1 : sowEnd;
  if (growthEnd < growthStart) {
    growthEnd = harvStart;
  }
  if (growthEnd >= growthStart && !(growthStart === harvStart && growthEnd === harvEnd)) {
    phases.push({ label: '생육', startMonth: growthStart, endMonth: growthEnd, color: COLORS.growth });
  }

  phases.push({ label: '수확', startMonth: harvStart, endMonth: harvEnd, color: COLORS.harvest });
  return phases;
}

function monthLabel(m: number): string {
  return `${m}월`;
}

function calendarMonthSpan(phases: CalendarPhase[]): string {
  const wrap = phases.some((p) => p.startMonth > p.endMonth);
  if (wrap) {
    const sowPhase = phases.find((p) => p.label.includes('파종'));
    const harvPhase = phases.find((p) => p.label.includes('수확'));
    if (sowPhase && harvPhase) {
      return `${monthLabel(sowPhase.startMonth)} ~ ${monthLabel(harvPhase.endMonth)}`;
    }
  }
  const months = phases.flatMap((p) => [p.startMonth, p.endMonth]);
  const min = Math.min(...months);
  const max = Math.max(...months);
  return min === max ? monthLabel(min) : `${monthLabel(min)} ~ ${monthLabel(max)}`;
}

/** 모달·캘린더 부제 — rec.growthDays와 월 범위를 맞춤 */
export function buildTotalDurationLabel(
  rec: CropRecommendation,
  phases: CalendarPhase[],
): string {
  const monthPart = calendarMonthSpan(phases);
  if (rec.growthDays != null && rec.growthDays > 0) {
    return `약 ${rec.growthDays}일 (${monthPart})`;
  }
  const monthCount = estimateActiveMonths(phases);
  const estDays = Math.round(monthCount * 30);
  return `약 ${estDays}일 (${monthPart})`;
}

function estimateActiveMonths(phases: CalendarPhase[]): number {
  const active = new Set<number>();
  for (const p of phases) {
    if (p.startMonth <= p.endMonth) {
      for (let m = p.startMonth; m <= p.endMonth; m++) active.add(m);
    } else {
      for (let m = p.startMonth; m <= 12; m++) active.add(m);
      for (let m = 1; m <= p.endMonth; m++) active.add(m);
    }
  }
  return active.size || 4;
}

function monthInPhases(month: number, phases: CalendarPhase[]): boolean {
  return phases.some((p) => {
    if (p.startMonth <= p.endMonth) {
      return month >= p.startMonth && month <= p.endMonth;
    }
    return month >= p.startMonth || month <= p.endMonth;
  });
}

/**
 * 세부 계획서용 월 목록 — 파종 → 생육 → 수확 phase 순서로 나열 (연도 넘김 포함)
 */
export function enumerateMonthsInCultivationOrder(phases: CalendarPhase[]): number[] {
  const ordered: number[] = [];
  const seen = new Set<number>();

  const appendRange = (start: number, end: number) => {
    if (start <= end) {
      for (let m = start; m <= end; m++) {
        if (seen.has(m)) continue;
        seen.add(m);
        ordered.push(m);
      }
      return;
    }
    for (let m = start; m <= 12; m++) {
      if (seen.has(m)) continue;
      seen.add(m);
      ordered.push(m);
    }
    for (let m = 1; m <= end; m++) {
      if (seen.has(m)) continue;
      seen.add(m);
      ordered.push(m);
    }
  };

  for (const phase of phases) {
    appendRange(phase.startMonth, phase.endMonth);
  }
  return ordered;
}

/** 주별 계획서 — 총 기간 문구 동기화 + 캘린더에 해당하는 월만 유지 */
export function alignDetailedPlanWithRecommendation(
  base: CropDetailedPlan,
  rec: CropRecommendation,
  phases: CalendarPhase[],
): CropDetailedPlan {
  const totalDuration = buildTotalDurationLabel(rec, phases);
  const filtered = base.plans.filter((p) => monthInPhases(p.month, phases));
  const plans = filtered.length >= 2 ? filtered : base.plans;

  return {
    ...base,
    cropName: rec.cropName,
    totalDuration,
    plans,
  };
}

/** 캘린더 카드 부제 (가이드 생육기간·파종/수확과 동일 출처) */
export function buildCalendarSubtitle(rec: CropRecommendation, phases: CalendarPhase[]): string {
  const { sowing, harvest } = resolveSowingHarvestPeriods(rec);
  const parts: string[] = [];
  if (rec.growthDays) parts.push(`생육 기간 약 ${rec.growthDays}일`);
  if (sowing) parts.push(`파종 ${sowing}`);
  if (harvest) parts.push(`수확 ${harvest}`);
  if (parts.length === 0) parts.push(buildTotalDurationLabel(rec, phases));
  return parts.join(' · ');
}
