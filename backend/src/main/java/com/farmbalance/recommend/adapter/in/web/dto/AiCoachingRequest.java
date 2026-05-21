package com.farmbalance.recommend.adapter.in.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AiCoachingRequest {
    private List<Long> cropIds;
}
