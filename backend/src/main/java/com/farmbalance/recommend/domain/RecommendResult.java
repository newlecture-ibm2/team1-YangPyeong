package com.farmbalance.recommend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 추천 응답 — 농장 정보 + 추천 목록을 묶는 루트 도메인 모델
 * 프론트엔드의 CropRecommendResponse 인터페이스와 대응
 */
@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class RecommendResult {

    private Long farmId;
    private String farmName;
    private String farmAddress;
    private Double farmArea;
    private Double soilPh;
    private Double organicMatter;
    private String soilType;

    private RecommendMode recommendMode;

    /** 재배 중·재배 예정 작물 코칭 */
    private List<CropRecommendation> currentCropAdvices;

    /** 신규·다음 시즌 작물 추천 */
    private List<CropRecommendation> recommendations;
    private LocalDateTime generatedAt;
}
