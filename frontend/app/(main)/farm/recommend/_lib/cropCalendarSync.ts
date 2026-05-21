/**
 * 재배 가이드(rec)와 재배 캘린더·세부 계획서의 기간·월별 일정을 동기화
 */

import type { CalendarPhase, CropRecommendation } from './recommend.types';
import { resolveCropPeriodFallback } from './cropPeriodFallback';

const COLORS = {
  sow: '#52B788',
  growth: '#2D6A4F',
  harvest: '#CCFF33',
} as const;

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
    const fallback = resolveCropPeriodFallback(rec.cropName);
    if (!sowing) sowing = fallback.sowing;
    if (!harvest) harvest = fallback.harvest;
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

/** fallback·API 모두 월 파싱 실패 시 growthDays 기준 generic 3-phase 캘린더 */
export function buildGenericCalendarPhases(rec: CropRecommendation): CalendarPhase[] {
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
