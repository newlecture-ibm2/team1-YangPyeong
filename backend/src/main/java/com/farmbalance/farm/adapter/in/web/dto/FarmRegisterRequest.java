package com.farmbalance.farm.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class FarmRegisterRequest {

    @NotBlank(message = "농장 이름은 필수입니다.")
    private String name;

    @NotBlank(message = "주소는 필수입니다.")
    private String address;

    @NotNull(message = "면적은 필수입니다.")
    private Double area;

    private List<String> cropTypes;
    
    // PNU 생성용 필드
    @NotBlank(message = "법정동 코드는 필수입니다.")
    @Pattern(regexp = "^[0-9]{10}$", message = "법정동 코드는 10자리 숫자여야 합니다.")
    private String bjdCode;     // 카카오 API 등을 통해 받은 10자리 법정동 코드
    
    private boolean isMountain; // 산 여부
    
    private String mainNo;      // 본번
    
    private String subNo;       // 부번
    
    private String registrationNumber; // 농업경영체 등록번호 (프론트에서 전달)
    
    private String documentUrl; // 증빙 서류 경로

    // 프론트엔드 카카오 Maps JS SDK에서 변환한 좌표
    private Double latitude;
    private Double longitude;
}
