package com.farmbalance.gov.adapter.out.persistence.adapter;

import com.farmbalance.gov.application.port.out.GovDataQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 지자체 데이터 조회 Driven Adapter (JdbcTemplate 네이티브 쿼리)
 * 기존 ERD 테이블(farms, seed_registrations, balance_data, orders 등)을 직접 조회합니다.
 */
@Component
@RequiredArgsConstructor
public class GovDataPersistenceAdapter implements GovDataQueryPort {

    private final JdbcTemplate jdbc;

    /** 읍면 추출 CASE 표현식 (공통) */
    private static final String TOWN_CASE = """
        COALESCE(
          CASE WHEN f.address LIKE '%양평읍%' THEN '양평읍'
               WHEN f.address LIKE '%용문면%' THEN '용문면'
               WHEN f.address LIKE '%강하면%' THEN '강하면'
               WHEN f.address LIKE '%청운면%' THEN '청운면'
               WHEN f.address LIKE '%양서면%' THEN '양서면'
               WHEN f.address LIKE '%옥천면%' THEN '옥천면'
               WHEN f.address LIKE '%지평면%' THEN '지평면'
               WHEN f.address LIKE '%단월면%' THEN '단월면'
               WHEN f.address LIKE '%개군면%' THEN '개군면'
               WHEN f.address LIKE '%양동면%' THEN '양동면'
               WHEN f.address LIKE '%서종면%' THEN '서종면'
               WHEN f.address LIKE '%산북면%' THEN '산북면'
               ELSE '기타' END, '기타')
        """;

    @Override
    public com.farmbalance.gov.domain.model.GovUserInfo getGovUserInfo(Long userId) {
        String sql = "SELECT id, name, role, region FROM users WHERE id = ? AND deleted_at IS NULL";
        List<Map<String, Object>> result = jdbc.queryForList(sql, userId);
        if (result.isEmpty()) return null;
        Map<String, Object> row = result.get(0);
        return new com.farmbalance.gov.domain.model.GovUserInfo(
            ((Number) row.get("id")).longValue(),
            (String) row.get("name"),
            (String) row.get("role"),
            (String) row.get("region")
        );
    }

    @Override
    public List<Map<String, Object>> queryCultivation(LocalDate startDate, LocalDate endDate, String govRegion, String town) {
        String townFilter = buildTownFilter(town);
        String regionFilter = (govRegion != null) ? " AND f.address LIKE '%" + govRegion + "%' " : "";
        String sql = """
            SELECT %s AS "읍면",
                   f.name AS "농가명",
                   c.name AS "작물명",
                   COALESCE(f.area_size, 0) AS "재배면적㎡",
                   COALESCE(sr.estimated_yield, 0) AS "예상생산량kg",
                   TO_CHAR(sr.created_at, 'YYYY-MM-DD') AS "등록일"
            FROM seed_registrations sr
            JOIN farms f ON f.id = sr.farm_id
            JOIN crops c ON c.id = sr.crop_id
            WHERE sr.created_at BETWEEN ? AND ?
              AND sr.deleted_at IS NULL AND f.deleted_at IS NULL
              %s
              %s
            ORDER BY sr.created_at DESC
            """.formatted(TOWN_CASE, townFilter, regionFilter);
        return jdbc.queryForList(sql, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
    }

    @Override
    public List<Map<String, Object>> queryBalance(LocalDate startDate, LocalDate endDate, String govRegion, String town) {
        // 임시 매핑
        String regionCode = "가평군".equals(govRegion) ? "4182000000" : "4183000000";
        String sql = """
            SELECT c.name AS "작물명",
                   bd.region_code AS "지역",
                   COALESCE(bd.supply_ratio, 0) AS "공급률",
                   CASE WHEN bd.balance_status LIKE 'EXCESS%' THEN '과잉'
                        WHEN bd.balance_status LIKE 'SHORT%' THEN '부족'
                        ELSE '균형' END AS "상태",
                   CASE WHEN bd.balance_status LIKE '%WARN' THEN '긴급'
                        WHEN bd.balance_status LIKE '%CAUTION' THEN '주의'
                        ELSE '정상' END AS "경고수준",
                   CASE bd.balance_status
                        WHEN 'EXCESS_WARN' THEN '출하 분산 / 저장 권고'
                        WHEN 'EXCESS_CAUTION' THEN '재배 면적 축소 안내'
                        WHEN 'SHORT_WARN' THEN '재배 확대 권장 / 보조금 안내'
                        WHEN 'SHORT_CAUTION' THEN '재배 농가 추가 모집'
                        ELSE '-' END AS "권고사항"
            FROM balance_data bd
            JOIN crops c ON c.id = bd.crop_id
            WHERE bd.year BETWEEN EXTRACT(YEAR FROM ?::date)::int AND EXTRACT(YEAR FROM ?::date)::int
              AND bd.deleted_at IS NULL
              AND bd.region_code = ?
            ORDER BY ABS(bd.supply_ratio - 100) DESC
            """;
        return jdbc.queryForList(sql, startDate, endDate, regionCode);
    }

    @Override
    public List<Map<String, Object>> querySales(LocalDate startDate, LocalDate endDate, String govRegion, String town) {
        String regionFilter = (govRegion != null) ? " AND f.address LIKE '%" + govRegion + "%' " : "";
        String sql = """
            SELECT TO_CHAR(o.created_at, 'YYYY-MM-DD') AS "주문일",
                   p.name AS "상품명",
                   u.name AS "판매자",
                   oi.quantity AS "판매량",
                   oi.unit_price AS "단가",
                   oi.subtotal AS "매출액"
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            JOIN users u ON u.id = p.seller_id
            LEFT JOIN farms f ON f.user_id = u.id
            WHERE o.created_at BETWEEN ? AND ?
              AND o.status <> 'CANCELLED'
              AND o.deleted_at IS NULL
              %s
            ORDER BY o.created_at DESC
            """.formatted(regionFilter);
        return jdbc.queryForList(sql, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
    }

    @Override
    public List<Map<String, Object>> queryFarms(LocalDate startDate, LocalDate endDate, String govRegion, String town) {
        String townFilter = buildTownFilter(town);
        String regionFilter = (govRegion != null) ? " AND f.address LIKE '%" + govRegion + "%' " : "";
        String sql = """
            SELECT f.name AS "농가명",
                   u.name AS "대표자",
                   %s AS "읍면",
                   COALESCE(f.area_size, 0) AS "면적㎡",
                   COALESCE(STRING_AGG(DISTINCT c.name, ', '), '-') AS "주요작물",
                   f.status AS "승인상태"
            FROM farms f
            JOIN users u ON u.id = f.user_id
            LEFT JOIN seed_registrations sr ON sr.farm_id = f.id AND sr.deleted_at IS NULL
            LEFT JOIN crops c ON c.id = sr.crop_id
            WHERE f.created_at BETWEEN ? AND ?
              AND f.deleted_at IS NULL
              %s
              %s
            GROUP BY f.id, f.name, u.name, f.address, f.area_size, f.status
            ORDER BY f.name
            """.formatted(TOWN_CASE, townFilter, regionFilter);
        return jdbc.queryForList(sql, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
    }

    /** 읍면 필터 SQL 조건 생성 ("ALL"이면 빈 문자열) */
    private String buildTownFilter(String town) {
        if (town == null || town.isBlank() || "ALL".equalsIgnoreCase(town) || "전체".equals(town)) {
            return "";
        }
        // SQL Injection 방어: 허용 읍면 목록만 허용
        return switch (town) {
            case "양평읍", "용문면", "강하면", "청운면", "양서면", "옥천면",
                 "지평면", "단월면", "개군면", "양동면", "서종면", "산북면"
                -> "AND f.address LIKE '%%" + town + "%%'";
            default -> "";
        };
    }
}
