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

    /**
     * 비율(%)에 따른 수급 상태 계산
     */
    public static BalanceStatus calculateFromRatio(double ratio, 
                                                  double excessWarn, 
                                                  double excessCaution, 
                                                  double shortCaution, 
                                                  double shortWarn) {
        if (ratio >= excessWarn) return EXCESS_WARN;
        if (ratio >= excessCaution) return EXCESS_CAUTION;
        if (ratio > shortCaution) return BALANCED;
        if (ratio > shortWarn) return SHORT_CAUTION;
        return SHORT_WARN;
    }
}
