package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.CultivationRegistration;

public interface UpdateCultivationUseCase {
    CultivationRegistration updateCultivation(UpdateCultivationCommand command);
}
