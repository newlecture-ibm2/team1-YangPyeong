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

    private List<Long> cropIds;
    
    // PNU 생성용 필드
    @NotBlank(message = "주소 검색을 통해 지역 정보를 입력해주세요.")
    @Pattern(regexp = "^[0-9]{10}$", message = "유효하지 않은 지역 코드입니다.")
    private String bjdCode;     // 지역 정보 (법정동 코드)
    
    private boolean isMountain; // 산 여부
    
    @NotBlank(message = "지번(앞자리) 정보가 누락되었습니다. 주소를 다시 검색해 주세요.")
    @Pattern(regexp = "^[0-9]{1,4}$", message = "지번(앞자리)은 1~4자리 숫자여야 합니다.")
    private String mainNo;      // 지번(본번)
    
    @NotBlank(message = "지번(뒷자리) 정보가 누락되었습니다. 주소를 다시 검색해 주세요.")
    @Pattern(regexp = "^[0-9]{1,4}$", message = "지번(뒷자리)은 1~4자리 숫자여야 합니다.")
    private String subNo;       // 지번(부번)
    
    private String registrationNumber; // 농업경영체 등록번호
    
    private String documentUrl; // 증빙 서류 경로

    private String soilType;
    private Double ph;
    private Double organicMatter;

    // 프론트엔드 카카오 Maps JS SDK에서 변환한 좌표
    private Double latitude;
    private Double longitude;
}
