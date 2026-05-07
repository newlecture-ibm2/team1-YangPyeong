package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.CultivationRegistration;

/**
 * 재배 등록 UseCase (기존 농장에 작물 재배 추가)
 */
public interface RegisterCultivationUseCase {
    CultivationRegistration registerCultivation(RegisterCultivationCommand command);
}
