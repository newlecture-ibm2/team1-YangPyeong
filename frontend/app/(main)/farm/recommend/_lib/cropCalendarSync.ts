/**
 * 재배 가이드(rec)와 재배 캘린더·세부 계획서의 기간·월별 일정을 동기화
 */

import type { CalendarPhase, CropRecommendation } from './recommend.types';
import {
  narrowSowRangeForDisplay,
  parseMonthsFromPeriodText,
  resolveCalendarMonthRanges,
  resolveCropPeriodLabels,
  type MonthRange,
} from './cropPeriodRegistry';

const COLORS = {
  sow: '#52B788',
  growth: '#2D6A4F',
  harvest: '#CCFF33',
} as const;

/** @deprecated use parseMonthsFromPeriodText from cropPeriodRegistry */
export function parseMonthsFromPeriod(text?: string | null): { start: number; end: number } | null {
  return parseMonthsFromPeriodText(text);
}

export function resolveSowingHarvestPeriods(rec: CropRecommendation): {
  sowing?: string;
  harvest?: string;
  sow?: { start: number; end: number };
  harv?: { start: number; end: number };
} {
  const labels = resolveCropPeriodLabels(rec.cropName, rec.sowingPeriod, rec.harvestPeriod);
  let sowing = labels.sowing;
  let harvest = labels.harvest;

  const resolved = resolveCalendarMonthRanges(rec.cropName, {
    sowingText: rec.sowingPeriod,
    harvestText: rec.harvestPeriod,
    growthDays: rec.growthDays,
    parsedSow: parseMonthsFromPeriodText(sowing),
    parsedHarv: parseMonthsFromPeriodText(harvest),
  });

  if (resolved && !sowing) sowing = `${resolved.sow.start}월 ~ ${resolved.sow.end}월`;
  if (resolved && !harvest) harvest = `${resolved.harvest.start}월 ~ ${resolved.harvest.end}월`;

  const sowParsed = parseMonthsFromPeriodText(sowing);
  const harvParsed = parseMonthsFromPeriodText(harvest);

  return {
    sowing,
    harvest,
    sow: sowParsed ?? undefined,
    harv: harvParsed ?? undefined,
  };
}

function buildPhasesFromRanges(sowRaw: MonthRange, harv: MonthRange, winterCycle: boolean): CalendarPhase[] {
  const sow = narrowSowRangeForDisplay(sowRaw);

  if (winterCycle) {
    const growthEnd = harv.start > 1 ? harv.start - 1 : 4;
    return [
      { label: '파종·육묘', startMonth: sow.start, endMonth: 12, color: COLORS.sow },
      { label: '생육', startMonth: 1, endMonth: growthEnd, color: COLORS.growth },
      { label: '수확', startMonth: harv.start, endMonth: harv.end, color: COLORS.harvest },
    ];
  }

  const sowStart = sow.start;
  const sowEnd = sow.end;
  const harvStart = harv.start;
  const harvEnd = harv.end;

  const phases: CalendarPhase[] = [
    { label: '파종·육묘', startMonth: sowStart, endMonth: sowEnd, color: COLORS.sow },
  ];

  let growthStart = sowEnd < 12 ? sowEnd + 1 : 1;
  let growthEnd = harvStart > sowEnd ? harvStart - 1 : sowEnd;

  if (harvStart <= sowEnd) {
    growthStart = sowEnd;
    growthEnd = sowEnd;
  }

  if (growthEnd < growthStart) {
    growthEnd = growthStart;
  }

  const sowSpan = sowEnd >= sowStart ? sowEnd - sowStart + 1 : 1;
  const harvSpan = harvEnd >= harvStart ? harvEnd - harvStart + 1 : 1;

  if (growthEnd >= growthStart && !(sowSpan >= 8 && harvSpan <= 2)) {
    phases.push({ label: '생육', startMonth: growthStart, endMonth: growthEnd, color: COLORS.growth });
  } else if (harvStart > sowEnd + 1) {
    phases.push({
      label: '생육',
      startMonth: Math.min(growthStart, 12),
      endMonth: Math.max(growthStart, harvStart - 1),
      color: COLORS.growth,
    });
  }

  phases.push({ label: '수확', startMonth: harvStart, endMonth: harvEnd, color: COLORS.harvest });
  return phases;
}

/** 파종·생육·수확 막대 — 레지스트리·파싱·growthDays 추정 순 */
export function buildCalendarPhasesFromRecommendation(rec: CropRecommendation): CalendarPhase[] | null {
  const resolved = resolveCalendarMonthRanges(rec.cropName, {
    sowingText: rec.sowingPeriod,
    harvestText: rec.harvestPeriod,
    growthDays: rec.growthDays,
    parsedSow: parseMonthsFromPeriodText(rec.sowingPeriod),
    parsedHarv: parseMonthsFromPeriodText(rec.harvestPeriod),
  });

  if (!resolved) return null;

  return buildPhasesFromRanges(resolved.sow, resolved.harvest, resolved.winterCycle);
}

/** fallback·API 모두 월 파싱 실패 시 growthDays 기준 generic 3-phase 캘린더 */
export function buildGenericCalendarPhases(rec: CropRecommendation): CalendarPhase[] {
  const resolved = resolveCalendarMonthRanges(rec.cropName, {
    growthDays: rec.growthDays ?? 120,
    sowingText: rec.sowingPeriod,
    harvestText: rec.harvestPeriod,
  });

  if (resolved) {
    return buildPhasesFromRanges(resolved.sow, resolved.harvest, resolved.winterCycle);
  }

  const days = rec.growthDays ?? 120;
  const spanMonths = Math.min(9, Math.max(3, Math.ceil(days / 30)));
  const sowStart = 3;
  const sowEnd = Math.min(4, sowStart + 1);
  const harvEnd = Math.min(12, sowStart + spanMonths - 1);
  const harvStart = Math.max(sowEnd + 1, harvEnd - 1);
  const growthEnd = Math.max(sowEnd, harvStart - 1);

  return [
    { label: '파종·육묘', startMonth: sowStart, endMonth: sowEnd, color: COLORS.sow },
    { label: '생육', startMonth: sowEnd + 1, endMonth: growthEnd, color: COLORS.growth },
    { label: '수확', startMonth: harvStart, endMonth: harvEnd, color: COLORS.harvest },
  ];
}

function monthLabel(m: number): string {
  return `${m}월`;
}

/** phase 구간에 month가 포함되는지 (연말 넘김 포함) */
export function isMonthInPhase(month: number, phase: CalendarPhase): boolean {
  if (phase.startMonth <= phase.endMonth) {
    return month >= phase.startMonth && month <= phase.endMonth;
  }
  return month >= phase.startMonth || month <= phase.endMonth;
}

function phaseSpanMonths(phase: CalendarPhase): number {
  if (phase.startMonth <= phase.endMonth) {
    return phase.endMonth - phase.startMonth + 1;
  }
  return 12 - phase.startMonth + 1 + phase.endMonth;
}

/** 겹치는 phase가 있을 때 해당 월의 대표 phase (좁은 구간 우선) */
export function resolvePrimaryPhaseForMonth(month: number, phases: CalendarPhase[]): CalendarPhase {
  const matching = phases.filter((p) => isMonthInPhase(month, p));
  if (matching.length === 0) {
    return phases[0];
  }
  if (matching.length === 1) {
    return matching[0];
  }
  return [...matching].sort((a, b) => phaseSpanMonths(a) - phaseSpanMonths(b))[0];
}

export interface MonthPhaseSlot {
  month: number;
  phase: CalendarPhase;
  indexInPhase: number;
  totalInPhase: number;
  cycleIndex: number;
  totalCycleMonths: number;
}

/** 세부 계획서용 — 재배 순서대로 월·phase·phase 내 순번 */
export function buildMonthPhaseSchedule(phases: CalendarPhase[]): MonthPhaseSlot[] {
  const months = enumerateMonthsInCultivationOrder(phases);
  const phaseToMonths = new Map<string, number[]>();

  for (const month of months) {
    const phase = resolvePrimaryPhaseForMonth(month, phases);
    const list = phaseToMonths.get(phase.label) ?? [];
    if (!list.includes(month)) {
      list.push(month);
      phaseToMonths.set(phase.label, list);
    }
  }

  return months.map((month, cycleIndex) => {
    const phase = resolvePrimaryPhaseForMonth(month, phases);
    const phaseMonths = phaseToMonths.get(phase.label) ?? [month];
    const indexInPhase = Math.max(0, phaseMonths.indexOf(month));
    return {
      month,
      phase,
      indexInPhase,
      totalInPhase: phaseMonths.length,
      cycleIndex,
      totalCycleMonths: months.length,
    };
  });
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
