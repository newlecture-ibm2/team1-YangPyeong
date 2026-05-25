package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 재배 등록 완료 이벤트
 * 재배 등록 시 자동으로 히스토리에 기록하거나 AI 분석을 위해 발행됩니다.
 */
@Getter
@AllArgsConstructor
public class CultivationRegisteredEvent {
    private final Long id; // cultivation_registration_id
    private final Long userId;
    private final Long farmId;
    private final Long cropId;
    private final String cropName;
    private final Double cultivationArea;
    private final java.time.LocalDate sowingDate;
}
