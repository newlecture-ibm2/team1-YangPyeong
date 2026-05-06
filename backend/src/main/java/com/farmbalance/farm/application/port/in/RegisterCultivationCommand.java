package com.farmbalance.farm.application.port.in;

import lombok.Builder;
import lombok.Getter;

/**
 * 재배 등록 커맨드 (기존 농장에 작물 재배 정보 추가)
 */
@Getter
@Builder
public class RegisterCultivationCommand {
    private Long farmId;
    private Long cropId;
    private Double cultivationArea;    // 재배 면적 (㎡)
    private Double expectedYield;     // 예상 수확량
    private String yieldUnit;         // g | kg | ton
}
