package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.HarvestRecord;

/**
 * 수확 이력 기록 UseCase
 */
public interface RecordHarvestUseCase {

    HarvestRecord recordHarvest(RecordHarvestCommand command);
}
