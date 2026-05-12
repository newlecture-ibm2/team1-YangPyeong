package com.farmbalance.policy.domain.model;

/**
 * 정책 데이터 수집 소스를 나타내는 enum.
 * 순수 Java — Spring 의존 없음.
 */
public enum PolicySource {
    /** 보조금24 (정부24) API — 정책 종합 */
    GOV24,
    /** 농림축산식품부 공고 크롤링 */
    MAFRA,
    /** 농기계 임대 API */
    FARM_MACHINE,
    /** 농사로 영농기술상담 API */
    NONGSARO,
    /** 흙토람 토양검정 API */
    SOIL,
    /** 농업교육포털 크롤링 */
    AGRIEDU,
    /** 그린대로 귀농귀촌 크롤링 */
    GREENDAERO,
    /** 수동 업로드 문서 (PDF/HWP) */
    MANUAL,
    /** 양평군청 공고 크롤링 */
    YANGPYEONG,
    /** 경기도청 농정 크롤링 */
    GYEONGGI,
    /** 기타 웹 크롤링 */
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
