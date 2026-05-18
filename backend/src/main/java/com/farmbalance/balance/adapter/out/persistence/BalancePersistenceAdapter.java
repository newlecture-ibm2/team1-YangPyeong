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

import java.util.Optional;

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
    public java.util.List<String> loadAllCropNames() {
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
    public java.util.Map<String, Double> sumAllEstimatedYields() {
        String sql = "SELECT c.name, COALESCE(SUM(CASE WHEN cr.yield_unit = '" + YieldUnit.TON.getLabel() + "' THEN cr.farmer_estimated_yield * 1000 ELSE cr.farmer_estimated_yield END), 0.0) " +
                     "FROM cultivation_registrations cr " +
                     "JOIN crops c ON cr.crop_id = c.id " +
                     "WHERE cr.deleted_at IS NULL AND cr.status = 'ACTIVE' " +
                     "GROUP BY c.name";
        
        java.util.Map<String, Double> results = new java.util.HashMap<>();
        jdbcTemplate.query(sql, (rs) -> {
            results.put(rs.getString("name"), rs.getDouble(2));
        });
        return results;
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
    public java.util.List<CropProductionStats> loadHistoricalStats(String itmNm, String regionCode) {
        return repository.findAllByItmNmAndRegionCodeAndDeletedAtIsNullOrderByYearAsc(itmNm, regionCode)
                .stream()
                .map(this::mapToDomain)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public java.util.List<CropProductionStats> loadAllLatestCropStats(String regionCode) {
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
}
