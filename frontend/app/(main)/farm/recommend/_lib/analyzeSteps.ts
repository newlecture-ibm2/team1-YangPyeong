/** AI 추천 분석 중 단계 표시 (클라이언트 진행 UX) */

export type AnalyzeStepId = 'farm' | 'score' | 'ai' | 'finalize';

export interface AnalyzeStep {
  id: AnalyzeStepId;
  icon: string;
  label: string;
  hint: string;
}

export const ANALYZE_STEPS: AnalyzeStep[] = [
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
    id: 'ai',
    icon: '🤖',
    label: 'AI 추천 의견 생성',
    hint: '상위 작물에 맞춤 코멘트를 작성 중입니다.',
  },
  {
    id: 'finalize',
    icon: '✅',
    label: '결과 정리·저장',
    hint: '추천 순위를 정리하고 이력에 저장합니다.',
  },
];

/** 경과 시간(ms)에 따른 단계 인덱스 (마지막 단계 유지) */
export function stepIndexFromElapsed(elapsedMs: number): number {
  if (elapsedMs < 4000) return 0;
  if (elapsedMs < 12000) return 1;
  if (elapsedMs < 28000) return 2;
  return 3;
}
