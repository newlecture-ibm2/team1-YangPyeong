package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.CultivationType;
import lombok.Builder;
import lombok.Getter;

/**
 * 재배 등록 명령 (Command)
 */
@Getter
@Builder
public class RegisterCultivationCommand {
    private final Long farmId;
    private final Long cropId;
    private final CultivationType cultivationType;
    private final Double cultivationArea;
    private final Double farmerEstimatedYield;
    private final String yieldUnit;
}
