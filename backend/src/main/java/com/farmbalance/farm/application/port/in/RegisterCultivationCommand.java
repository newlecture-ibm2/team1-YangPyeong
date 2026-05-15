package com.farmbalance.farm.application.port.in;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

/**
 * 재배 등록 커맨드 (기존 농장에 작물 재배 정보 추가)
 */
@Getter
@Builder
public class RegisterCultivationCommand {
    private final Long farmId;
    private final Long cropId;
    private final Double cultivationArea;    // 재배 면적 (㎡)
    private final Double expectedYield;      // 예상 수확량
    private final String yieldUnit;              // g | kg | ton
    /** 이미 파종·재배 중이면 true */
    private final Boolean alreadyPlanted;
    private final LocalDate sowingDate;
}
