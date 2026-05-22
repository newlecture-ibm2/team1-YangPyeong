package com.farmbalance.farm.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmRegisterResponse {
    private Long id;
    private String pnuCode;
}
