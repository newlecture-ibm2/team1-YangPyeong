package com.farmbalance.recommend.adapter.out.external;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 관리 DB 품목명(방울토마토 등)을 KAMIS 표준 작물명(토마토 등)으로 정규화합니다.
 */
public final class KamisCropNameResolver {

    private KamisCropNameResolver() {
    }

    public record ResolveResult(
            String inputName,
            String standardName,
            boolean exactMatch,
            String mappingNote
    ) {
    }

    public static ResolveResult resolve(String cropName) {
        if (cropName == null || cropName.isBlank()) {
            return new ResolveResult(cropName, null, false, null);
        }
        String trimmed = cropName.trim();

        if (KamisCropCodeMapper.hasDirectMapping(trimmed)) {
            return new ResolveResult(trimmed, trimmed, true, null);
        }

        List<String> standards = new ArrayList<>(KamisCropCodeMapper.getAllMappedCropNames());
        standards.sort(Comparator.comparingInt(String::length).reversed());

        for (String standard : standards) {
            if (trimmed.contains(standard)) {
                String note = "'" + trimmed + "' → KAMIS 표준 품목 '" + standard + "' 시세를 사용합니다.";
                return new ResolveResult(trimmed, standard, false, note);
            }
        }

        return new ResolveResult(trimmed, null, false, null);
    }

    public static String resolveStandardName(String cropName) {
        ResolveResult result = resolve(cropName);
        return result.standardName();
    }
}
