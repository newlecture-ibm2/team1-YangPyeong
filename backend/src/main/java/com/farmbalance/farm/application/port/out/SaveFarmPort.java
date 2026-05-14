package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.Farm;

public interface SaveFarmPort {
    Farm saveFarm(Farm farm);
    void updateCertificationStatus(Long id, String status);
    void updateCertificationStatusWithReason(Long id, String status, String reason);
    void deleteFarm(Long id);
}
