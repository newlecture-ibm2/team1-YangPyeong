package com.farmbalance.recommend.domain;

/**
 * 수급 상태 5단계
 */
public enum SupplyStatus {

    EXCESS_WARN("과잉",       "red"),
    EXCESS_CAUTION("과잉주의", "orange"),
    BALANCED("안정",          "green"),
    SHORT_CAUTION("부족주의",  "orange"),
    SHORT_WARN("부족",        "red");

    private final String label;
    private final String variant;

    SupplyStatus(String label, String variant) {
        this.label = label;
        this.variant = variant;
    }

    public String getLabel()   { return label; }
    public String getVariant() { return variant; }
}
