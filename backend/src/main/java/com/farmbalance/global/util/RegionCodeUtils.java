package com.farmbalance.global.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class RegionCodeUtils {

    private static final Map<String, String> SPECIAL_MAPPINGS = Map.of(
            "전국", "0000",
            "공통", "0000",
            "0000", "0000",
            "00", "0000"
    );

    private RegionCodeUtils() {}

    public static Optional<String> resolveSpecial(String input) {
        if (input == null || input.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(SPECIAL_MAPPINGS.get(input.trim()));
    }

    public static String normalizeCode(String input) {
        if (input == null || input.isBlank()) return null;
        String trimmed = input.trim();
        if (SPECIAL_MAPPINGS.containsKey(trimmed)) return SPECIAL_MAPPINGS.get(trimmed);
        
        if (!trimmed.matches("\\d+")) return null;
        
        if (trimmed.length() >= 10) return trimmed.substring(0, 4);
        if (trimmed.length() == 5) return trimmed.substring(0, 4);
        if (trimmed.length() == 4) return trimmed;
        
        return trimmed;
    }

    public static List<String> normalizeCandidates(String code) {
        List<String> candidates = new ArrayList<>();
        if (code == null || !code.matches("\\d+")) {
            return candidates;
        }

        candidates.add(code);

        if (code.length() >= 10) {
            candidates.add(code.substring(0, 4));
        }
        if (code.length() == 5) {
            candidates.add(code.substring(0, 4));
        }
        if (code.length() == 4 && code.endsWith("00")) {
            candidates.add(code.substring(0, 2));
        }
        if (code.length() >= 3) {
            String prefix = code.substring(0, 2);
            if (!candidates.contains(prefix)) {
                candidates.add(prefix);
            }
        }
        return candidates;
    }

    public static boolean isNumericCode(String input) {
        return input != null && input.matches("\\d+");
    }

    public static String extractSigunguFromBjd(String bjdCode) {
        if (bjdCode == null || bjdCode.isBlank() || bjdCode.length() < 4) return null;
        String trimmed = bjdCode.trim();
        if (!trimmed.matches("\\d+")) return null;
        return trimmed.substring(0, 4);
    }

    public static boolean isValidSigunguCode(String regionCode) {
        return regionCode != null && regionCode.matches("\\d{4}");
    }

    public static boolean isNationalCode(String regionCode) {
        return "0000".equals(regionCode);
    }
}
