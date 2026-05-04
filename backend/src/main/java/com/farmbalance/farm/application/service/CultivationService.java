package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.LoadCultivationUseCase;
import com.farmbalance.farm.application.port.in.RegisterCultivationCommand;
import com.farmbalance.farm.application.port.in.RegisterCultivationUseCase;
import com.farmbalance.farm.application.port.out.LoadCultivationRegistrationPort;
import com.farmbalance.farm.application.port.out.SaveCultivationRegistrationPort;
import com.farmbalance.farm.domain.CultivationRegistration;
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
public class CultivationService implements RegisterCultivationUseCase, LoadCultivationUseCase {

    private final SaveCultivationRegistrationPort savePort;
    private final LoadCultivationRegistrationPort loadPort;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public CultivationRegistration registerCultivation(RegisterCultivationCommand command) {
        // 1. 도메인 객체 생성
        CultivationRegistration cultivation = CultivationRegistration.builder()
                .farmId(command.getFarmId())
                .cropId(command.getCropId())
                .cultivationType(command.getCultivationType())
                .cultivationArea(command.getCultivationArea())
                .farmerEstimatedYield(command.getFarmerEstimatedYield())
                .yieldUnit(command.getYieldUnit())
                .verified(false)
                .build();

        // 2. 저장 (Output Port 호출)
        CultivationRegistration savedCultivation = savePort.saveCultivation(cultivation);

        // 3. 이벤트 발행 (AI 예측 및 수급 반영 트리거)
        eventPublisher.publishEvent(new CultivationRegisteredEvent(
                savedCultivation.getId(),
                savedCultivation.getFarmId(),
                savedCultivation.getCropId(),
                savedCultivation.getCultivationArea(),
                savedCultivation.getCultivationType()
        ));

        return savedCultivation;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CultivationRegistration> getCultivationsByFarmId(Long farmId) {
        return loadPort.loadCultivationsByFarmId(farmId);
    }
}
