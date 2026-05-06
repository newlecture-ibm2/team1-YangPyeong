package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.DeleteCultivationUseCase;
import com.farmbalance.farm.application.port.in.RegisterCultivationCommand;
import com.farmbalance.farm.application.port.in.RegisterCultivationUseCase;
import com.farmbalance.farm.application.port.in.UpdateCultivationCommand;
import com.farmbalance.farm.application.port.in.UpdateCultivationUseCase;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveCultivationPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.event.CultivationDeletedEvent;
import com.farmbalance.farm.domain.event.CultivationRegisteredEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 재배 등록 서비스 (기존 농장에 작물 재배 정보 추가)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CultivationService implements RegisterCultivationUseCase, UpdateCultivationUseCase, DeleteCultivationUseCase {

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
}
