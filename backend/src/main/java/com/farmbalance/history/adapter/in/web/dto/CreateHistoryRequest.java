package com.farmbalance.history.adapter.in.web.dto;

import com.farmbalance.history.domain.HistoryType;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateHistoryRequest {
    private Long cultivationRegistrationId;
    
    private java.time.LocalDate recordDate;

    @NotBlank(message = "내용은 필수입니다.")
    private String activityContent;
    
    private HistoryType activityType = HistoryType.USER;

    private Double avgTemp;
    private Double totalRain;
}
