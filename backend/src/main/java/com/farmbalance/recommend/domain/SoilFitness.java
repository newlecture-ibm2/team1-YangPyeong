package com.farmbalance.recommend.domain;

/**
 * 토양 적합도 등급
 */
public enum SoilFitness {

    HIGH_SUIT("최적지",   100),
    SUIT("적지",          80),
    POSSIBLE("가능지",     60),
    LOW_SUIT("저위생산지",  40),
    NONE("부적합",         20);

    private final String label;
    private final int baseScore;

    SoilFitness(String label, int baseScore) {
        this.label = label;
        this.baseScore = baseScore;
    }

    public String getLabel()  { return label; }
    public int getBaseScore() { return baseScore; }
}
