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
import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.event.HarvestRecordedEvent;

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
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public HarvestRecord recordHarvest(RecordHarvestCommand command) {
        HarvestRecord harvestRecord = HarvestRecord.builder()
                .cultivationRegistrationId(command.getCultivationRegistrationId())
                .harvestDate(command.getHarvestDate())
                .yieldAmount(command.getYieldAmount())
                .yieldUnit(command.getYieldUnit() != null ? command.getYieldUnit() : "kg")
                .grade(command.getGrade())
                .toShop(command.getToShop() != null ? command.getToShop() : false)
                .build();

        HarvestRecord saved = saveHarvestRecordPort.saveHarvestRecord(harvestRecord);

        // 이벤트 발행
        loadFarmPort.loadCultivationById(command.getCultivationRegistrationId())
                .ifPresent(reg -> {
                    eventPublisher.publishEvent(new HarvestRecordedEvent(
                            reg.getFarmId(),
                            reg.getCropId(),
                            command.getYieldAmount(),
                            command.getYieldUnit() != null ? command.getYieldUnit() : "kg"
                    ));
                });

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HarvestRecord> loadHarvestRecords(Long cultivationRegistrationId) {
        return loadHarvestRecordPort.loadByCultivationRegistrationId(cultivationRegistrationId);
    }
}
