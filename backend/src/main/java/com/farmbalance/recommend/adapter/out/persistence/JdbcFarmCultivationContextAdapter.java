package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.LoadFarmCultivationContextPort;
import com.farmbalance.recommend.domain.CultivationContextItem;
import com.farmbalance.recommend.domain.FarmCultivationContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JdbcFarmCultivationContextAdapter implements LoadFarmCultivationContextPort {

    private final JdbcTemplate jdbcTemplate;

    private static final String REGISTRATIONS_SQL = """
            SELECT
                cr.id AS registration_id,
                cr.crop_id,
                c.name AS crop_name,
                cr.cultivation_area,
                cr.farmer_estimated_yield,
                cr.yield_unit,
                cr.status,
                cr.sowing_date,
                COALESCE(cr.in_season, FALSE) AS in_season_flag,
                (
                    COALESCE(cr.in_season, FALSE)
                    OR EXISTS (
                        SELECT 1 FROM harvest_records hr
                        WHERE hr.cultivation_registration_id = cr.id
                    )
                    OR EXISTS (
                        SELECT 1 FROM cultivation_history ch
                        WHERE ch.cultivation_registration_id = cr.id
                          AND ch.activity_type IS NOT NULL
                          AND ch.activity_type NOT IN ('SYSTEM', 'WEATHER')
                    )
                    OR (cr.sowing_date IS NOT NULL AND cr.sowing_date <= CURRENT_DATE)
                ) AS in_season_computed,
                (
                    SELECT COUNT(*) FROM cultivation_history ch2
                    WHERE ch2.cultivation_registration_id = cr.id
                      AND ch2.activity_type IS NOT NULL
                      AND ch2.activity_type NOT IN ('SYSTEM', 'WEATHER')
                ) AS real_activity_count,
                EXISTS (
                    SELECT 1 FROM harvest_records hr2
                    WHERE hr2.cultivation_registration_id = cr.id
                ) AS has_harvest
            FROM cultivation_registrations cr
            JOIN crops c ON c.id = cr.crop_id AND c.deleted_at IS NULL
            WHERE cr.farm_id = ?
              AND cr.deleted_at IS NULL
              AND cr.status = 'ACTIVE'
            ORDER BY cr.id
            """;

    private static final String RECENT_HISTORY_SQL = """
            SELECT ch.cultivation_registration_id,
                   ch.activity_type,
                   ch.activity_content,
                   ch.record_date
            FROM cultivation_history ch
            WHERE ch.farm_id = ?
              AND ch.cultivation_registration_id IS NOT NULL
              AND ch.activity_type IS NOT NULL
              AND ch.activity_type NOT IN ('SYSTEM', 'WEATHER')
            ORDER BY ch.record_date DESC, ch.id DESC
            LIMIT 30
            """;

    private static final String HARVEST_SUM_SQL = """
            SELECT cultivation_registration_id,
                   COALESCE(SUM(
                       CASE WHEN yield_unit IN ('ton', '톤', 'TON')
                            THEN yield_amount * 1000
                            ELSE yield_amount END
                   ), 0) AS total_kg
            FROM harvest_records
            WHERE cultivation_registration_id IN (%s)
            GROUP BY cultivation_registration_id
            """;

    @Override
    public FarmCultivationContext loadByFarmId(Long farmId) {
        List<CultivationContextItem> items = jdbcTemplate.query(
                REGISTRATIONS_SQL,
                (rs, rowNum) -> mapRegistration(rs),
                farmId
        );

        if (items.isEmpty()) {
            return FarmCultivationContext.builder().items(List.of()).build();
        }

        Map<Long, List<String>> recentByReg = loadRecentActivities(farmId);
        Map<Long, Double> harvestKgByReg = loadHarvestTotals(items);

        List<CultivationContextItem> enriched = new ArrayList<>();
        for (CultivationContextItem base : items) {
            enriched.add(base.toBuilder()
                    .recentActivitySummaries(recentByReg.getOrDefault(base.getRegistrationId(), List.of()))
                    .totalHarvestKg(harvestKgByReg.get(base.getRegistrationId()))
                    .build());
        }

        return FarmCultivationContext.builder().items(enriched).build();
    }

    private CultivationContextItem mapRegistration(ResultSet rs) throws SQLException {
        Long regId = rs.getLong("registration_id");
        Date sowing = rs.getDate("sowing_date");
        String status = rs.getString("status");
        CultivationContextItem.CultivationRegistrationStatus regStatus =
                "COMPLETED".equalsIgnoreCase(status)
                        ? CultivationContextItem.CultivationRegistrationStatus.COMPLETED
                        : CultivationContextItem.CultivationRegistrationStatus.ACTIVE;

        return CultivationContextItem.builder()
                .registrationId(regId)
                .cropId(rs.getLong("crop_id"))
                .cropName(rs.getString("crop_name"))
                .cultivationAreaSqm(rs.getObject("cultivation_area") != null
                        ? rs.getDouble("cultivation_area") : null)
                .farmerEstimatedYield(rs.getObject("farmer_estimated_yield") != null
                        ? rs.getDouble("farmer_estimated_yield") : null)
                .yieldUnit(rs.getString("yield_unit"))
                .registrationStatus(regStatus)
                .sowingDate(sowing != null ? sowing.toLocalDate() : null)
                .inSeason(rs.getBoolean("in_season_computed"))
                .realActivityCount(rs.getInt("real_activity_count"))
                .hasHarvestRecord(rs.getBoolean("has_harvest"))
                .recentActivitySummaries(List.of())
                .build();
    }

    private Map<Long, List<String>> loadRecentActivities(Long farmId) {
        Map<Long, List<String>> map = new LinkedHashMap<>();
        jdbcTemplate.query(RECENT_HISTORY_SQL, rs -> {
            Long regId = rs.getLong("cultivation_registration_id");
            map.computeIfAbsent(regId, k -> new ArrayList<>());
            List<String> list = map.get(regId);
            if (list.size() < 5) {
                String line = String.format("%s %s: %s",
                        rs.getDate("record_date"),
                        rs.getString("activity_type"),
                        truncate(rs.getString("activity_content"), 40));
                list.add(line);
            }
        }, farmId);
        return map;
    }

    private Map<Long, Double> loadHarvestTotals(List<CultivationContextItem> items) {
        List<Long> ids = items.stream().map(CultivationContextItem::getRegistrationId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        String placeholders = String.join(",", ids.stream().map(id -> "?").toList());
        String sql = String.format(HARVEST_SUM_SQL, placeholders);
        Map<Long, Double> result = new LinkedHashMap<>();
        jdbcTemplate.query(sql, rs -> {
            result.put(rs.getLong("cultivation_registration_id"), rs.getDouble("total_kg"));
        }, ids.toArray());
        return result;
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
