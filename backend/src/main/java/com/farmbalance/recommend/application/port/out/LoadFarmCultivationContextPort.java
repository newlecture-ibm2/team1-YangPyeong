package com.farmbalance.recommend.application.port.out;

import com.farmbalance.recommend.domain.FarmCultivationContext;

public interface LoadFarmCultivationContextPort {

    FarmCultivationContext loadByFarmId(Long farmId);
}
