/** AI 추천 분석 중 단계 표시 (클라이언트 진행 UX) */

export type AnalyzeStepId = 'farm' | 'score' | 'ai' | 'finalize' | 'select' | 'coaching';

export interface AnalyzeStep {
  id: AnalyzeStepId;
  icon: string;
  label: string;
  hint: string;
}

/** 빠른 분석 — LLM 없이 점수·순위만 */
export const QUICK_ANALYZE_STEPS: AnalyzeStep[] = [
  {
    id: 'farm',
    icon: '🌱',
    label: '농장·토양 데이터 확인',
    hint: 'pH, 유기물, 재배 등록 작물을 불러오고 있습니다.',
  },
  {
    id: 'score',
    icon: '📊',
    label: '작물 적합도·수급 점수 계산',
    hint: '지역 수급·시세와 토양 적합도를 반영합니다.',
  },
  {
    id: 'finalize',
    icon: '✅',
    label: '결과 정리·저장',
    hint: '추천 순위를 정리하고 이력에 저장합니다.',
  },
];

/** AI 코칭 — 사용자가 선택한 작물만 */
export const COACHING_STEPS: AnalyzeStep[] = [
  {
    id: 'select',
    icon: '🎯',
    label: '선택 작물 확인',
    hint: '재배 데이터와 점수 정보를 AI에 전달합니다.',
  },
  {
    id: 'coaching',
    icon: '🤖',
    label: 'AI 맞춤 코칭 생성',
    hint: '선택한 작물에 맞춤 분석 의견을 작성 중입니다.',
  },
  {
    id: 'finalize',
    icon: '✅',
    label: '코칭 결과 저장',
    hint: '생성된 코칭을 결과에 반영합니다.',
  },
];

/** @deprecated QUICK_ANALYZE_STEPS 사용 */
export const ANALYZE_STEPS = QUICK_ANALYZE_STEPS;

/** 빠른 분석 — 경과 시간(ms)에 따른 단계 인덱스 */
export function quickStepIndexFromElapsed(elapsedMs: number): number {
  if (elapsedMs < 3000) return 0;
  if (elapsedMs < 10000) return 1;
  return 2;
}

/** AI 코칭 — 선택 작물 수에 따라 단계 전환 속도 조절 */
export function coachingStepIndexFromElapsed(elapsedMs: number, cropCount: number): number {
  const count = Math.max(1, cropCount);
  const step1Ms = 4000;
  const step2Ms = 12000 + count * 12000;
  if (elapsedMs < step1Ms) return 0;
  if (elapsedMs < step2Ms) return 1;
  return 2;
}

/** @deprecated quickStepIndexFromElapsed 사용 */
export function stepIndexFromElapsed(elapsedMs: number): number {
  return quickStepIndexFromElapsed(elapsedMs);
}
