package com.farmbalance.recommend.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "farm_revenue_prediction")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FarmRevenuePredictionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long farmId;

    @Column(nullable = false, length = 100)
    private String cropName;

    @Column(nullable = false)
    private Double areaSqm;

    private Integer sowingMonth;

    private Double actualYieldKg;

    @Column(nullable = false, length = 320)
    private String cacheRowKey;

    private Double predictedYieldKg;

    private Integer predictedPricePerKg;

    private Long predictedRevenue;

    @Column(columnDefinition = "TEXT")
    private String priceInsight;

    @Column(columnDefinition = "TEXT")
    private String revenueInsight;

    @Column(length = 30)
    private String confidence;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> yieldFactors;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> kamisRaw;

    @Column(nullable = false)
    private LocalDateTime predictedAt;

    public static FarmRevenuePredictionEntity fromSnapshot(
            Long farmId,
            String cacheRowKey,
            String cropName,
            double areaSqm,
            Integer sowingMonth,
            Double actualYieldKg,
            Map<String, Object> aiResponse
    ) {
        FarmRevenuePredictionEntity e = new FarmRevenuePredictionEntity();
        e.farmId = farmId;
        e.cacheRowKey = cacheRowKey;
        e.cropName = cropName;
        e.areaSqm = areaSqm;
        e.sowingMonth = sowingMonth;
        e.actualYieldKg = actualYieldKg;
        e.predictedYieldKg = toDouble(aiResponse.get("predicted_yield_kg"));
        e.predictedPricePerKg = toInt(aiResponse.get("predicted_price_per_kg"));
        e.predictedRevenue = toLong(aiResponse.get("predicted_revenue"));
        e.priceInsight = stringVal(aiResponse.get("price_insight"));
        e.revenueInsight = stringVal(aiResponse.get("revenue_insight"));
        e.confidence = stringVal(aiResponse.get("confidence"));
        Object yf = aiResponse.get("yield_factors");
        if (yf instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cast = (Map<String, Object>) m;
            e.yieldFactors = cast;
        }
        Object kamis = aiResponse.get("kamis_raw");
        if (kamis instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cast = (Map<String, Object>) m;
            e.kamisRaw = cast;
        }
        e.predictedAt = LocalDateTime.now();
        return e;
    }

    public void updateFromSnapshot(Map<String, Object> aiResponse) {
        this.predictedYieldKg = toDouble(aiResponse.get("predicted_yield_kg"));
        this.predictedPricePerKg = toInt(aiResponse.get("predicted_price_per_kg"));
        this.predictedRevenue = toLong(aiResponse.get("predicted_revenue"));
        this.priceInsight = stringVal(aiResponse.get("price_insight"));
        this.revenueInsight = stringVal(aiResponse.get("revenue_insight"));
        this.confidence = stringVal(aiResponse.get("confidence"));
        Object yf = aiResponse.get("yield_factors");
        if (yf instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cast = (Map<String, Object>) m;
            this.yieldFactors = cast;
        }
        Object kamis = aiResponse.get("kamis_raw");
        if (kamis instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cast = (Map<String, Object>) m;
            this.kamisRaw = cast;
        }
        this.predictedAt = LocalDateTime.now();
    }

    public Map<String, Object> toResponseMap() {
        java.util.LinkedHashMap<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("crop_name", cropName);
        map.put("area_sqm", areaSqm);
        map.put("predicted_yield_kg", predictedYieldKg != null ? predictedYieldKg : 0);
        map.put("predicted_price_per_kg", predictedPricePerKg != null ? predictedPricePerKg : 0);
        map.put("predicted_revenue", predictedRevenue != null ? predictedRevenue : 0);
        map.put("yield_factors", yieldFactors != null ? yieldFactors : Map.of());
        map.put("price_insight", priceInsight != null ? priceInsight : "");
        map.put("revenue_insight", revenueInsight != null ? revenueInsight : "");
        map.put("confidence", confidence != null ? confidence : "보통");
        if (kamisRaw != null) {
            map.put("kamis_raw", kamisRaw);
        }
        map.put("predicted_at", predictedAt.toString());
        return map;
    }

    private static String stringVal(Object o) {
        return o != null ? o.toString() : "";
    }

    private static Double toDouble(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
