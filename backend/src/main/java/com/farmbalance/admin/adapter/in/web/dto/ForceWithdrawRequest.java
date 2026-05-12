package com.farmbalance.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class ForceWithdrawRequest {

    @NotBlank(message = "제재 사유 카테고리는 필수입니다.")
    private String reasonType;

    private String reasonDetail;
}
