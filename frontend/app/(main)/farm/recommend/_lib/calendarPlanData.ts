/* ════════════════════════════════════════════════════════
   재배 캘린더 — 주별 세부 계획 타입
   ════════════════════════════════════════════════════════ */

import type { CalendarPhase, CropRecommendation } from './recommend.types';
import { buildDetailedPlanFromRecommendation } from './cropDetailedPlanBuilder';

export interface WeeklyTask {
  week: string;           // 예: "1주차", "2주차"
  task: string;           // 핵심 작업명
  detail: string;         // 상세 실행 내용
  tip?: string;           // 꿀팁 (선택)
}

export interface MonthlyPlan {
  month: number;          // 1~12
  phase: string;          // 대분류: 준비기, 파종기, 생육기 등
  phaseColor: string;     // 시각화 색상
  weeks: WeeklyTask[];
}

export interface CropDetailedPlan {
  cropName: string;
  totalDuration: string;  // 예: "약 120일 (4~8월)"
  plans: MonthlyPlan[];
}

/** 상세 페이지 — rec·캘린더 phases와 동기화된 세부 계획서 */
export function getCropDetailedPlanForRecommendation(
  _cropName: string,
  rec: CropRecommendation,
  phases: CalendarPhase[],
): CropDetailedPlan {
  return buildDetailedPlanFromRecommendation(rec, phases);
}
