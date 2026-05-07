package com.farmbalance.recommend.domain;

/**
 * 4항목 가중 점수 산출 엔진
 *
 * 종합 점수 = (토양적합도 × W1) + (시세전망 × W2) + (수급안정성 × W3) + (재배난이도보정 × W4)
 *
 * 가중치 기본값: W1=0.35, W2=0.25, W3=0.25, W4=0.15
 */
public class RecommendScoreCalculator {

    /** 기본 가중치 */
    private static final double W_SOIL    = 0.35;
    private static final double W_PRICE   = 0.25;
    private static final double W_SUPPLY  = 0.25;
    private static final double W_DIFFICULTY = 0.15;

    private final double wSoil;
    private final double wPrice;
    private final double wSupply;
    private final double wDifficulty;

    /** 기본 가중치 사용 */
    public RecommendScoreCalculator() {
        this(W_SOIL, W_PRICE, W_SUPPLY, W_DIFFICULTY);
    }

    /** 커스텀 가중치 사용 */
    public RecommendScoreCalculator(double wSoil, double wPrice, double wSupply, double wDifficulty) {
        double sum = wSoil + wPrice + wSupply + wDifficulty;
        if (Math.abs(sum - 1.0) > 0.01) {
            throw new IllegalArgumentException("가중치 합이 1.0이어야 합니다. 현재: " + sum);
        }
        this.wSoil = wSoil;
        this.wPrice = wPrice;
        this.wSupply = wSupply;
        this.wDifficulty = wDifficulty;
    }

    /**
     * 종합 점수 계산
     *
     * @param soilFitnessPercent  토양 적합도 (0~100)
     * @param priceForecastPercent 시세 전망 (0~100)
     * @param supplyStabilityPercent 수급 안정성 (0~100)
     * @param difficulty          재배 난이도 (1~5, 낮을수록 쉬움)
     * @return 종합 점수 (0~100, 정수)
     */
    public int calculate(int soilFitnessPercent,
                         int priceForecastPercent,
                         int supplyStabilityPercent,
                         int difficulty) {

        // 난이도 보정: 난이도가 낮을수록(=쉬울수록) 점수가 높음
        // 1→100, 2→80, 3→60, 4→40, 5→20
        int difficultyScore = Math.max(0, (6 - difficulty) * 20);

        double raw = (soilFitnessPercent * wSoil)
                   + (priceForecastPercent * wPrice)
                   + (supplyStabilityPercent * wSupply)
                   + (difficultyScore * wDifficulty);

        return (int) Math.round(Math.min(100, Math.max(0, raw)));
    }

    /**
     * 토양 적합도 퍼센트 산출
     *
     * @param farmPh          농장 pH
     * @param farmOrganicMatter 농장 유기물 함량 (g/kg)
     * @param farmSoilType    농장 토양 유형
     * @param cropOptimalPhMin 작물 최적 pH 하한
     * @param cropOptimalPhMax 작물 최적 pH 상한
     * @param cropOptimalOm   작물 최적 유기물 함량
     * @param cropPreferredSoilTypes 작물 선호 토양 유형 목록
     * @return 적합도 퍼센트 (0~100)
     */
    public int calculateSoilFitness(Double farmPh, Double farmOrganicMatter, String farmSoilType,
                                    double cropOptimalPhMin, double cropOptimalPhMax,
                                    double cropOptimalOm, String... cropPreferredSoilTypes) {

        int phScore = 60; // 데이터 없을 시 중립값
        if (farmPh != null) {
            if (farmPh >= cropOptimalPhMin && farmPh <= cropOptimalPhMax) {
                phScore = 100;
            } else {
                double deviation = Math.min(
                    Math.abs(farmPh - cropOptimalPhMin),
                    Math.abs(farmPh - cropOptimalPhMax)
                );
                phScore = Math.max(0, 100 - (int)(deviation * 20));
            }
        }

        int omScore = 60; // 데이터 없을 시 중립값
        if (farmOrganicMatter != null && cropOptimalOm > 0) {
            double ratio = farmOrganicMatter / cropOptimalOm;
            if (ratio >= 0.8 && ratio <= 1.3) {
                omScore = 100;
            } else {
                omScore = Math.max(0, 100 - (int)(Math.abs(ratio - 1.0) * 80));
            }
        }

        int soilTypeScore = 50; // 기본값
        if (farmSoilType != null && cropPreferredSoilTypes.length > 0) {
            for (String preferred : cropPreferredSoilTypes) {
                if (farmSoilType.contains(preferred) || preferred.contains(farmSoilType)) {
                    soilTypeScore = 100;
                    break;
                }
            }
        }

        // pH(40%) + 유기물(30%) + 토양유형(30%)
        return (int) Math.round(phScore * 0.4 + omScore * 0.3 + soilTypeScore * 0.3);
    }

    /**
     * 수급 상태로부터 수급 안정성 퍼센트 산출
     */
    public int calculateSupplyStability(SupplyStatus status) {
        switch (status) {
            case BALANCED:       return 95;
            case SHORT_CAUTION:  return 75;
            case EXCESS_CAUTION: return 65;
            case SHORT_WARN:     return 50;
            case EXCESS_WARN:    return 40;
            default:             return 50;
        }
    }

    /**
     * 토양 적합도 퍼센트 → SoilFitness 등급 변환
     */
    public SoilFitness toSoilFitnessGrade(int percent) {
        if (percent >= 90) return SoilFitness.HIGH_SUIT;
        if (percent >= 75) return SoilFitness.SUIT;
        if (percent >= 55) return SoilFitness.POSSIBLE;
        if (percent >= 35) return SoilFitness.LOW_SUIT;
        return SoilFitness.NONE;
    }
}
