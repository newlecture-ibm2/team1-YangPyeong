package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.HarvestRecord;

import java.util.List;

/**
 * 수확 이력 조회 Output Port
 */
public interface LoadHarvestRecordPort {

    List<HarvestRecord> loadByCultivationRegistrationId(Long cultivationRegistrationId);
}
