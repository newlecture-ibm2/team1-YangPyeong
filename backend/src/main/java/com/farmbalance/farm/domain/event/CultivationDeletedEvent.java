package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 재배 등록 삭제 이벤트
 */
@Getter
@AllArgsConstructor
public class CultivationDeletedEvent {
    private final Long cultivationRegistrationId;
    private final Long farmId;
}
