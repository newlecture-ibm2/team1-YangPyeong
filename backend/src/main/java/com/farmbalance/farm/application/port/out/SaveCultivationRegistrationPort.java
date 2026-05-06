package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.CultivationRegistration;

public interface SaveCultivationRegistrationPort {
    CultivationRegistration saveCultivation(CultivationRegistration cultivation);
}
