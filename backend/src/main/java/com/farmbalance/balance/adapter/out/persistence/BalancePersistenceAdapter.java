package com.farmbalance.balance.adapter.out.persistence;

import com.farmbalance.balance.adapter.out.persistence.entity.CropProductionStatsJpaEntity;
import com.farmbalance.balance.adapter.out.persistence.repository.CropProductionStatsJpaRepository;
import com.farmbalance.balance.application.port.out.LoadCropStatsPort;
import com.farmbalance.balance.application.port.out.LoadFarmSupplyPort;
import com.farmbalance.balance.domain.CropProductionStats;
import com.farmbalance.balance.domain.YieldUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BalancePersistenceAdapter implements LoadCropStatsPort, LoadFarmSupplyPort {

    private final CropProductionStatsJpaRepository repository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<CropProductionStats> loadCropStats(String itmNm, Integer year, String regionCode) {
        return repository.findByItmNmAndYearAndRegionCodeAndDeletedAtIsNull(itmNm, year, regionCode)
                .map(this::mapToDomain);
    }

    @Override
    public Optional<CropProductionStats> loadCropStats(String itmNm, Integer year) {
        return repository.findByItmNmAndYearAndDeletedAtIsNull(itmNm, year)
                .map(this::mapToDomain);
    }

    @Override
    public Optional<CropProductionStats> loadLatestCropStats(String itmNm, String regionCode) {
        return repository.findFirstByItmNmAndRegionCodeAndDeletedAtIsNullOrderByYearDesc(itmNm, regionCode)
                .map(this::mapToDomain);
    }

    @Override
    public Optional<CropProductionStats> loadLatestCropStats(String itmNm) {
        return repository.findFirstByItmNmAndDeletedAtIsNullOrderByYearDesc(itmNm)
                .map(this::mapToDomain);
    }

    @Override
    public List<String> loadAllCropNames() {
        return repository.findDistinctItmNm();
    }

    @Override
    public Double sumEstimatedYieldByCropName(String cropName) {
        String sql = "SELECT COALESCE(SUM(CASE WHEN cr.yield_unit = '" + YieldUnit.TON.getLabel() + "' THEN cr.farmer_estimated_yield * 1000 ELSE cr.farmer_estimated_yield END), 0.0) " +
                     "FROM cultivation_registrations cr " +
                     "JOIN crops c ON cr.crop_id = c.id " +
                     "WHERE c.name = ? AND cr.deleted_at IS NULL AND cr.status = 'ACTIVE'";
        return jdbcTemplate.queryForObject(sql, Double.class, cropName);
    }

    @Override
    public Map<String, Double> sumAllEstimatedYields() {
        String sql = "SELECT c.name, COALESCE(SUM(CASE WHEN cr.yield_unit = '" + YieldUnit.TON.getLabel() + "' THEN cr.farmer_estimated_yield * 1000 ELSE cr.farmer_estimated_yield END), 0.0) " +
                     "FROM cultivation_registrations cr " +
                     "JOIN crops c ON cr.crop_id = c.id " +
                     "WHERE cr.deleted_at IS NULL AND cr.status = 'ACTIVE' " +
                     "GROUP BY c.name";
        
        Map<String, Double> results = new HashMap<>();
        jdbcTemplate.query(sql, (rs) -> {
            results.put(rs.getString("name"), rs.getDouble(2));
        });
        return results;
    }

    // 실제 10자리 법정동 코드와 regions의 7자리 간략 코드를 정밀 1대1 매핑하여 보정해주는 SQL 식
    private static final String TOWN_CODE_EXPR =
        "CASE " +
        "    WHEN LENGTH(f.bjd_code) = 7 THEN f.bjd_code " +
        "    WHEN LENGTH(f.bjd_code) >= 8 AND SUBSTRING(f.bjd_code, 1, 5) = '41830' THEN " +
        "        CASE SUBSTRING(f.bjd_code, 6, 2) " +
        "            WHEN '25' THEN '4183010' " + // 양평읍
        "            WHEN '31' THEN '4183020' " + // 강상면
        "            WHEN '32' THEN '4183030' " + // 강하면
        "            WHEN '33' THEN '4183040' " + // 양서면
        "            WHEN '34' THEN '4183050' " + // 옥천면
        "            WHEN '35' THEN '4183060' " + // 서종면
        "            WHEN '36' THEN '4183070' " + // 단월면
        "            WHEN '37' THEN '4183080' " + // 청운면
        "            WHEN '38' THEN '4183090' " + // 양동면
        "            WHEN '39' THEN '4183100' " + // 지평면
        "            WHEN '40' THEN '4183110' " + // 용문면
        "            WHEN '41' THEN '4183120' " + // 개군면
        "            ELSE SUBSTRING(f.bjd_code, 1, 7) " +
        "        END " +
        "    ELSE SUBSTRING(f.bjd_code, 1, 7) " +
        "END";

    /**
     * 읍면동(7자리 간략 코드) 기반 작물별 예상 수확량(kg) 합계 조회.
     * farms.bjd_code에 실제 10자리 법정동 코드가 섞여 있어도 보정식으로 정확히 매핑하여 집계합니다.
     */
    @Override
    public Map<String, Double> sumEstimatedYieldsByTownCode(String townCode) {
        String sql =
            "SELECT c.name, COALESCE(SUM(CASE " +
            "    WHEN cr.yield_unit = '톤' OR cr.yield_unit = 'TON' THEN cr.farmer_estimated_yield * 1000 " +
            "    ELSE cr.farmer_estimated_yield " +
            "END), 0.0) as total_yield " +
            "FROM cultivation_registrations cr " +
            "JOIN farms f ON cr.farm_id = f.id " +
            "JOIN crops c ON cr.crop_id = c.id " +
            "WHERE " + TOWN_CODE_EXPR + " = ? " +
            "  AND cr.deleted_at IS NULL " +
            "  AND cr.status = 'ACTIVE' " +
            "GROUP BY c.name";

        Map<String, Double> results = new HashMap<>();
        jdbcTemplate.query(sql, (rs) -> {
            results.put(rs.getString("name"), rs.getDouble("total_yield"));
        }, townCode);
        return results;
    }

    /**
     * 특정 읍면동 범위 내에서 ACTIVE 재배 등록을 보유한 고유 농가 수를 조회합니다.
     */
    @Override
    public int countFarmsByTownCode(String townCode) {
        String sql =
            "SELECT COUNT(DISTINCT f.id) " +
            "FROM farms f " +
            "JOIN cultivation_registrations cr ON cr.farm_id = f.id " +
            "WHERE " + TOWN_CODE_EXPR + " = ? " +
            "  AND cr.deleted_at IS NULL " +
            "  AND cr.status = 'ACTIVE'";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, townCode);
        return count != null ? count : 0;
    }

    /**
     * 유저가 소유한 농장들의 읍면동(7자리) 코드와 지역명을 조회합니다.
     * 실제 10자리 코드가 등록되어 있어도 regions 마스터 테이블과 오차 없이 1:1 조인합니다.
     */
    @Override
    public List<String[]> findTownsByUserId(Long userId) {
        String sql =
            "SELECT DISTINCT " + TOWN_CODE_EXPR + " as town_code, " +
            "       COALESCE(r.name, '알 수 없음') as town_name " +
            "FROM farms f " +
            "LEFT JOIN regions r ON r.code = " + TOWN_CODE_EXPR + " AND r.type = 'TOWN' " +
            "WHERE f.user_id = ? " +
            "  AND f.deleted_at IS NULL " +
            "  AND f.bjd_code IS NOT NULL " +
            "ORDER BY town_name";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new String[]{
            rs.getString("town_code"),
            rs.getString("town_name")
        }, userId);
    }

    private CropProductionStats mapToDomain(CropProductionStatsJpaEntity entity) {
        return CropProductionStats.builder()
                .id(entity.getId())
                .itmNm(entity.getItmNm())
                .regionCode(entity.getRegionCode())
                .regionName(entity.getRegionName())
                .year(entity.getYear())
                .cultivatedArea(entity.getCultivatedArea())
                .yieldPer10a(entity.getYieldPer10a())
                .totalProduction(entity.getTotalProduction())
                .unitNm(entity.getUnitNm())
                .build();
    }

    @Override
    public List<CropProductionStats> loadHistoricalStats(String itmNm, String regionCode) {
        return repository.findAllByItmNmAndRegionCodeAndDeletedAtIsNullOrderByYearAsc(itmNm, regionCode)
                .stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<CropProductionStats> loadAllLatestCropStats(String regionCode) {
        // 각 작물별로 가장 최신 연도의 데이터만 가져오는 쿼리
        String sql = "SELECT * FROM crop_production_stats s1 " +
                     "WHERE s1.region_code = ? AND s1.deleted_at IS NULL " +
                     "AND s1.year = (SELECT MAX(year) FROM crop_production_stats s2 WHERE s2.itm_nm = s1.itm_nm AND s2.region_code = s1.region_code AND s2.deleted_at IS NULL)";
        
        return jdbcTemplate.query(sql, (rs, rowNum) -> CropProductionStats.builder()
                .id(rs.getLong("id"))
                .itmNm(rs.getString("itm_nm"))
                .regionCode(rs.getString("region_code"))
                .regionName(rs.getString("region_name"))
                .year(rs.getInt("year"))
                .cultivatedArea(rs.getBigDecimal("cultivated_area"))
                .yieldPer10a(rs.getBigDecimal("yield_per_10a"))
                .totalProduction(rs.getBigDecimal("total_production"))
                .unitNm(rs.getString("unit_nm"))
                .build(), regionCode);
    }

    @Override
    public long countAllFarms() {
        String sql = "SELECT COUNT(*) FROM farms WHERE deleted_at IS NULL";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public long countAllPolicies() {
        String sql = "SELECT COUNT(*) FROM policies WHERE deleted_at IS NULL";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public long countActiveUsers() {
        String sql = "SELECT COUNT(*) FROM users WHERE anonymized_at IS NULL";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public long countTotalRecommends() {
        String sql = "SELECT COUNT(*) FROM recommend_history";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public long countTotalOrders() {
        String sql = "SELECT COUNT(*) FROM orders";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }
}

