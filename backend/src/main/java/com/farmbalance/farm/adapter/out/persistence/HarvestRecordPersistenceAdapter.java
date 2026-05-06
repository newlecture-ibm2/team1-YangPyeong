package com.farmbalance.farm.adapter.out.persistence;

import com.farmbalance.farm.adapter.out.persistence.entity.HarvestRecordJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.repository.HarvestRecordJpaRepository;
import com.farmbalance.farm.application.port.out.LoadHarvestRecordPort;
import com.farmbalance.farm.application.port.out.SaveHarvestRecordPort;
import com.farmbalance.farm.domain.HarvestRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 수확 이력 Persistence Adapter
 */
@Component
@RequiredArgsConstructor
public class HarvestRecordPersistenceAdapter implements SaveHarvestRecordPort, LoadHarvestRecordPort {

    private final HarvestRecordJpaRepository repository;

    @Override
    public HarvestRecord saveHarvestRecord(HarvestRecord harvestRecord) {
        HarvestRecordJpaEntity entity = HarvestRecordJpaEntity.builder()
                .cultivationRegistrationId(harvestRecord.getCultivationRegistrationId())
                .harvestDate(harvestRecord.getHarvestDate())
                .yieldAmount(BigDecimal.valueOf(harvestRecord.getYieldAmount()))
                .yieldUnit(harvestRecord.getYieldUnit())
                .grade(harvestRecord.getGrade())
                .toShop(harvestRecord.getToShop())
                .build();

        HarvestRecordJpaEntity saved = repository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public List<HarvestRecord> loadByCultivationRegistrationId(Long cultivationRegistrationId) {
        return repository.findByCultivationRegistrationIdOrderByHarvestDateDesc(cultivationRegistrationId)
                .stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    private HarvestRecord mapToDomain(HarvestRecordJpaEntity entity) {
        return HarvestRecord.builder()
                .id(entity.getId())
                .cultivationRegistrationId(entity.getCultivationRegistrationId())
                .harvestDate(entity.getHarvestDate())
                .yieldAmount(entity.getYieldAmount() != null ? entity.getYieldAmount().doubleValue() : null)
                .yieldUnit(entity.getYieldUnit())
                .grade(entity.getGrade())
                .toShop(entity.getToShop())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
