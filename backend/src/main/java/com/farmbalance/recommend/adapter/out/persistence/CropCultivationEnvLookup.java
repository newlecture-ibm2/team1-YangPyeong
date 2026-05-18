package com.farmbalance.recommend.adapter.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * crop_cultivation_env에서 작물명으로 주요 병해충을 조회합니다.
 * 정확히 일치하지 않으면 포함 관계(방울토마토 → 토마토)로 보완합니다.
 */
@Component
@RequiredArgsConstructor
public class CropCultivationEnvLookup {

    private final JdbcTemplate jdbcTemplate;

    private static final String PESTS_SQL = """
            SELECT major_pests
            FROM crop_cultivation_env e
            WHERE e.deleted_at IS NULL
              AND e.major_pests IS NOT NULL
              AND TRIM(e.major_pests) <> ''
              AND (
                  e.crop_name = ?
                  OR ? LIKE '%' || e.crop_name || '%'
                  OR e.crop_name LIKE '%' || ? || '%'
              )
            ORDER BY
                CASE WHEN e.crop_name = ? THEN 0 ELSE 1 END,
                LENGTH(e.crop_name) DESC
            LIMIT 1
            """;

    public List<String> findMajorPests(String cropName) {
        if (cropName == null || cropName.isBlank()) {
            return Collections.emptyList();
        }
        String trimmed = cropName.trim();
        List<String> rows = jdbcTemplate.query(
                PESTS_SQL,
                (rs, rowNum) -> rs.getString("major_pests"),
                trimmed, trimmed, trimmed, trimmed
        );
        if (rows.isEmpty() || rows.get(0) == null || rows.get(0).isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(rows.get(0).split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
