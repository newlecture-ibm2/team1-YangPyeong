package com.farmbalance.recommend.domain;

/**
 * 추천 항목별 AI 조언 유형
 */
public enum AdviceType {
    /** 심기 전 신규 작물 추천 */
    NEW_RECOMMEND,
    /** 등록만 된 재배 예정 작물 */
    PLANNED_CROP,
    /** 실제 재배 중 작물 관리 코칭 */
    IN_SEASON_COACHING,
    /** 다음 시즌·전환 검토용 참고 작물 */
    NEXT_SEASON;

    public static AdviceType fromString(String value) {
        if (value == null || value.isBlank()) {
            return NEW_RECOMMEND;
        }
        try {
            return AdviceType.valueOf(value);
        } catch (IllegalArgumentException e) {
            return NEW_RECOMMEND;
        }
    }
}
