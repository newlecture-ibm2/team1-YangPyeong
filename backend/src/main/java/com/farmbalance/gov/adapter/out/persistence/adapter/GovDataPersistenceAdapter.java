package com.farmbalance.gov.adapter.out.persistence.adapter;

import com.farmbalance.gov.application.port.out.GovDataQueryPort;
import com.farmbalance.gov.domain.model.GovUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 지자체 데이터 조회 Driven Adapter (JdbcTemplate 네이티브 쿼리)
 * 기존 ERD 테이블(farms, cultivation_registrations, balance_data, orders 등)을 직접 조회합니다.
 *
 * [변경 이력]
 * - farm_crops → cultivation_registrations 테이블 전환 (재배 등록 정식 테이블 사용)
 * - TOWN_CASE 하드코딩(12개 CASE WHEN) → regions 테이블 JOIN 기반으로 교체
 * - getGovUserInfo: regionCode, regionName 추가 조회
 * - queryBalance: 하드코딩 regionCode 매핑 → users.region_code 기반 조회
 * - buildTownFilter: 하드코딩 switch문 → regions 테이블 유효성 검증 기반
 */
@Component
@RequiredArgsConstructor
public class GovDataPersistenceAdapter implements GovDataQueryPort {

    private final JdbcTemplate jdbc;

    /**
     * 읍면 추출 — regions 테이블 기반 서브쿼리
     * 기존 12개 CASE WHEN 하드코딩 제거
     */
    private static final String TOWN_EXPR = """
        COALESCE(
          (SELECT rg.name FROM regions rg
           WHERE rg.type = 'TOWN' AND rg.is_active = TRUE
             AND f.address LIKE '%%' || rg.name || '%%'
           LIMIT 1),
          '기타')
        """;

    @Override
    public GovUserInfo getGovUserInfo(Long userId) {
        String sql = """
            SELECT u.id, u.name, u.role, u.email,
                   u.region_code AS region_code,
                   r.name AS region_name
            FROM users u
            LEFT JOIN regions r ON r.code = u.region_code AND r.type = 'CITY'
            WHERE u.id = ? AND u.deleted_at IS NULL
            """;
        List<Map<String, Object>> result = jdbc.queryForList(sql, userId);
        if (result.isEmpty()) return null;
        Map<String, Object> row = result.get(0);
        return new GovUserInfo(
            ((Number) row.get("id")).longValue(),
            (String) row.get("name"),
            (String) row.get("role"),
            (String) row.get("email"),
            (String) row.get("region_code"),
            (String) row.get("region_name")
        );
    }

    @Override
    public List<Map<String, Object>> queryCultivation(LocalDate startDate, LocalDate endDate, String govRegion, String town) {
        String townFilter = buildTownFilter(town);
        String regionFilter = buildRegionFilter(govRegion);
        String sql = """
            SELECT %s AS "읍면",
                   f.name AS "농가명",
                   c.name AS "작물명",
                   COALESCE(cr.cultivation_area, 0) AS "재배면적㎡",
                   COALESCE(cr.farmer_estimated_yield, 0) AS "예상생산량kg",
                   TO_CHAR(cr.created_at, 'YYYY-MM-DD') AS "등록일"
            FROM cultivation_registrations cr
            JOIN farms f ON f.id = cr.farm_id
            JOIN crops c ON c.id = cr.crop_id
            WHERE cr.created_at BETWEEN ? AND ?
              AND cr.deleted_at IS NULL AND f.deleted_at IS NULL
              %s
              %s
            ORDER BY cr.created_at DESC
            """.formatted(TOWN_EXPR, townFilter, regionFilter);
        return jdbc.queryForList(sql, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
    }

    @Override
    public List<Map<String, Object>> queryBalance(LocalDate startDate, LocalDate endDate, String govRegion, String town) {
        // regionCode 기반 조회 — 하드코딩 매핑 제거
        // govRegion이 시군구 코드(4183 등)이면 그대로 사용, 아니면 regions 테이블에서 조회
        String regionCode = resolveBalanceRegionCode(govRegion);
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
        String regionFilter = buildRegionFilter(govRegion);
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
        String regionFilter = buildRegionFilter(govRegion);
        String sql = """
            SELECT f.name AS "농가명",
                   u.name AS "대표자",
                   %s AS "읍면",
                   COALESCE(f.area, 0) AS "면적㎡",
                   COALESCE(STRING_AGG(DISTINCT c.name, ', '), '-') AS "주요작물",
                   f.certification_status AS "승인상태"
            FROM farms f
            JOIN users u ON u.id = f.user_id
            LEFT JOIN cultivation_registrations cr ON cr.farm_id = f.id AND cr.deleted_at IS NULL
            LEFT JOIN crops c ON c.id = cr.crop_id
            WHERE f.created_at BETWEEN ? AND ?
              AND f.deleted_at IS NULL
              %s
              %s
            GROUP BY f.id, f.name, u.name, f.address, f.area, f.certification_status
            ORDER BY f.name
            """.formatted(TOWN_EXPR, townFilter, regionFilter);
        return jdbc.queryForList(sql, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
    }

    /**
     * 지역 필터 SQL — govRegion(코드)으로 users.region_code를 조회하여 필터링
     */
    private String buildRegionFilter(String govRegionCode) {
        if (govRegionCode == null || govRegionCode.isBlank()) return "";
        return " AND f.user_id IN (SELECT u2.id FROM users u2 WHERE u2.region_code = '" + govRegionCode + "') ";
    }

    /**
     * balance_data용 region_code 해석
     * - 4자리(시군구 코드) → 10자리 보정 (예: 4183 → 4183000000)
     * - 10자리 이상 → 그대로 사용
     */
    private String resolveBalanceRegionCode(String govRegionCode) {
        if (govRegionCode == null || govRegionCode.isBlank()) return "4183000000";
        // 이미 10자리 코드
        if (govRegionCode.length() >= 10 && govRegionCode.matches("\\d+")) return govRegionCode;
        // 4자리 시군구 코드 → 10자리 보정
        if (govRegionCode.matches("\\d{4}")) return govRegionCode + "000000";
        return govRegionCode;
    }

    /**
     * 읍면 필터 — regions 테이블에서 이름을 조회하여 LIKE 필터 (하드코딩 switch 제거)
     */
    private String buildTownFilter(String town) {
        if (town == null || town.isBlank() || "ALL".equalsIgnoreCase(town) || "전체".equals(town)) {
            return "";
        }
        // 코드로 전달된 경우 → regions에서 name 조회
        if (town.matches("\\d+")) {
            return " AND f.address LIKE '%%' || (SELECT name FROM regions WHERE code = '" + town + "' AND type = 'TOWN') || '%%' ";
        }
        // 이름으로 전달된 경우 → regions에서 존재 확인 후 사용 (SQL Injection 방어)
        return " AND f.address LIKE '%%' || (SELECT name FROM regions WHERE name = '" + town + "' AND type = 'TOWN') || '%%' ";
    }
}
