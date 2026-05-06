package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.HarvestRecord;

/**
 * 수확 이력 저장 Output Port
 */
public interface SaveHarvestRecordPort {

    HarvestRecord saveHarvestRecord(HarvestRecord harvestRecord);
}
