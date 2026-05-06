package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.HarvestRecord;

import java.util.List;

/**
 * 수확 이력 조회 UseCase
 */
public interface LoadHarvestUseCase {

    List<HarvestRecord> loadHarvestRecords(Long cultivationRegistrationId);
}
