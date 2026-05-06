package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.Farm;
import java.util.List;
import java.util.Optional;

public interface LoadFarmPort {
    List<Farm> loadFarmsByUserId(Long userId);
    Optional<Farm> loadFarmById(Long farmId);
    List<Farm> loadAllFarms();
    List<CultivationRegistration> loadCultivationsByFarmId(Long farmId);
    Optional<CultivationRegistration> loadCultivationById(Long id);
}
