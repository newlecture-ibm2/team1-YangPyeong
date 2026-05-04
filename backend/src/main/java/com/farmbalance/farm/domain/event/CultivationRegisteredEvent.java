package com.farmbalance.farm.domain.event;

import com.farmbalance.farm.domain.CultivationType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 재배 등록 완료 이벤트
 */
@Getter
@RequiredArgsConstructor
public class CultivationRegisteredEvent {
    private final Long cultivationId;
    private final Long farmId;
    private final Long cropId;
    private final Double area;
    private final CultivationType type;
}
