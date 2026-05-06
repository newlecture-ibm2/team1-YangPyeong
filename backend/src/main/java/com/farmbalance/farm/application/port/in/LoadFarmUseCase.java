package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.Farm;
import java.util.List;

public interface LoadFarmUseCase {
    List<Farm> loadFarmsByUserId(Long userId);
    Farm loadFarmDetail(Long farmId);

    List<CultivationRegistration> loadCultivationsByFarmId(Long farmId);
}
