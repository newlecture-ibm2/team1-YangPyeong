package com.farmbalance.farm.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmDetailResponse {
    private Long id;
    private String name;
    private String address;
    private Double area;
    private List<String> cropNames;
    private List<Long> cropIds;
    private String pnuCode;
    private String bjdCode;
    private List<FarmDocumentDto> documents;
    private String soilType;
    private Double ph;
    private Double organicMatter;
}
