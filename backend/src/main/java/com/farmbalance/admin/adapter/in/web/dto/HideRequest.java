package com.farmbalance.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class HideRequest {
    @NotBlank(message = "숨김 사유는 필수입니다.")
    private String reason;
}
