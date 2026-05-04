package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.CultivationRegistration;

/**
 * 재배 등록 유스케이스 인터페이스 (Input Port)
 */
public interface RegisterCultivationUseCase {
    CultivationRegistration registerCultivation(RegisterCultivationCommand command);
}
