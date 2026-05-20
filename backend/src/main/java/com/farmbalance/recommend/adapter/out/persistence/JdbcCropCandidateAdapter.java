package com.farmbalance.recommend.adapter.out.persistence;

import com.farmbalance.recommend.application.port.out.CropCandidateData;
import com.farmbalance.recommend.application.port.out.LoadCropCandidatePort;
import com.farmbalance.recommend.application.support.CropCultivationEnvMatcher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;

/**
 * 작물 후보 실 데이터 어댑터
 *
 * crops + crop_categories + soil_fitness_data + crop_production_stats
 * + crop_cultivation_env + nongsaro_farm_schedules 테이블을
 * JOIN하여 추천 엔진에 필요한 후보 작물 데이터를 조회합니다.
 *
 * [고도화 내역]
 * - crop_cultivation_env 테이블 JOIN → 작물별 최적 pH, 온도, 난이도, 토양 타입을 DB에서 조회
 * - nongsaro_farm_schedules 테이블 서브쿼리 → 파종·수확 시기를 실제 데이터로 조회
 * - estimateDifficulty, estimateOptimalTemp 등의 하드코딩 함수를 DB 값 우선 사용으로 변경
 *
 * @Primary 로 MockCropCandidateAdapter 보다 우선 적용됩니다.
 */
@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class JdbcCropCandidateAdapter implements LoadCropCandidatePort {

    private static final String ENV_MATCH_PLACEHOLDER = "/*ENV_NAME_MATCH*/";
    private static final String SOWING_JOIN_PLACEHOLDER = "/*SOWING_WORK_MATCH*/";
    private static final String HARVEST_JOIN_PLACEHOLDER = "/*HARVEST_WORK_MATCH*/";

    static {
        assertCandidatesSqlTemplate();
    }

    /**
     * SQL LIKE '%파종%' 등과 동적 JOIN 조건을 함께 쓰므로 String.formatted()를 사용하지 않습니다.
     * (formatted 시 '%파'가 포맷 지정자로 해석되어 Conversion = '파' 발생)
     */
    private static final String CANDIDATES_SQL_TEMPLATE = """
            SELECT
                c.id            AS crop_id,
                c.name          AS crop_name,
                NULL::integer   AS crop_growth_days,
                cc.name         AS category_name,
                -- soil_fitness_data: 해당 시군구의 적합도 면적 합산
                COALESCE(sf.high_suit_area, 0) AS high_suit,
                COALESCE(sf.suit_area, 0)      AS suit,
                COALESCE(sf.poss_area, 0)      AS possible,
                COALESCE(sf.low_suit_area, 0)  AS low_suit,
                -- crop_production_stats: 최근 연도 생산 통계
                cps.yield_per_10a,
                cps.total_production,
                -- crop_cultivation_env: 작물별 재배 환경 정보
                env.optimal_ph_min,
                env.optimal_ph_max,
                env.optimal_temp      AS env_optimal_temp,
                env.organic_matter    AS env_organic_matter,
                env.soil_types        AS env_soil_types,
                env.difficulty        AS env_difficulty,
                env.sowing_info       AS env_sowing_info,
                env.harvest_info      AS env_harvest_info,
                env.growth_days       AS env_growth_days,
                env.major_pests       AS env_major_pests,
                -- nongsaro_farm_schedules: 파종 시기 (동적 조회)
                sowing_sch.sowing_period,
                -- nongsaro_farm_schedules: 수확 시기 (동적 조회)
                harvest_sch.harvest_period
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
            LEFT JOIN LATERAL (
                SELECT
                    optimal_ph_min,
                    optimal_ph_max,
                    optimal_temp,
                    organic_matter,
                    soil_types,
                    difficulty,
                    sowing_info,
                    harvest_info,
                    growth_days,
                    major_pests
                FROM crop_cultivation_env e
                WHERE e.deleted_at IS NULL
                  AND """ + ENV_MATCH_PLACEHOLDER + """
                ORDER BY
                    CASE WHEN e.crop_name = c.name THEN 0 ELSE 1 END,
                    LENGTH(e.crop_name) DESC
                LIMIT 1
            ) env ON TRUE
            LEFT JOIN (
                SELECT
                    farm_work_type,
                    MIN(start_month) || '월' ||
                    CASE WHEN MIN(start_month) <> MAX(end_month)
                         THEN ' ~ ' || MAX(end_month) || '월'
                         ELSE ''
                    END AS sowing_period
                FROM nongsaro_farm_schedules
                WHERE deleted_at IS NULL
                  AND info_type_code = '410001'
                  AND (operation_name LIKE '%파종%' OR operation_name LIKE '%정식%'
                       OR operation_name LIKE '%이식%' OR operation_name LIKE '%모내기%')
                GROUP BY farm_work_type
            ) sowing_sch ON """ + SOWING_JOIN_PLACEHOLDER + """
            LEFT JOIN (
                SELECT
                    farm_work_type,
                    MIN(start_month) || '월' ||
                    CASE WHEN MIN(start_month) <> MAX(end_month)
                         THEN ' ~ ' || MAX(end_month) || '월'
                         ELSE ''
                    END AS harvest_period
                FROM nongsaro_farm_schedules
                WHERE deleted_at IS NULL
                  AND info_type_code = '410001'
                  AND (operation_name LIKE '%수확%' OR operation_name LIKE '%수확기%'
                       OR operation_name LIKE '%성숙기%')
                GROUP BY farm_work_type
            ) harvest_sch ON """ + HARVEST_JOIN_PLACEHOLDER + """
            WHERE c.deleted_at IS NULL
            ORDER BY c.name
            """;

    private final JdbcTemplate jdbcTemplate;

    static String buildCandidatesSql(
            String envNameMatch,
            String nongsaroWorkMatch,
            String nongsaroHarvestMatch
    ) {
        return CANDIDATES_SQL_TEMPLATE
                .replace(ENV_MATCH_PLACEHOLDER, envNameMatch)
                .replace(SOWING_JOIN_PLACEHOLDER, nongsaroWorkMatch)
                .replace(HARVEST_JOIN_PLACEHOLDER, nongsaroHarvestMatch);
    }

    /**
     * 클래스 로드 시 SQL 템플릿이 LIKE 패턴·플레이스홀더 치환 후 정상 조립되는지 검증합니다.
     * (기존 단위 테스트 역할을 런타임 초기화로 대체)
     */
    private static void assertCandidatesSqlTemplate() {
        String envNameMatch = CropCultivationEnvMatcher.sqlEnvCropNameMatch("c.name", "e.crop_name");
        String nongsaroWorkMatch = CropCultivationEnvMatcher.sqlNongsaroFarmWorkMatch(
                "c.name", "sowing_sch.farm_work_type");
        String nongsaroHarvestMatch = CropCultivationEnvMatcher.sqlNongsaroFarmWorkMatch(
                "c.name", "harvest_sch.farm_work_type");

        String sql = buildCandidatesSql(envNameMatch, nongsaroWorkMatch, nongsaroHarvestMatch);

        if (sql.contains(ENV_MATCH_PLACEHOLDER)
                || sql.contains(SOWING_JOIN_PLACEHOLDER)
                || sql.contains(HARVEST_JOIN_PLACEHOLDER)) {
            throw new IllegalStateException("Candidate SQL template placeholders were not replaced");
        }
        if (!sql.contains("LIKE '%파종%'")) {
            throw new IllegalStateException("Candidate SQL missing sowing LIKE patterns");
        }
        if (!sql.contains("NULL::integer   AS crop_growth_days")) {
            throw new IllegalStateException("Candidate SQL missing V16-safe crop_growth_days projection");
        }
    }

    @Override
    public List<CropCandidateData> loadCandidates(String regionCode) {
        // 시군구 코드 (5자리) 추출
        String sigunguCode = regionCode != null && regionCode.length() >= 5
                ? regionCode.substring(0, 5)
                : regionCode != null ? regionCode : "";

        String envNameMatch = CropCultivationEnvMatcher.sqlEnvCropNameMatch("c.name", "e.crop_name");
        String nongsaroWorkMatch = CropCultivationEnvMatcher.sqlNongsaroFarmWorkMatch("c.name", "sowing_sch.farm_work_type");
        String nongsaroHarvestMatch = CropCultivationEnvMatcher.sqlNongsaroFarmWorkMatch("c.name", "harvest_sch.farm_work_type");

        String sql = buildCandidatesSql(envNameMatch, nongsaroWorkMatch, nongsaroHarvestMatch);

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

        // ── crop_cultivation_env 에서 작물별 실제 데이터 조회 ──

        // pH 범위: DB 값 우선, 없으면 카테고리 기반 기본값
        Double dbPhMin = rs.getObject("optimal_ph_min") != null ? rs.getDouble("optimal_ph_min") : null;
        Double dbPhMax = rs.getObject("optimal_ph_max") != null ? rs.getDouble("optimal_ph_max") : null;
        double phMin = dbPhMin != null ? dbPhMin : fallbackPhMin(category);
        double phMax = dbPhMax != null ? dbPhMax : fallbackPhMax(category);

        // 유기물: DB 값 우선, 없으면 기본값
        Double dbOrganic = rs.getObject("env_organic_matter") != null ? rs.getDouble("env_organic_matter") : null;
        double organicMatter = dbOrganic != null ? dbOrganic : 25.0;

        // 선호 토양 타입: DB 값 우선, 없으면 기본값
        String dbSoilTypes = rs.getString("env_soil_types");
        String[] soilTypes = dbSoilTypes != null && !dbSoilTypes.isEmpty()
                ? dbSoilTypes.split(",")
                : new String[]{"양토", "사양토"};

        // 난이도: DB 값 우선, 없으면 카테고리 기반 추정
        Integer dbDifficulty = rs.getObject("env_difficulty") != null ? rs.getInt("env_difficulty") : null;
        int difficulty = dbDifficulty != null ? dbDifficulty : fallbackDifficulty(category);

        // 최적 온도: DB 값 우선, 없으면 카테고리 기반 추정
        String dbOptimalTemp = rs.getString("env_optimal_temp");
        String optimalTemp = dbOptimalTemp != null && !dbOptimalTemp.isEmpty()
                ? dbOptimalTemp : fallbackOptimalTemp(category);

        // 파종 시기: nongsaro 스케줄 > env 테이블 > 카테고리 기반 기본값
        String schSowing = rs.getString("sowing_period");
        String envSowing = rs.getString("env_sowing_info");
        String sowingPeriod = schSowing != null && !schSowing.isEmpty()
                ? schSowing
                : envSowing != null && !envSowing.isEmpty()
                        ? envSowing
                        : fallbackSowingPeriod(category);

        // 수확 시기: nongsaro 스케줄 > env 테이블 > 카테고리 기반 기본값
        String schHarvest = rs.getString("harvest_period");
        String envHarvest = rs.getString("env_harvest_info");
        String harvestPeriod = schHarvest != null && !schHarvest.isEmpty()
                ? schHarvest
                : envHarvest != null && !envHarvest.isEmpty()
                        ? envHarvest
                        : fallbackHarvestPeriod(category);

        // 재배 기간: crop_cultivation_env.growth_days (crops.growth_days는 V16에서 제거됨)
        Integer envGrowthDays = rs.getObject("env_growth_days") != null ? rs.getInt("env_growth_days") : null;
        Integer cropGrowthDays = rs.getObject("crop_growth_days") != null ? rs.getInt("crop_growth_days") : null;
        Integer growthDays = envGrowthDays != null ? envGrowthDays : cropGrowthDays;

        String[] pests = parseMajorPests(rs.getString("env_major_pests"));

        return new DefaultCropCandidateData(
                cropId, cropName, category,
                phMin, phMax,
                organicMatter,
                soilTypes,
                priceForecast, revenuePerKg, expectedYield,
                growthDays,
                optimalTemp,
                sowingPeriod,
                harvestPeriod,
                difficulty,
                pests
        );
    }

    /** crop_cultivation_env.major_pests — 쉼표 구분 문자열을 개별 항목 배열로 변환 */
    private static String[] parseMajorPests(String raw) {
        if (raw == null || raw.isBlank()) {
            return new String[0];
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
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

    // ── Fallback 함수들: DB에 데이터가 없을 때만 사용되는 카테고리 기반 기본값 ──

    private double fallbackPhMin(String category) {
        if (category == null) return 5.5;
        return switch (category) {
            case "과일", "과수" -> 5.5;
            case "채소", "엽경채류", "근채류" -> 6.0;
            case "곡류", "미곡" -> 5.5;
            case "특용작물", "약용작물" -> 5.5;
            default -> 5.5;
        };
    }

    private double fallbackPhMax(String category) {
        if (category == null) return 7.0;
        return switch (category) {
            case "과일", "과수" -> 6.5;
            case "채소", "엽경채류", "근채류" -> 7.0;
            case "곡류", "미곡" -> 6.5;
            case "특용작물", "약용작물" -> 6.5;
            default -> 7.0;
        };
    }

    private int fallbackDifficulty(String category) {
        if (category == null) return 3;
        return switch (category) {
            case "곡류", "미곡" -> 2;
            case "채소", "엽경채류", "근채류" -> 2;
            case "과일", "과수" -> 4;
            case "특용작물", "약용작물" -> 4;
            default -> 3;
        };
    }

    private String fallbackOptimalTemp(String category) {
        if (category == null) return "15~25°C";
        return switch (category) {
            case "과일", "과수" -> "18~28°C";
            case "채소", "엽경채류", "근채류" -> "15~25°C";
            case "곡류", "미곡" -> "20~30°C";
            case "특용작물" -> "15~22°C";
            default -> "15~25°C";
        };
    }

    private String fallbackSowingPeriod(String category) {
        if (category == null) return "3월 ~ 5월";
        return switch (category) {
            case "과일", "과수" -> "2월 ~ 4월";
            case "채소", "엽경채류", "근채류" -> "3월 ~ 5월";
            case "곡류", "미곡" -> "4월 ~ 6월";
            default -> "3월 ~ 5월";
        };
    }

    private String fallbackHarvestPeriod(String category) {
        if (category == null) return "파종 후 60~120일";
        return switch (category) {
            case "과일", "과수" -> "7월 ~ 11월";
            case "채소", "엽경채류", "근채류" -> "파종 후 60~90일";
            case "곡류", "미곡" -> "9월 ~ 11월";
            default -> "파종 후 60~120일";
        };
    }
}
