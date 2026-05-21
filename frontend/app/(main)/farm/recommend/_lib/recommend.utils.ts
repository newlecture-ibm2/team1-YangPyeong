import type { CropRecommendation, CropRecommendResponse } from './recommend.types';
import { enrichCropGuideCardFields } from './cropGuideCardFallback';

export const FAILED_AI_REASON_SNIPPET = 'AI 분석 중 오류가 발생했습니다';
export const GENERIC_AI_REASON_FALLBACK = '현재 농장 데이터를 바탕으로 분석한 결과입니다.';

const MIN_AI_REASON_LEN = 12;

export function isWeakAiReason(text?: string | null): boolean {
  const t = (text ?? '').trim();
  if (!t) return true;
  if (t.length < MIN_AI_REASON_LEN) return true;
  if (t === GENERIC_AI_REASON_FALLBACK) return true;
  if (t.includes(FAILED_AI_REASON_SNIPPET)) return true;
  return false;
}

/** UI·세션에 노출할 사유 (플레이스홀더·오류 문구는 숨김) */
export function formatDisplayAiReason(text?: string | null): string | undefined {
  if (isWeakAiReason(text)) return undefined;
  return text!.trim();
}

function sanitizeCrop(rec: CropRecommendation): CropRecommendation {
  const aiReason = formatDisplayAiReason(rec.aiReason);
  const base = aiReason === rec.aiReason ? rec : { ...rec, aiReason };
  return enrichCropGuideCardFields(base);
}

/** API·DB 이력에 남은 플레이스홀더를 화면에서 제거 */
export function sanitizeRecommendResponse(
  data: CropRecommendResponse,
): CropRecommendResponse {
  return {
    ...data,
    recommendations: data.recommendations?.map(sanitizeCrop),
    currentCropAdvices: data.currentCropAdvices?.map(sanitizeCrop),
  };
}

/** 신규 추천 목록 + 재배 중·재배 예정 코칭 목록에서 작물 조회 */
export function findCropInRecommendResult(
  result: CropRecommendResponse,
  cropId: number,
): CropRecommendation | undefined {
  return (
    result.recommendations?.find((r) => r.cropId === cropId) ??
    result.currentCropAdvices?.find((r) => r.cropId === cropId)
  );
}

export function recommendResultHasFailedAiReason(result: CropRecommendResponse | null): boolean {
  if (!result) return false;
  const items = [...(result.currentCropAdvices ?? []), ...(result.recommendations ?? [])];
  return items.some((rec) => isWeakAiReason(rec.aiReason));
}

