package com.farmbalance.farm.domain.event;

import java.time.LocalDateTime;

public record CultivationChangedEvent(
    Long cultivationId,
    Long userId,
    String cropName,
    String oldCropName,
    String changeType, // CREATED, UPDATED, DELETED
    LocalDateTime eventTimestamp
) {
}
