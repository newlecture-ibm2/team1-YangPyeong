package com.farmbalance.policy.domain.model;

/**
 * 정책 데이터 수집 소스를 나타내는 enum.
 * 순수 Java — Spring 의존 없음.
 */
public enum PolicySource {
    /** 정부24 API */
    GOV24,
    /** 농림축산식품부 */
    MAFRA,
    /** 웹 크롤링 */
    CRAWL,
    /** 개발용 Seed 데이터 */
    SEED;

    /**
     * 문자열을 PolicySource로 안전하게 변환합니다.
     * 매칭되지 않으면 null 반환.
     */
    public static PolicySource fromString(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
