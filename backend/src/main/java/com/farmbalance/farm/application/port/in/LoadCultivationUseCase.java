package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.CultivationRegistration;
import java.util.List;

/**
 * 재배 정보 조회 유스케이스 인터페이스 (Input Port)
 */
public interface LoadCultivationUseCase {
    List<CultivationRegistration> getCultivationsByFarmId(Long farmId);
}
