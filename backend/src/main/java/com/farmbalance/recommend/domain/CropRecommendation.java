package com.farmbalance.recommend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * AI 추천 결과 — 개별 작물 추천 도메인 모델
 * 프론트엔드의 CropRecommendation 인터페이스와 1:1 대응
 */
@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class CropRecommendation {

    private int rank;
    private Long cropId;
    private String cropName;
    private CropCategory category;

    /** 4항목 가중 종합 점수 (0~100) */
    private int score;

    /** 토양 적합도 */
    private SoilFitness soilFitness;
    private int soilFitnessPercent;

    /** 시세 전망 (0~100) */
    private int priceForecastPercent;

    /** 수급 안정성 (0~100) */
    private int supplyStabilityPercent;

    /** 수급 상태 */
    private SupplyStatus supplyStatus;

    /** 예상 수익 (원/kg) */
    private int expectedRevenuePerKg;

    /** 예상 수확량 (kg) */
    private Integer expectedYield;

    /** AI 분석 의견 */
    private String aiReason;

    /** 재배 상세 정보 */
    private Integer growthDays;
    private String optimalTemp;
    private String sowingPeriod;
    private String harvestPeriod;
    private Integer difficulty;
    private List<String> pests;

    /** AI 조언 유형 (신규 추천 / 재배 중 코칭 등) */
    private AdviceType adviceType;

    /** AI 코칭 요청 가능 여부 (응답 전용) */
    private String aiCoachingStatus;
    private String aiCoachingHint;

    /** 재배 등록 ID (코칭 작물 — 데이터 입력 링크용) */
    private Long registrationId;

    /** 토양 최적 작물과의 불일치 설명 */
    private String mismatchNote;
}
