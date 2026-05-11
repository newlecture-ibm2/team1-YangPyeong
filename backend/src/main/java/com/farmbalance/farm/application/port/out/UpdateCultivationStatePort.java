package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.CultivationStatus;

public interface UpdateCultivationStatePort {
    void updateStatus(Long cultivationRegistrationId, CultivationStatus status);
}
