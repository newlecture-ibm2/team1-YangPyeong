package com.farmbalance.recommend.adapter.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;

/**
 * 수익 예측 요청 시 재배 등록의 파종일을 조회합니다.
 */
@Component
@RequiredArgsConstructor
public class RevenueCultivationLookup {

    private final JdbcTemplate jdbcTemplate;

    private static final String SOWING_SQL = """
            SELECT cr.sowing_date
            FROM cultivation_registrations cr
            JOIN crops c ON c.id = cr.crop_id
            WHERE cr.farm_id = ?
              AND cr.deleted_at IS NULL
              AND cr.status = 'ACTIVE'
              AND (
                  c.name = ?
                  OR c.name LIKE '%' || ? || '%'
                  OR ? LIKE '%' || c.name || '%'
              )
            ORDER BY
                CASE WHEN c.name = ? THEN 0 ELSE 1 END,
                LENGTH(c.name) DESC,
                cr.id DESC
            LIMIT 1
            """;

    public Optional<LocalDate> findSowingDate(Long farmId, String cropName) {
        if (farmId == null || cropName == null || cropName.isBlank()) {
            return Optional.empty();
        }
        String trimmed = cropName.trim();
        var dates = jdbcTemplate.query(
                SOWING_SQL,
                (rs, rowNum) -> rs.getObject("sowing_date", LocalDate.class),
                farmId, trimmed, trimmed, trimmed, trimmed
        );
        return dates.stream().filter(d -> d != null).findFirst();
    }
}
