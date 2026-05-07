package com.farmbalance.recommend.adapter.out.mock;

import com.farmbalance.recommend.application.port.out.CropCandidateData;
import com.farmbalance.recommend.application.port.out.LoadCropCandidatePort;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * 작물 후보 목업 어댑터
 * TODO: 실제 DB/외부 API 연동 시 교체 예정
 */
@Component
public class MockCropCandidateAdapter implements LoadCropCandidatePort {

    @Override
    public List<CropCandidateData> loadCandidates(String regionCode) {
        return Arrays.asList(
            createCandidate(1L, "유기농 배추", "채소류", 6.0, 7.0, 25.0, new String[]{"사양토", "양토"},
                    88, 4200, 5200, 70, "15~20°C", "3월 ~ 5월", "파종 후 70~90일", 2,
                    new String[]{"배추흰나비", "무름병", "진딧물"}),
            createCandidate(2L, "청양고추", "채소류", 6.0, 6.8, 30.0, new String[]{"사양토"},
                    90, 5100, 3800, 120, "20~28°C", "2월 ~ 3월 (육묘)", "7월 ~ 10월", 3,
                    new String[]{"탄저병", "역병", "진딧물"}),
            createCandidate(3L, "방울토마토", "과일류", 6.0, 6.5, 28.0, new String[]{"양토", "사양토"},
                    82, 6800, 2600, 90, "20~25°C", "2월 ~ 4월", "5월 ~ 11월", 3,
                    new String[]{"잿빛곰팡이병", "흰가루병", "온실가루이"}),
            createCandidate(4L, "감자", "곡물", 5.5, 6.5, 20.0, new String[]{"사양토", "식양토"},
                    75, 1800, 8500, 90, "15~20°C", "3월 ~ 4월", "6월 ~ 7월", 1,
                    new String[]{"역병", "감자역병"}),
            createCandidate(5L, "당근", "채소류", 6.0, 7.0, 22.0, new String[]{"사양토"},
                    72, 2300, 6200, 100, "15~22°C", "3월 ~ 4월", "7월 ~ 8월", 2,
                    new String[]{"기생파리", "검은무늬병"}),
            createCandidate(6L, "깻잎", "채소류", 6.0, 7.0, 25.0, new String[]{"양토", "사양토"},
                    80, 8500, 1200, 60, "20~25°C", "4월 ~ 6월", "연중 (시설재배)", 1,
                    new String[]{"진딧물", "응애"}),
            createCandidate(7L, "양파", "채소류", 6.0, 7.0, 20.0, new String[]{"양토", "식양토"},
                    68, 1500, 9800, 180, "15~20°C", "9월 (파종) / 11월 (정식)", "이듬해 6월", 2,
                    new String[]{"노균병", "잎마름병"})
        );
    }

    private CropCandidateData createCandidate(Long id, String name, String category,
            double phMin, double phMax, double om, String[] soilTypes,
            int pricePercent, int revenue, int yield,
            int growthDays, String temp, String sowing, String harvest, int diff, String[] pests) {

        return new CropCandidateData() {
            public Long getCropId() { return id; }
            public String getCropName() { return name; }
            public String getCategory() { return category; }
            public double getOptimalPhMin() { return phMin; }
            public double getOptimalPhMax() { return phMax; }
            public double getOptimalOrganicMatter() { return om; }
            public String[] getPreferredSoilTypes() { return soilTypes; }
            public int getPriceForecastPercent() { return pricePercent; }
            public int getExpectedRevenuePerKg() { return revenue; }
            public Integer getExpectedYield() { return yield; }
            public Integer getGrowthDays() { return growthDays; }
            public String getOptimalTemp() { return temp; }
            public String getSowingPeriod() { return sowing; }
            public String getHarvestPeriod() { return harvest; }
            public Integer getDifficulty() { return diff; }
            public String[] getPests() { return pests; }
        };
    }
}
