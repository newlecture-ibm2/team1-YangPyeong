package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.Farm;

public interface SaveFarmPort {
    Farm saveFarm(Farm farm);
}
