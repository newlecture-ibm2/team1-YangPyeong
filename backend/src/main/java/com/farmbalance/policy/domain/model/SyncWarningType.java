package com.farmbalance.policy.domain.model;

/**
 * 정책 동기화 경고 유형.
 * warning 메시지 포맷: [externalId][WARNING_TYPE] message
 */
public enum SyncWarningType {

    // ── Region 관련 ──
    REGION_CORRECTION("REGION_CORRECTION"),
    REGION_MATCH_FAILED("REGION_MATCH_FAILED"),

    // ── Category 관련 ──
    CATEGORY_CORRECTION("CATEGORY_CORRECTION"),

    // ── 날짜 관련 ──
    DATE_PARSE_FAILED("DATE_PARSE_FAILED"),
    DATE_ESTIMATED("DATE_ESTIMATED"),

    // ── AI 분석 관련 ──
    AI_ANALYZE_SKIPPED("AI_ANALYZE_SKIPPED"),
    AI_ANALYZE_FAILED("AI_ANALYZE_FAILED"),
    AI_LOW_CONFIDENCE("AI_LOW_CONFIDENCE"),

    // ── 동기화 관련 ──
    SYNC_SAVE_FAILED("SYNC_SAVE_FAILED"),
    SYNC_FETCH_FAILED("SYNC_FETCH_FAILED");

    private final String code;

    SyncWarningType(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    /**
     * 표준 포맷 경고 메시지 생성.
     * 형식: [externalId][WARNING_TYPE] message
     */
    public String format(String externalId, String message) {
        return String.format("[%s][%s] %s", externalId, code, message);
    }
}
