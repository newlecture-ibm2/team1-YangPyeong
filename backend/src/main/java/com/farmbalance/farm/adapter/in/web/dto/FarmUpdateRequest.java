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

    private List<String> cropTypes;
    
    // PNU 갱신용 필드
    @NotBlank(message = "법정동 코드는 필수입니다.")
    @Pattern(regexp = "^[0-9]{10}$", message = "법정동 코드는 10자리 숫자여야 합니다.")
    private String bjdCode;
    
    private boolean isMountain;
    
    @NotBlank(message = "본번은 필수입니다.")
    @Pattern(regexp = "^[0-9]{1,4}$", message = "본번은 1~4자리 숫자여야 합니다.")
    private String mainNo;
    
    @NotBlank(message = "부번은 필수입니다.")
    @Pattern(regexp = "^[0-9]{1,4}$", message = "부번은 1~4자리 숫자여야 합니다.")
    private String subNo;
    
    private String registrationNumber;
    
    private String documentUrl;
}
