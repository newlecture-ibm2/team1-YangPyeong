package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.CultivationRegistration;
import java.util.List;
import java.util.Optional;

public interface LoadCultivationRegistrationPort {
    Optional<CultivationRegistration> loadCultivation(Long id);
    List<CultivationRegistration> loadCultivationsByFarmId(Long farmId);
}
