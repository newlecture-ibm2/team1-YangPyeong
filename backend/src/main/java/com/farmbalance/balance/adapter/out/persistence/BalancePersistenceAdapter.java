package com.farmbalance.balance.adapter.out.persistence;

import com.farmbalance.balance.adapter.out.persistence.entity.CropProductionStatsJpaEntity;
import com.farmbalance.balance.adapter.out.persistence.repository.CropProductionStatsJpaRepository;
import com.farmbalance.balance.application.port.out.LoadCropStatsPort;
import com.farmbalance.balance.application.port.out.LoadFarmSupplyPort;
import com.farmbalance.balance.domain.CropProductionStats;
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
    public Double sumEstimatedYieldByCropName(String cropName) {
        String sql = "SELECT COALESCE(SUM(cr.farmer_estimated_yield), 0.0) " +
                     "FROM cultivation_registrations cr " +
                     "JOIN crops c ON cr.crop_id = c.id " +
                     "WHERE c.name = ? AND cr.deleted_at IS NULL AND cr.status = 'ACTIVE'";
        return jdbcTemplate.queryForObject(sql, Double.class, cropName);
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
}
