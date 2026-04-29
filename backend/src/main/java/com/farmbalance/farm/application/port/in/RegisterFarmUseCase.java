package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.Farm;

public interface RegisterFarmUseCase {
    Farm registerFarm(RegisterFarmCommand command);
}
