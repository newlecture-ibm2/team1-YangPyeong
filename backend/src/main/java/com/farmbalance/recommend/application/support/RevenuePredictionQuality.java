package com.farmbalance.recommend.application.support;

import java.util.Map;

/** 프론트 isWeakRevenuePrediction 과 동일 기준 — DB 저장·복원 시 약한 결과 제외 */
public final class RevenuePredictionQuality {

    private static final String[] WEAK_MARKERS = {
            "AI 응답을 JSON으로 해석하지 못했습니다",
            "시세가 없어 수익 추정이 불완전합니다",
            "유효한 시세도 없어",
    };

    private RevenuePredictionQuality() {
    }

    public static boolean isWeak(Map<String, Object> response) {
        if (response == null || response.isEmpty()) {
            return true;
        }
        String priceInsight = stringVal(response.get("price_insight"));
        String revenueInsight = stringVal(response.get("revenue_insight"));

        for (String marker : WEAK_MARKERS) {
            if (priceInsight.contains(marker) || revenueInsight.contains(marker)) {
                return true;
            }
        }

        double yield = num(response.get("predicted_yield_kg"));
        double price = num(response.get("predicted_price_per_kg"));
        double revenue = num(response.get("predicted_revenue"));

        boolean hasNumbers = yield > 0 || price > 0 || revenue > 0;
        if (hasNumbers && (!priceInsight.isEmpty() || !revenueInsight.isEmpty())) {
            return false;
        }

        if (priceInsight.length() < 20 && revenueInsight.length() < 20) {
            return true;
        }
        return !hasNumbers;
    }

    private static String stringVal(Object o) {
        return o != null ? o.toString().trim() : "";
    }

    private static double num(Object o) {
        if (o instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return o != null ? Double.parseDouble(o.toString()) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
