package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.CropCandidateData;
import com.farmbalance.recommend.application.port.out.LoadCropCandidatePort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * 작물 후보 실 데이터 어댑터
 *
 * crops + crop_categories + soil_fitness_data + crop_production_stats 테이블을
 * JOIN하여 추천 엔진에 필요한 후보 작물 데이터를 조회합니다.
 *
 * [참고] V15 마이그레이션에서 crops 테이블의 growth_days, yield_per_sqm,
 * avg_cost_per_sqm, climate_conditions 컬럼이 삭제되었으므로,
 * 해당 정보는 crop_production_stats 및 soil_fitness_data에서 보완합니다.
 *
 * @Primary 로 MockCropCandidateAdapter 보다 우선 적용됩니다.
 */
@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class JdbcCropCandidateAdapter implements LoadCropCandidatePort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<CropCandidateData> loadCandidates(String regionCode) {
        // 시군구 코드 (5자리) 추출
        String sigunguCode = regionCode != null && regionCode.length() >= 5
                ? regionCode.substring(0, 5)
                : regionCode != null ? regionCode : "";

        String sql = """
            SELECT
                c.id            AS crop_id,
                c.name          AS crop_name,
                cc.name         AS category_name,
                -- soil_fitness_data: 해당 시군구의 적합도 면적 합산
                COALESCE(sf.high_suit_area, 0) AS high_suit,
                COALESCE(sf.suit_area, 0)      AS suit,
                COALESCE(sf.poss_area, 0)      AS possible,
                COALESCE(sf.low_suit_area, 0)  AS low_suit,
                -- crop_production_stats: 최근 연도 생산 통계
                cps.yield_per_10a,
                cps.total_production
            FROM crops c
            JOIN crop_categories cc ON c.category_id = cc.id
            LEFT JOIN soil_fitness_data sf
                ON sf.soil_crop_nm = c.name
                AND sf.bjd_code LIKE ?
                AND sf.deleted_at IS NULL
            LEFT JOIN (
                SELECT DISTINCT ON (itm_nm)
                    itm_nm, yield_per_10a, total_production
                FROM crop_production_stats
                WHERE deleted_at IS NULL
                ORDER BY itm_nm, year DESC
            ) cps ON cps.itm_nm = c.name
            WHERE c.deleted_at IS NULL
            ORDER BY c.name
            """;

        String likeCode = sigunguCode.isEmpty() ? "%" : sigunguCode + "%";

        List<CropCandidateData> candidates = jdbcTemplate.query(sql,
                (rs, rowNum) -> mapRow(rs),
                likeCode);

        log.info("작물 후보 {}건 조회 (regionCode={})", candidates.size(), regionCode);
        return candidates;
    }

    private CropCandidateData mapRow(ResultSet rs) throws SQLException {
        long cropId = rs.getLong("crop_id");
        String cropName = rs.getString("crop_name");
        String category = rs.getString("category_name");

        // 토양 적합도 면적 기반 점수 산출
        double highSuit = rs.getDouble("high_suit");
        double suit = rs.getDouble("suit");
        double possible = rs.getDouble("possible");
        double lowSuit = rs.getDouble("low_suit");
        double totalArea = highSuit + suit + possible + lowSuit;

        int soilBasedScore;
        if (totalArea > 0) {
            soilBasedScore = (int) Math.round(
                    (highSuit * 100 + suit * 80 + possible * 50 + lowSuit * 20) / totalArea
            );
        } else {
            soilBasedScore = 60;
        }

        // 시세 전망: 생산 통계 기반 추정
        Double totalProd = rs.getObject("total_production") != null ? rs.getDouble("total_production") : null;
        Double yieldPer10a = rs.getObject("yield_per_10a") != null ? rs.getDouble("yield_per_10a") : null;
        int priceForecast = estimatePriceForecast(totalProd, yieldPer10a);

        // 예상 수익 (원/kg): 생산 통계 기반 추정
        int revenuePerKg = 3000; // 기본값

        // 예상 수확량: 10a당 수확량 기반
        Integer expectedYield = yieldPer10a != null ? yieldPer10a.intValue() : null;

        // 난이도: 카테고리 기반 추정
        int difficulty = estimateDifficulty(category);

        return new DefaultCropCandidateData(
                cropId, cropName, category,
                5.5, 7.0,   // 범용 pH 범위
                25.0,        // 범용 유기물 기준
                new String[]{"양토", "사양토"},
                priceForecast, revenuePerKg, expectedYield,
                null,        // growthDays (V15에서 삭제됨)
                estimateOptimalTemp(category),
                estimateSowingPeriod(category),
                estimateHarvestPeriod(category),
                difficulty,
                new String[]{}
        );
    }

    private int estimatePriceForecast(Double totalProd, Double yieldPer10a) {
        if (totalProd == null) return 65;
        int baseScore = 70;
        if (yieldPer10a != null) {
            if (yieldPer10a > 5000) baseScore = 60;
            else if (yieldPer10a > 2000) baseScore = 75;
            else baseScore = 85;
        }
        return Math.min(100, Math.max(0, baseScore));
    }

    private int estimateDifficulty(String category) {
        if (category == null) return 3;
        return switch (category) {
            case "곡류", "미곡" -> 2;
            case "채소", "엽경채류", "근채류" -> 2;
            case "과일", "과수" -> 4;
            case "특용작물", "약용작물" -> 4;
            default -> 3;
        };
    }

    private String estimateOptimalTemp(String category) {
        if (category == null) return "15~25°C";
        return switch (category) {
            case "과일", "과수" -> "18~28°C";
            case "채소", "엽경채류", "근채류" -> "15~25°C";
            case "곡류", "미곡" -> "20~30°C";
            case "특용작물" -> "15~22°C";
            default -> "15~25°C";
        };
    }

    private String estimateSowingPeriod(String category) {
        if (category == null) return "3월 ~ 5월";
        return switch (category) {
            case "과일", "과수" -> "2월 ~ 4월";
            case "채소", "엽경채류", "근채류" -> "3월 ~ 5월";
            case "곡류", "미곡" -> "4월 ~ 6월";
            default -> "3월 ~ 5월";
        };
    }

    private String estimateHarvestPeriod(String category) {
        if (category == null) return "파종 후 60~120일";
        return switch (category) {
            case "과일", "과수" -> "7월 ~ 11월";
            case "채소", "엽경채류", "근채류" -> "파종 후 60~90일";
            case "곡류", "미곡" -> "9월 ~ 11월";
            default -> "파종 후 60~120일";
        };
    }
}
