package com.farmbalance.recommend.application.support;

import com.farmbalance.recommend.domain.AdviceType;
import com.farmbalance.recommend.domain.CropRecommendation;
import com.farmbalance.recommend.domain.CultivationContextItem;

/**
 * AI 코칭(aiReason) 요청 가능 여부 — 재배 등록 데이터·수확 상태 기준.
 */
public final class AiCoachingEligibility {

    public enum Status {
        /** 지금 AI 코칭 요청 가능 */
        ELIGIBLE,
        /** 재배 데이터 입력 후 가능 */
        NEEDS_DATA,
        /** 수확·재배 완료 — 사용자가 원할 때만 (자동 분석 제외) */
        COMPLETED_IDLE,
        /** 이미 AI 코칭 있음 */
        HAS_AI,
        /** 신규 추천 TOP 등 — 버튼으로만 요청 */
        OPTIONAL,
        /** AI 코칭 대상 아님 */
        NOT_APPLICABLE
    }

    public record Result(Status status, String hint) {
    }

    private AiCoachingEligibility() {
    }

    public static boolean isCompletedRegistration(CultivationContextItem item) {
        if (item == null) {
            return false;
        }
        if (item.getRegistrationStatus() == CultivationContextItem.CultivationRegistrationStatus.COMPLETED) {
            return true;
        }
        return item.isHasHarvestRecord() && !item.isInSeason();
    }

    public static Result evaluate(CultivationContextItem item, CropRecommendation rec) {
        if (rec != null && rec.getAiReason() != null && !rec.getAiReason().isBlank()) {
            return new Result(Status.HAS_AI, null);
        }

        if (item == null) {
            return new Result(Status.OPTIONAL, null);
        }

        if (isCompletedRegistration(item)) {
            if (hasHarvestAmount(item)) {
                return new Result(Status.COMPLETED_IDLE, null);
            }
            return new Result(Status.NEEDS_DATA, "수확량을 입력해 주세요.");
        }

        AdviceType advice = rec != null && rec.getAdviceType() != null
                ? rec.getAdviceType()
                : AdviceType.IN_SEASON_COACHING;

        if (advice == AdviceType.PLANNED_CROP) {
            if (item.getSowingDate() == null) {
                return new Result(Status.NEEDS_DATA, "파종(정식) 예정일을 입력하면 AI 코칭을 받을 수 있습니다.");
            }
            if (item.getFarmerEstimatedYield() == null && item.getCultivationAreaSqm() == null) {
                return new Result(Status.NEEDS_DATA, "재배 면적 또는 예상 수확량을 입력해 주세요.");
            }
            return new Result(Status.ELIGIBLE, null);
        }

        // 재배 중
        if (item.getFarmerEstimatedYield() != null) {
            return new Result(Status.ELIGIBLE, null);
        }
        if (item.getCultivationAreaSqm() != null && item.getSowingDate() != null) {
            return new Result(Status.ELIGIBLE, null);
        }
        return new Result(Status.NEEDS_DATA, "예상 수확량 또는 재배 면적·파종일을 입력해 주세요.");
    }

    public static Result evaluateNewRecommendation(CropRecommendation rec, int rank) {
        if (rec.getAiReason() != null && !rec.getAiReason().isBlank()) {
            return new Result(Status.HAS_AI, null);
        }
        if (rank <= 3) {
            return new Result(Status.OPTIONAL, null);
        }
        return new Result(Status.NOT_APPLICABLE, null);
    }

    public static boolean canRequestAi(Result result) {
        return result.status() == Status.ELIGIBLE
                || result.status() == Status.COMPLETED_IDLE
                || result.status() == Status.OPTIONAL;
    }

    public static boolean canRequestAiForCompleted(CultivationContextItem item) {
        return item != null && isCompletedRegistration(item) && hasHarvestAmount(item);
    }

    private static boolean hasHarvestAmount(CultivationContextItem item) {
        return item.getTotalHarvestKg() != null && item.getTotalHarvestKg() > 0;
    }
}
