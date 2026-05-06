package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.*;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveCultivationPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.event.CultivationDeletedEvent;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 재배 관리 서비스 (Application Service)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CultivationService implements RegisterCultivationUseCase, UpdateCultivationUseCase, DeleteCultivationUseCase, LoadCultivationUseCase {

    private final SaveCultivationPort saveCultivationPort;
    private final LoadFarmPort loadFarmPort;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public CultivationRegistration registerCultivation(RegisterCultivationCommand command) {
        // 1. 도메인 객체 생성
        CultivationRegistration registration = CultivationRegistration.builder()
                .farmId(command.getFarmId())
                .cropId(command.getCropId())
                .cultivationArea(command.getCultivationArea())
                .farmerEstimatedYield(command.getExpectedYield())
                .yieldUnit(command.getYieldUnit() != null ? command.getYieldUnit() : "kg")
                .build();

        // 2. 저장
        CultivationRegistration saved = saveCultivationPort.addCultivationRegistration(registration);

        // 3. 히스토리 자동 생성 이벤트 발행
        eventPublisher.publishEvent(new CultivationRegisteredEvent(
                saved.getId(),
                command.getFarmId(),
                command.getCropId(),
                command.getCultivationArea()
        ));

        return saved;
    }

    @Override
    public CultivationRegistration updateCultivation(UpdateCultivationCommand command) {
        CultivationRegistration registration = CultivationRegistration.builder()
                .id(command.getId())
                .cropId(command.getCropId())
                .cultivationArea(command.getCultivationArea())
                .farmerEstimatedYield(command.getExpectedYield())
                .yieldUnit(command.getYieldUnit() != null ? command.getYieldUnit() : "kg")
                .build();

        saveCultivationPort.updateCultivationRegistration(registration);
        
        return registration;
    }

    @Override
    public void deleteCultivation(Long id) {
        // 이벤트를 위해 미리 정보 로드
        loadFarmPort.loadCultivationById(id).ifPresent(cult -> {
            saveCultivationPort.deleteCultivationRegistration(id);
            // 삭제 이벤트 발행
            eventPublisher.publishEvent(new CultivationDeletedEvent(id, cult.getFarmId()));
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<CultivationRegistration> getCultivationsByFarmId(Long farmId) {
        // LoadFarmPort를 통해 농장별 재배 목록 조회
        return loadFarmPort.loadCultivationsByFarmId(farmId);
    }
}
