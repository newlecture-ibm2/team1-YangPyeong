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

import com.farmbalance.farm.application.port.out.UpdateCultivationStatePort;
import com.farmbalance.farm.domain.CultivationStatus;

@Component
@RequiredArgsConstructor
public class CultivationRegistrationPersistenceAdapter implements SaveCultivationRegistrationPort, LoadCultivationRegistrationPort, UpdateCultivationStatePort {

    private final CultivationRegistrationRepository repository;

    @Override
    public CultivationRegistration saveCultivation(CultivationRegistration domain) {
        CultivationRegistrationJpaEntity entity = CultivationRegistrationJpaEntity.builder()
                .id(domain.getId())
                .farmId(domain.getFarmId())
                .cropId(domain.getCropId())
                .cultivationArea(domain.getCultivationArea())
                .farmerEstimatedYield(domain.getFarmerEstimatedYield())
                .yieldUnit(domain.getYieldUnit())
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

    @Override
    public void updateStatus(Long cultivationRegistrationId, CultivationStatus status) {
        repository.updateStatus(cultivationRegistrationId, status);
    }

    private CultivationRegistration mapToDomain(CultivationRegistrationJpaEntity entity) {
        return CultivationRegistration.builder()
                .id(entity.getId())
                .farmId(entity.getFarmId())
                .cropId(entity.getCropId())
                .cultivationArea(entity.getCultivationArea())
                .farmerEstimatedYield(entity.getFarmerEstimatedYield())
                .yieldUnit(entity.getYieldUnit())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
