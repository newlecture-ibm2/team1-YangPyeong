package com.farmbalance.recommend.domain;

/**
 * AI 추천 분석 모드
 */
public enum RecommendMode {
    /** 재배 등록 없음 — 신규 작물 추천 */
    PLAN,
    /** 등록만 있고 실제 재배 활동 없음 — 재배 예정 가이드 */
    PLANNED,
    /** 실제 재배 중 — 현재 작물 코칭 중심 */
    MANAGE,
    /** 예정 + 재배 중 혼재 */
    MIXED;

    public static RecommendMode fromString(String value) {
        if (value == null || value.isBlank()) {
            return PLAN;
        }
        try {
            return RecommendMode.valueOf(value);
        } catch (IllegalArgumentException e) {
            return PLAN;
        }
    }
}
