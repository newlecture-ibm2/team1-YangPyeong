package com.farmbalance.policy.domain.model;

import java.util.Map;
import java.util.Optional;

/**
 * 지역코드 정규화 순수 로직 (POJO).
 * DB 조회 없이 문자열/코드 보정만 담당합니다.
 *
 * 보정 규칙:
 * - "전국", "공통" → "0000"
 * - 5자리 숫자 → 앞 4자리 (41830 → 4183)
 * - 4자리 숫자 중 뒤 2자리 00 → 앞 2자리 (4100 → 41)
 * - null/blank → empty
 */
public class RegionCodeNormalizer {

    private static final Map<String, String> SPECIAL_MAPPINGS = Map.of(
            "전국", "0000",
            "공통", "0000",
            "0000", "0000",
            "00", "0000"
    );

    private RegionCodeNormalizer() {
        // 유틸리티 클래스
    }

    /**
     * 전국/공통 등 특수 키워드를 매핑합니다.
     */
    public static Optional<String> resolveSpecial(String input) {
        if (input == null || input.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(SPECIAL_MAPPINGS.get(input.trim()));
    }

    /**
     * 숫자 코드를 표준 길이로 보정합니다.
     * 41830 → 4183, 4100 → 41
     *
     * @return 보정된 코드 후보 목록 (원본, 4자리, 2자리 순)
     */
    public static java.util.List<String> normalizeCandidates(String code) {
        java.util.List<String> candidates = new java.util.ArrayList<>();
        if (code == null || !code.matches("\\d+")) {
            return candidates;
        }

        candidates.add(code); // 원본 그대로

        // 5자리 → 4자리
        if (code.length() == 5) {
            candidates.add(code.substring(0, 4));
        }

        // 4자리, 뒤 2자리가 00이면 → 2자리 (시/도 코드)
        if (code.length() == 4 && code.endsWith("00")) {
            candidates.add(code.substring(0, 2));
        }

        // 3자리 이상이면 2자리도 후보
        if (code.length() >= 3) {
            String prefix = code.substring(0, 2);
            if (!candidates.contains(prefix)) {
                candidates.add(prefix);
            }
        }

        return candidates;
    }

    /**
     * 입력이 숫자 코드인지 확인합니다.
     */
    public static boolean isNumericCode(String input) {
        return input != null && input.matches("\\d+");
    }
}
