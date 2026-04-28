package com.farmbalance.gov.application.service;

import com.farmbalance.gov.application.port.in.*;
import com.farmbalance.gov.domain.model.GovDomain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 지자체 서비스 — JdbcTemplate 네이티브 쿼리 기반
 * 기존 ERD 테이블 (farms, seed_registrations, balance_data, crops, orders, order_items, products) 활용
 */
@Service
@RequiredArgsConstructor
public class GovService implements GetGovDashboardUseCase, GetCultivationStatusUseCase,
                                   GetYearCompareUseCase, GetSalesStatusUseCase {

    private final JdbcTemplate jdbc;

    // ═══════ Dashboard ═══════
    @Override
    public DashboardSummary getSummary() {
        // 등록 농가 수 (APPROVED 상태)
        int totalFarms = queryInt("SELECT COUNT(*) FROM farms WHERE status = 'APPROVED' AND deleted_at IS NULL");
        // 관리 작물 수 (활성)
        int totalCrops = queryInt("SELECT COUNT(*) FROM crops WHERE is_active = true AND deleted_at IS NULL");
        // 과잉 품목 수
        int surplus = queryInt("SELECT COUNT(*) FROM balance_data WHERE balance_status IN ('EXCESS_WARN','EXCESS_CAUTION') AND year = EXTRACT(YEAR FROM NOW())::int AND deleted_at IS NULL");
        // 부족 품목 수
        int shortage = queryInt("SELECT COUNT(*) FROM balance_data WHERE balance_status IN ('SHORT_WARN','SHORT_CAUTION') AND year = EXTRACT(YEAR FROM NOW())::int AND deleted_at IS NULL");

        return DashboardSummary.builder()
                .totalFarms(totalFarms).totalCrops(totalCrops)
                .surplusCount(surplus).shortageCount(shortage)
                .build();
    }

    @Override
    public List<WarningItem> getWarningItems() {
        String sql = """
            SELECT c.name AS crop_name, bd.supply_ratio, bd.balance_status
            FROM balance_data bd
            JOIN crops c ON c.id = bd.crop_id
            WHERE bd.balance_status <> 'BALANCED'
              AND bd.year = EXTRACT(YEAR FROM NOW())::int
              AND bd.deleted_at IS NULL
            ORDER BY ABS(bd.supply_ratio - 100) DESC
            LIMIT 10
            """;
        return jdbc.query(sql, (rs, rowNum) -> {
            double ratio = rs.getDouble("supply_ratio");
            String status = rs.getString("balance_status");
            String statusLabel = status.startsWith("EXCESS") ? "과잉" : "부족";
            String level = status.endsWith("WARN") ? "긴급" : "주의";
            String advice = switch (status) {
                case "EXCESS_WARN" -> "출하 분산 / 저장 권고";
                case "EXCESS_CAUTION" -> "재배 면적 축소 안내";
                case "SHORT_WARN" -> "재배 확대 권장 / 보조금 안내";
                case "SHORT_CAUTION" -> "재배 농가 추가 모집";
                default -> "";
            };
            return WarningItem.builder()
                    .cropName(rs.getString("crop_name"))
                    .supplyRate(ratio)
                    .status(statusLabel).level(level).advice(advice)
                    .build();
        });
    }

    @Override
    public List<MonthlySupply> getMonthlySupply() {
        String sql = """
            SELECT bd.season,
                   COALESCE(SUM(bd.supply_forecast), 0) AS supply,
                   COALESCE(SUM(bd.demand_forecast), 0) AS demand
            FROM balance_data bd
            WHERE bd.year = EXTRACT(YEAR FROM NOW())::int AND bd.deleted_at IS NULL
            GROUP BY bd.season
            ORDER BY CASE bd.season WHEN 'SPRING' THEN 1 WHEN 'SUMMER' THEN 2 WHEN 'AUTUMN' THEN 3 WHEN 'WINTER' THEN 4 END
            """;
        return jdbc.query(sql, (rs, rowNum) -> {
            String label = switch (rs.getString("season")) {
                case "SPRING" -> "봄";
                case "SUMMER" -> "여름";
                case "AUTUMN" -> "가을";
                case "WINTER" -> "겨울";
                default -> rs.getString("season");
            };
            return MonthlySupply.builder()
                    .label(label)
                    .supply(rs.getDouble("supply"))
                    .demand(rs.getDouble("demand"))
                    .build();
        });
    }

    @Override
    public List<RegionDistribution> getRegionDistribution() {
        String sql = """
            SELECT COALESCE(
                     CASE WHEN f.address LIKE '%양평읍%' THEN '양평읍'
                          WHEN f.address LIKE '%용문면%' THEN '용문면'
                          WHEN f.address LIKE '%강하면%' THEN '강하면'
                          WHEN f.address LIKE '%청운면%' THEN '청운면'
                          WHEN f.address LIKE '%양서면%' THEN '양서면'
                          WHEN f.address LIKE '%옥천면%' THEN '옥천면'
                          ELSE '기타' END, '기타') AS region,
                   COUNT(*) AS farm_count
            FROM farms f
            WHERE f.status = 'APPROVED' AND f.deleted_at IS NULL
            GROUP BY region ORDER BY farm_count DESC
            """;
        return jdbc.query(sql, (rs, rowNum) ->
            RegionDistribution.builder()
                .region(rs.getString("region"))
                .count(rs.getInt("farm_count"))
                .build()
        );
    }

    // ═══════ Cultivation ═══════
    @Override
    public List<CultivationRow> getCultivationStatus(Integer year, String region, String crop) {
        int y = (year != null) ? year : java.time.Year.now().getValue();
        String sql = """
            SELECT
              COALESCE(
                CASE WHEN f.address LIKE '%양평읍%' THEN '양평읍'
                     WHEN f.address LIKE '%용문면%' THEN '용문면'
                     WHEN f.address LIKE '%강하면%' THEN '강하면'
                     WHEN f.address LIKE '%청운면%' THEN '청운면'
                     WHEN f.address LIKE '%양서면%' THEN '양서면'
                     WHEN f.address LIKE '%옥천면%' THEN '옥천면'
                     ELSE '기타' END, '기타') AS town,
              COUNT(DISTINCT f.id) AS farm_count,
              COALESCE(SUM(f.area_size), 0) AS total_area,
              STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) AS main_crops,
              COALESCE(SUM(sr.estimated_yield), 0) AS expected_ton
            FROM seed_registrations sr
            JOIN farms f ON f.id = sr.farm_id
            JOIN crops c ON c.id = sr.crop_id
            WHERE EXTRACT(YEAR FROM sr.created_at) = ?
              AND sr.deleted_at IS NULL AND f.deleted_at IS NULL
            GROUP BY town ORDER BY farm_count DESC
            """;
        return jdbc.query(sql, new Object[]{y}, (rs, rowNum) ->
            CultivationRow.builder()
                .region(rs.getString("town"))
                .farmCount(rs.getInt("farm_count"))
                .areaM2(rs.getDouble("total_area"))
                .mainCrop(rs.getString("main_crops"))
                .expectedTon(rs.getDouble("expected_ton"))
                .build()
        );
    }

    // ═══════ Year Compare ═══════
    @Override
    public List<YearCompareRow> getYearCompare(Integer baseYear, Integer compareYear, String crop) {
        int cy = (compareYear != null) ? compareYear : java.time.Year.now().getValue();
        int by = (baseYear != null) ? baseYear : cy - 1;
        String sql = """
            SELECT c.name AS crop_name,
                   COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM sr.created_at) = ? THEN sr.estimated_yield END), 0) AS prev_ton,
                   COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM sr.created_at) = ? THEN sr.estimated_yield END), 0) AS curr_ton
            FROM seed_registrations sr
            JOIN crops c ON c.id = sr.crop_id
            WHERE EXTRACT(YEAR FROM sr.created_at) IN (?, ?)
              AND sr.deleted_at IS NULL
            GROUP BY c.name
            ORDER BY curr_ton DESC
            """;
        return jdbc.query(sql, new Object[]{by, cy, by, cy}, (rs, rowNum) -> {
            double prev = rs.getDouble("prev_ton");
            double curr = rs.getDouble("curr_ton");
            double diff = curr - prev;
            double rate = (prev > 0) ? (diff / prev * 100) : 0;
            return YearCompareRow.builder()
                    .crop(rs.getString("crop_name"))
                    .prevYearTon(prev).currentYearTon(curr)
                    .diffTon(diff).diffRate(Math.round(rate * 10) / 10.0)
                    .build();
        });
    }

    // ═══════ Sales ═══════
    @Override
    public SalesSummary getSalesSummary() {
        String sql = """
            SELECT COALESCE(SUM(o.total_amount), 0) AS total,
                   COUNT(*) AS cnt,
                   COUNT(DISTINCT p.seller_id) AS sellers
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            WHERE EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW())
              AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())
              AND o.status <> 'CANCELLED' AND o.deleted_at IS NULL
            """;
        Map<String, Object> row = jdbc.queryForMap(sql);
        long total = ((Number) row.get("total")).longValue();
        int cnt = ((Number) row.get("cnt")).intValue();
        int sellers = ((Number) row.get("sellers")).intValue();
        String formatted = total >= 1_000_000 ? String.format("₩%.1fM", total / 1_000_000.0) : String.format("₩%,d", total);
        return SalesSummary.builder()
                .totalAmount(formatted).txCount(cnt).activeSellers(sellers).momRate("+18%")
                .build();
    }

    @Override
    public List<TopProductRow> getTopProducts() {
        String sql = """
            SELECT p.name, u.name AS seller,
                   SUM(oi.quantity) AS vol,
                   SUM(oi.subtotal) AS rev
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN users u ON u.id = p.seller_id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status <> 'CANCELLED' AND o.deleted_at IS NULL
            GROUP BY p.name, u.name
            ORDER BY rev DESC LIMIT 5
            """;
        return jdbc.query(sql, (rs, rowNum) ->
            TopProductRow.builder()
                .rank(rowNum + 1)
                .productName(rs.getString("name"))
                .seller(rs.getString("seller"))
                .salesVolume(rs.getInt("vol"))
                .revenue(String.format("₩%,d", rs.getLong("rev")))
                .build()
        );
    }

    @Override
    public List<MonthlySales> getMonthlySales() {
        String sql = """
            SELECT TO_CHAR(o.created_at, 'MM') AS month,
                   COALESCE(SUM(o.total_amount), 0) AS amount
            FROM orders o
            WHERE EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())
              AND o.status <> 'CANCELLED' AND o.deleted_at IS NULL
            GROUP BY month ORDER BY month
            """;
        return jdbc.query(sql, (rs, rowNum) ->
            MonthlySales.builder()
                .month(rs.getString("month") + "월")
                .amount(rs.getLong("amount"))
                .build()
        );
    }

    private int queryInt(String sql) {
        Integer val = jdbc.queryForObject(sql, Integer.class);
        return val != null ? val : 0;
    }
}
