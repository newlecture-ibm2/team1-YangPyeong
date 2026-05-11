package com.farmbalance.recommend.domain;

/**
 * 수급 상태 5단계
 */
public enum SupplyStatus {

    EXCESS_WARN("과잉", 40),
    EXCESS_CAUTION("과잉주의", 65),
    BALANCED("안정", 95),
    SHORT_CAUTION("부족주의", 75),
    SHORT_WARN("부족", 50);

    private final String label;
    private final int stabilityScore;

    SupplyStatus(String label, int stabilityScore) {
        this.label = label;
        this.stabilityScore = stabilityScore;
    }

    public String getLabel() { return label; }
    public int getStabilityScore() { return stabilityScore; }
}
