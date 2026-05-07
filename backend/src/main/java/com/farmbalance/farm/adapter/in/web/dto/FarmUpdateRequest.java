package com.farmbalance.farm.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class FarmUpdateRequest {

    @NotBlank(message = "농장 이름은 필수입니다.")
    private String name;

    @NotBlank(message = "주소는 필수입니다.")
    private String address;

    @NotNull(message = "면적은 필수입니다.")
    private Double area;

    private List<Long> cropIds;
    
    // PNU 갱신용 필드 (선택 사항)
    private String bjdCode;
    
    private boolean isMountain;
    
    private String mainNo;
    
    private String subNo;
    
    private String registrationNumber;
    
    private String documentUrl;

    private String soilType;
    private Double ph;
    private Double organicMatter;
}
