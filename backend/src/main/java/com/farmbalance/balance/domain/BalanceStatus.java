package com.farmbalance.balance.domain;

public enum BalanceStatus {
    EXCESS_WARN("공급 과잉 경고"),
    EXCESS_CAUTION("공급 과잉 주의"),
    BALANCED("수급 적정"),
    SHORT_CAUTION("공급 부족 주의"),
    SHORT_WARN("공급 부족 경고"),
    UNKNOWN("알 수 없음");

    private final String description;

    BalanceStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public String getLabel() {
        return description;
    }

    public static BalanceStatus calculateFromRatio(double ratio) {
        if (ratio == 0.0) return UNKNOWN;
        if (ratio >= 130.0) return EXCESS_WARN;
        if (ratio >= 110.0) return EXCESS_CAUTION;
        if (ratio >= 90.0) return BALANCED;
        if (ratio >= 70.0) return SHORT_CAUTION;
        return SHORT_WARN;
    }
}
