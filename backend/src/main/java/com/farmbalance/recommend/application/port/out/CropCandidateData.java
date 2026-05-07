package com.farmbalance.recommend.application.port.out;

/**
 * 작물 후보 정보 — 점수 산출에 필요한 작물 데이터
 * 외부 포트에서 반환하는 DTO 역할
 */
public interface CropCandidateData {

    Long getCropId();
    String getCropName();
    String getCategory();        // "채소류", "과일류", ...

    /** 토양 적합도 산출에 필요한 파라미터 */
    double getOptimalPhMin();
    double getOptimalPhMax();
    double getOptimalOrganicMatter();
    String[] getPreferredSoilTypes();

    /** 시세 전망 점수 (0~100) — 외부 데이터 기반 */
    int getPriceForecastPercent();

    /** 예상 수익 (원/kg) */
    int getExpectedRevenuePerKg();

    /** 예상 수확량 (kg) */
    Integer getExpectedYield();

    /** 재배 정보 */
    Integer getGrowthDays();
    String getOptimalTemp();
    String getSowingPeriod();
    String getHarvestPeriod();
    Integer getDifficulty();
    String[] getPests();
}
