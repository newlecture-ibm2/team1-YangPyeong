package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.ModifyCultivationCommand;
import com.farmbalance.farm.application.port.in.ModifyCultivationUseCase;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveCultivationPort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ModifyCultivationService implements ModifyCultivationUseCase {

    private final LoadFarmPort loadFarmPort;
    private final SaveCultivationPort saveCultivationPort;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    public void modify(ModifyCultivationCommand command) {
        // 1. 도메인 객체 조회
        CultivationRegistration cultivation = loadFarmPort.loadCultivationById(command.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        // 1-1. 변경 전 정보 캡처 (이벤트용)
        String oldCropName = cultivation.getCropName();

        // 2. 도메인 비즈니스 로직 실행 (스스로 검증하고 데이터 변경)
        cultivation.updatePlan(
                command.getArea(), 
                command.getYield(), 
                command.getUnit()
        );

        // 3. 변경된 도메인 객체를 영속성 계층에 반영
        saveCultivationPort.updateCultivationRegistration(cultivation);

        // 4. 공통 변경 이벤트 발행 (수급 밸런스, AI 정책, 예측 리포트 트리거용)
        eventPublisher.publishEvent(new com.farmbalance.farm.domain.event.CultivationChangedEvent(
                cultivation.getId(),
                cultivation.getCropName(),
                oldCropName,
                "UPDATED",
                java.time.LocalDateTime.now()
        ));

        // 5. 기존 수정 완료 이벤트 발행 (히스토리 자동 생성을 위해 - 하위 호환성 유지)
        eventPublisher.publishEvent(new com.farmbalance.farm.domain.event.CultivationUpdatedEvent(
                cultivation.getId(),
                cultivation.getFarmId(),
                cultivation.getCropId(),
                cultivation.getCultivationArea(),
                cultivation.getFarmerEstimatedYield(),
                cultivation.getYieldUnit()
        ));
    }
}
