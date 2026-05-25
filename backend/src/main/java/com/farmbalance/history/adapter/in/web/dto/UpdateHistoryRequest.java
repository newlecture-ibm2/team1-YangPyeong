package com.farmbalance.history.adapter.in.web.dto;

import com.farmbalance.history.domain.HistoryType;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateHistoryRequest {
    @NotBlank(message = "기록 내용을 입력해주세요.")
    private String activityContent;
    
    private HistoryType activityType;

    private java.time.LocalDate recordDate;
}
