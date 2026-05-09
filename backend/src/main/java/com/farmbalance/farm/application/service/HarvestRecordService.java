package com.farmbalance.farm.application.service;

import com.farmbalance.farm.application.port.in.LoadHarvestUseCase;
import com.farmbalance.farm.application.port.in.RecordHarvestCommand;
import com.farmbalance.farm.application.port.in.RecordHarvestUseCase;
import com.farmbalance.farm.application.port.out.LoadHarvestRecordPort;
import com.farmbalance.farm.application.port.out.SaveHarvestRecordPort;
import com.farmbalance.farm.domain.HarvestRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.context.ApplicationEventPublisher;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.UpdateCultivationStatePort;
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.CultivationStatus;
import com.farmbalance.farm.domain.event.HarvestRecordedEvent;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;

import java.util.List;

/**
 * 수확 이력 서비스 (UseCase 구현체)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class HarvestRecordService implements RecordHarvestUseCase, LoadHarvestUseCase {

    private final SaveHarvestRecordPort saveHarvestRecordPort;
    private final LoadHarvestRecordPort loadHarvestRecordPort;
    private final LoadFarmPort loadFarmPort;
    private final UpdateCultivationStatePort updateCultivationStatePort;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public HarvestRecord recordHarvest(RecordHarvestCommand command) {
        // 1. 재배 정보 조회 및 중복 검증
        CultivationRegistration registration = loadFarmPort.loadCultivationById(command.getCultivationRegistrationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        if (registration.isCompleted()) {
            throw new BusinessException(ErrorCode.ALREADY_HARVESTED);
        }

        // 2. 수확 실적 생성 (도메인 검증 포함) 및 저장
        HarvestRecord harvestRecord = HarvestRecord.create(
                command.getCultivationRegistrationId(),
                command.getYieldAmount(),
                command.getHarvestDate(),
                command.getYieldUnit(),
                command.getGrade(),
                command.getToShop(),
                registration.getFarmerEstimatedYield()
        );

        HarvestRecord saved = saveHarvestRecordPort.saveHarvestRecord(harvestRecord);

        // 3. 도메인 상태 변경 및 DB 업데이트
        registration.completeHarvest();
        updateCultivationStatePort.updateStatus(command.getCultivationRegistrationId(), registration.getStatus());

        // 4. 이벤트 발행
        eventPublisher.publishEvent(new HarvestRecordedEvent(
                registration.getFarmId(),
                registration.getCropId(),
                command.getYieldAmount(),
                command.getYieldUnit() != null ? command.getYieldUnit() : "kg"
        ));

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HarvestRecord> loadHarvestRecords(Long cultivationRegistrationId) {
        return loadHarvestRecordPort.loadByCultivationRegistrationId(cultivationRegistrationId);
    }
}
