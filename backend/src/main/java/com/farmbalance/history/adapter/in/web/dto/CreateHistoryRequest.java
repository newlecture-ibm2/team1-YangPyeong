package com.farmbalance.history.adapter.in.web.dto;

import com.farmbalance.history.domain.HistoryType;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateHistoryRequest {
    @NotBlank(message = "내용은 필수입니다.")
    private String content;
    
    private HistoryType historyType = HistoryType.USER;
}
