package com.farmbalance.farm.application.port.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterFarmCommand {
    private Long userId; // 인증된 사용자의 ID
    private String name;
    private String address;
    private Double area;
    private List<Long> cropIds;
    private String bjdCode;
    private boolean isMountain;
    private String mainNo;
    private String subNo;
    private List<com.farmbalance.farm.domain.FarmDocument> documents;
    private com.farmbalance.farm.domain.FarmDocumentData documentData;
    private Double latitude;
    private Double longitude;
    private String soilType;
    private Double ph;
    private Double organicMatter;

    // 재배 등록 상세 정보 (작물별 면적/예상 수확량)
    private List<CultivationDetail> cultivations;

    @Getter
    @Builder
@NoArgsConstructor
@AllArgsConstructor
    public static class CultivationDetail {
        private Long cropId;
        private Double area;              // 재배 면적 (㎡)
        private Double expectedYield;     // 예상 수확량 (kg)
    }
}
