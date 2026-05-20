package com.farmbalance.recommend.application.support;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * crops.name ↔ crop_cultivation_env.crop_name 매칭 보조.
 * 통계·마스터는 '쌀', 재배환경 시드는 '벼' 등 명칭 불일치를 SQL·조회에서 흡수합니다.
 */
public final class CropCultivationEnvMatcher {

    private static final Map<String, List<String>> ALIASES = Map.of(
            "쌀", List.of("벼"),
            "벼", List.of("쌀")
    );

    private CropCultivationEnvMatcher() {
    }

    /** env·병해충 조회에 사용할 작물명 후보 (원본 + 별칭, 순서 유지) */
    public static List<String> lookupNames(String cropName) {
        if (cropName == null || cropName.isBlank()) {
            return List.of();
        }
        Set<String> names = new LinkedHashSet<>();
        String trimmed = cropName.trim();
        names.add(trimmed);
        List<String> extra = ALIASES.get(trimmed);
        if (extra != null) {
            names.addAll(extra);
        }
        return new ArrayList<>(names);
    }

    /**
     * crop_cultivation_env LATERAL JOIN용 이름 매칭 (c.name = crop 컬럼, e.crop_name = env 컬럼).
     */
    public static String sqlEnvCropNameMatch(String cropNameColumn, String envCropNameColumn) {
        return """
                (
                    %1$s = %2$s
                    OR %1$s LIKE '%%' || %2$s || '%%'
                    OR %2$s LIKE '%%' || %1$s || '%%'
                    OR (%1$s = '쌀' AND %2$s = '벼')
                    OR (%1$s = '벼' AND %2$s = '쌀')
                )
                """
                .formatted(cropNameColumn, envCropNameColumn);
    }

    /**
     * nongsaro_farm_schedules.farm_work_type 매칭 (쌀 → 벼% 스케줄 포함).
     */
    public static String sqlNongsaroFarmWorkMatch(String cropNameColumn, String farmWorkTypeColumn) {
        return """
                (
                    %1$s = %2$s
                    OR (%1$s = '쌀' AND %2$s LIKE '벼%%')
                    OR (%1$s = '벼' AND %2$s LIKE '벼%%')
                )
                """
                .formatted(cropNameColumn, farmWorkTypeColumn);
    }
}
