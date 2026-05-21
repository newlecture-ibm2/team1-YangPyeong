import type { RecommendMode } from './recommend.types';
import { RECOMMEND_MODE_LABEL } from './recommend.types';

const RECOMMEND_MODE_HINT: Record<RecommendMode, string> = {
  PLAN: '등록된 재배 작물이 없어 새로 심을 작물 추천 위주로 분석합니다.',
  PLANNED: '재배 예정 작물 가이드와 참고 추천을 제공합니다.',
  MANAGE: '현재 재배 중인 작물 코칭과 다음 시즌 참고 작물을 함께 보여줍니다.',
  MIXED: '재배 중·예정 작물 코칭과 다음 시즌 참고 추천을 함께 제공합니다.',
};

export interface AnalyzeGuideInput {
  variant: 'initial' | 'retry';
  recommendMode?: RecommendMode;
  registeredCropCount?: number;
  isSoilDirty?: boolean;
}

export interface AnalyzeGuide {
  warning?: string;
  lines: string[];
}

/** 분석 CTA 카드에 표시할 안내 문구 */
export function buildAnalyzeGuide({
  variant,
  recommendMode,
  registeredCropCount = 0,
  isSoilDirty = false,
}: AnalyzeGuideInput): AnalyzeGuide {
  const lines: string[] = [];
  let warning: string | undefined;

  if (isSoilDirty) {
    warning = '변경된 토양 정보가 있습니다. 분석 전에 먼저 「토양 정보 저장」을 눌러 주세요.';
  }

  if (variant === 'initial') {
    lines.push(
      '토양·수급·시세를 반영해 작물 적합도 순위를 계산합니다. (AI 맞춤 코칭은 작물 상세에서 별도 요청)',
    );
    if (registeredCropCount > 0) {
      lines.push(
        `등록된 재배 작물 ${registeredCropCount}개를 반영해 분석 모드가 자동으로 결정됩니다.`,
      );
    }
  } else if (recommendMode) {
    lines.push(
      `분석 모드: ${RECOMMEND_MODE_LABEL[recommendMode]} — ${RECOMMEND_MODE_HINT[recommendMode]}`,
    );
    lines.push('점수·순위만 빠르게 갱신됩니다. AI 맞춤 코칭은 작물 상세 화면에서 받을 수 있습니다.');
  }

  if (registeredCropCount >= 3) {
    lines.push(
      `등록 작물이 ${registeredCropCount}개입니다. 계산이 많아 보통보다 조금 더 걸릴 수 있습니다. (약 10~20초)`,
    );
  } else {
    lines.push('보통 5~15초 정도 소요됩니다.');
  }

  return { warning, lines };
}
