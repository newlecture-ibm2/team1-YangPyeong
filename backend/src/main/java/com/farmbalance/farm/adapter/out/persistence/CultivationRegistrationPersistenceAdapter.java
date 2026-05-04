package com.farmbalance.farm.adapter.out.persistence;

import com.farmbalance.farm.adapter.out.persistence.entity.CultivationRegistrationJpaEntity;
import com.farmbalance.farm.adapter.out.persistence.repository.CultivationRegistrationRepository;
import com.farmbalance.farm.application.port.out.LoadCultivationRegistrationPort;
import com.farmbalance.farm.application.port.out.SaveCultivationRegistrationPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CultivationRegistrationPersistenceAdapter implements SaveCultivationRegistrationPort, LoadCultivationRegistrationPort {

    private final CultivationRegistrationRepository repository;

    @Override
    public CultivationRegistration saveCultivation(CultivationRegistration domain) {
        CultivationRegistrationJpaEntity entity = CultivationRegistrationJpaEntity.builder()
                .id(domain.getId())
                .farmId(domain.getFarmId())
                .cropId(domain.getCropId())
                .cultivationType(domain.getCultivationType())
                .cultivationArea(domain.getCultivationArea())
                .farmerEstimatedYield(domain.getFarmerEstimatedYield())
                .aiPredictedYield(domain.getAiPredictedYield())
                .yieldUnit(domain.getYieldUnit())
                .verified(domain.getVerified() != null ? domain.getVerified() : false)
                .build();
        CultivationRegistrationJpaEntity savedEntity = repository.save(entity);
        return mapToDomain(savedEntity);
    }

    @Override
    public Optional<CultivationRegistration> loadCultivation(Long id) {
        return repository.findById(id).map(this::mapToDomain);
    }

    @Override
    public List<CultivationRegistration> loadCultivationsByFarmId(Long farmId) {
        return repository.findByFarmId(farmId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    private CultivationRegistration mapToDomain(CultivationRegistrationJpaEntity entity) {
        return CultivationRegistration.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .cropId(entity.getCropId())
                .cultivationType(entity.getCultivationType())
                .cultivationArea(entity.getCultivationArea())
                .farmerEstimatedYield(entity.getFarmerEstimatedYield())
                .aiPredictedYield(entity.getAiPredictedYield())
                .yieldUnit(entity.getYieldUnit())
                .verified(entity.getVerified())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
