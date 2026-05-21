package com.farmbalance.history.application.port.in;

import com.farmbalance.history.domain.HistoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class RecordHistoryCommand {
    private final Long farmId;
    private final Long cultivationRegistrationId;
    private final java.time.LocalDate recordDate;
    private final HistoryType activityType;
    private final String activityContent;
    private final Double avgTemp;
    private final Double totalRain;
}
