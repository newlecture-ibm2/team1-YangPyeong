package com.farmbalance.farm.adapter.in.web.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FarmRegisterResponse {
    private Long id;
    private String pnuCode;
}
