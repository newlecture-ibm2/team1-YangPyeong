package com.farmbalance.recommend.application.support;

/**
 * 프론트 sessionStorage 캐시 키와 동일한 작물 식별 문자열.
 */
public final class RevenuePredictionRowKey {

    private RevenuePredictionRowKey() {
    }

    public static String build(String cropName, double areaSqm, Integer sowingMonth, Double actualYieldKg) {
        String base = cropName + ":" + areaSqm + ":" + (sowingMonth != null ? sowingMonth : "");
        if (actualYieldKg != null && !actualYieldKg.isNaN()) {
            return base + ":y" + actualYieldKg;
        }
        return base;
    }
}
