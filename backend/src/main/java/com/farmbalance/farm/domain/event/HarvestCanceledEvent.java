package com.farmbalance.farm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 수확 기록 삭제(취소) 이벤트
 */
@Getter
@AllArgsConstructor
public class HarvestCanceledEvent {
    private final Long cultivationRegistrationId;
    private final String cropName; // 캐시 무효화를 위해 필요
}
