package com.farmbalance.policy.domain;

import java.util.List;

/**
 * 추천/목록에서 제외해야 할 비혜택 행정 공고 판별 유틸리티.
 * 정책 데이터 자체는 삭제하지 않고, 사용자향 화면 노출만 차단합니다.
 *
 * <h3>판별 로직 (2단계)</h3>
 * <ol>
 *   <li><b>강제 제외</b>: 포함 키워드 유무와 관계없이 무조건 제외 (사용허가, 주민의견, 구인, 수탁업체 등)</li>
 *   <li><b>약한 제외</b>: 포함 우선 키워드가 함께 있으면 제외하지 않음 (재공고 등)</li>
 * </ol>
 */
public final class PolicyNoticeFilter {

    private PolicyNoticeFilter() {}

    // ──────────────────────────────────────────────
    // 1. 강제 제외 키워드 — 포함 키워드가 있어도 무조건 제외
    // ──────────────────────────────────────────────
    private static final List<String> HARD_EXCLUDE = List.of(
            // 주민의견·청취·공람 계열
            "주민의견", "의견 청취", "의견청취", "의견수렴",
            "공람", "행정예고", "열람공고",
            // 사용허가·인허가 계열
            "사용허가", "농업생산기반시설 사용허가", "점용허가",
            // 채용·구인·전형 계열
            "구인 공고", "구인공고", "농업인력 구인", "인력 구인",
            "기간제근로자", "채용시험", "채용공고", "채용 공고",
            "서류전형", "면접시험", "합격자 발표", "합격자발표",
            // 위탁·수탁 계열
            "민간위탁", "수탁업체", "위탁 운영",
            // 특정 필지/번지
            "번지"
    );

    // ──────────────────────────────────────────────
    // 2. 약한 제외 키워드 — 포함 우선 키워드가 함께 있으면 유지
    // ──────────────────────────────────────────────
    private static final List<String> SOFT_EXCLUDE = List.of(
            "업체 모집", "재공고"
    );

    // ──────────────────────────────────────────────
    // 3. 포함 우선 키워드 — 약한 제외를 무력화
    //    (강제 제외는 무력화하지 않음)
    // ──────────────────────────────────────────────
    private static final List<String> INCLUDE_PRIORITY = List.of(
            "지원사업", "영농정착", "청년후계농", "후계농",
            "보조금", "보조사업", "융자", "직불", "장려금",
            "자금 지원", "시설 지원", "교육 지원", "컨설팅",
            "농업인 지원", "귀농", "친환경", "GAP",
            "시설 현대화", "임대", "교육", "신청"
    );

    /**
     * 해당 제목이 비혜택 공고인지 판별합니다.
     *
     * @param title 정책 제목
     * @return true이면 사용자 화면에서 제외해야 함
     */
    public static boolean isNonBenefitNotice(String title) {
        if (title == null || title.isBlank()) return false;
        String lower = title.toLowerCase();

        // 1단계: 강제 제외 — 포함 키워드와 무관하게 즉시 제외
        for (String kw : HARD_EXCLUDE) {
            if (lower.contains(kw.toLowerCase())) {
                return true;
            }
        }

        // 2단계: 약한 제외 — 포함 우선 키워드가 있으면 유지
        boolean softMatch = false;
        for (String kw : SOFT_EXCLUDE) {
            if (lower.contains(kw.toLowerCase())) {
                softMatch = true;
                break;
            }
        }
        if (softMatch) {
            // 포함 우선 키워드가 하나라도 있으면 제외하지 않음
            for (String kw : INCLUDE_PRIORITY) {
                if (lower.contains(kw.toLowerCase())) {
                    return false; // 유지
                }
            }
            return true; // 포함 우선 키워드 없으면 제외
        }

        return false;
    }

    /**
     * 제외 사유를 반환합니다. 제외 대상이 아니면 null.
     *
     * @param title 정책 제목
     * @return 제외 사유 문자열 (예: excluded_permit_notice) 또는 null
     */
    public static String getExcludeReason(String title) {
        if (title == null || title.isBlank()) return null;
        String lower = title.toLowerCase();

        // 주민의견·공람·행정예고
        for (String kw : List.of("주민의견", "의견 청취", "의견청취", "의견수렴", "공람", "행정예고", "열람공고")) {
            if (lower.contains(kw.toLowerCase())) return "excluded_permit_notice";
        }
        // 사용허가·인허가
        for (String kw : List.of("사용허가", "점용허가")) {
            if (lower.contains(kw.toLowerCase())) return "excluded_permit_notice";
        }
        // 채용·구인
        for (String kw : List.of("구인 공고", "구인공고", "농업인력 구인", "인력 구인",
                "기간제근로자", "채용시험", "채용공고", "채용 공고",
                "서류전형", "면접시험", "합격자 발표", "합격자발표")) {
            if (lower.contains(kw.toLowerCase())) return "excluded_recruitment_notice";
        }
        // 위탁·수탁
        for (String kw : List.of("민간위탁", "수탁업체", "위탁 운영")) {
            if (lower.contains(kw.toLowerCase())) return "excluded_outsourcing_notice";
        }
        // 번지
        if (lower.contains("번지")) return "excluded_permit_notice";
        // 약한 제외
        boolean softMatch = false;
        for (String kw : SOFT_EXCLUDE) {
            if (lower.contains(kw.toLowerCase())) { softMatch = true; break; }
        }
        if (softMatch) {
            for (String kw : INCLUDE_PRIORITY) {
                if (lower.contains(kw.toLowerCase())) return null;
            }
            return "excluded_non_benefit_notice";
        }

        return null;
    }

    /**
     * 제목 + 내용 합산으로 판별합니다.
     */
    public static boolean isNonBenefitNotice(String title, String content) {
        return isNonBenefitNotice(title);
    }
}
