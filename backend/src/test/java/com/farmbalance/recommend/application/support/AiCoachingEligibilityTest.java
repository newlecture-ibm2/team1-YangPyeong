package com.farmbalance.recommend.application.support;

import com.farmbalance.recommend.domain.AdviceType;
import com.farmbalance.recommend.domain.CropRecommendation;
import com.farmbalance.recommend.domain.CropCategory;
import com.farmbalance.recommend.domain.CultivationContextItem;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiCoachingEligibilityTest {

    @Test
    void evaluate_returnsHasAi_whenReasonExists() {
        CultivationContextItem item = baseItem().build();
        CropRecommendation rec = baseRec().aiReason("이미 생성된 코칭").build();

        AiCoachingEligibility.Result result = AiCoachingEligibility.evaluate(item, rec);

        assertEquals(AiCoachingEligibility.Status.HAS_AI, result.status());
    }

    @Test
    void evaluate_returnsNeedsData_whenPlannedWithoutSowingDate() {
        CultivationContextItem item = baseItem()
                .sowingDate(null)
                .build();
        CropRecommendation rec = baseRec().adviceType(AdviceType.PLANNED_CROP).build();

        AiCoachingEligibility.Result result = AiCoachingEligibility.evaluate(item, rec);

        assertEquals(AiCoachingEligibility.Status.NEEDS_DATA, result.status());
        assertTrue(result.hint().contains("파종"));
    }

    @Test
    void evaluate_returnsEligible_whenInSeasonWithYield() {
        CultivationContextItem item = baseItem()
                .inSeason(true)
                .farmerEstimatedYield(100.0)
                .build();
        CropRecommendation rec = baseRec().adviceType(AdviceType.IN_SEASON_COACHING).build();

        AiCoachingEligibility.Result result = AiCoachingEligibility.evaluate(item, rec);

        assertEquals(AiCoachingEligibility.Status.ELIGIBLE, result.status());
        assertTrue(AiCoachingEligibility.canRequestAi(result));
    }

    @Test
    void evaluateNewRecommendation_returnsOptional_forTop3() {
        CropRecommendation rec = baseRec().rank(2).build();

        AiCoachingEligibility.Result result = AiCoachingEligibility.evaluateNewRecommendation(rec, 2);

        assertEquals(AiCoachingEligibility.Status.OPTIONAL, result.status());
    }

    @Test
    void evaluateNewRecommendation_returnsNotApplicable_afterTop3() {
        CropRecommendation rec = baseRec().rank(4).build();

        AiCoachingEligibility.Result result = AiCoachingEligibility.evaluateNewRecommendation(rec, 4);

        assertEquals(AiCoachingEligibility.Status.NOT_APPLICABLE, result.status());
    }

    private static CultivationContextItem.CultivationContextItemBuilder baseItem() {
        return CultivationContextItem.builder()
                .registrationId(1L)
                .cropId(10L)
                .cropName("감자")
                .cultivationAreaSqm(1000.0)
                .registrationStatus(CultivationContextItem.CultivationRegistrationStatus.ACTIVE)
                .sowingDate(LocalDate.of(2026, 3, 1))
                .inSeason(true)
                .realActivityCount(1)
                .hasHarvestRecord(false);
    }

    private static CropRecommendation.CropRecommendationBuilder baseRec() {
        return CropRecommendation.builder()
                .cropId(10L)
                .cropName("감자")
                .category(CropCategory.fromLabel("곡물"))
                .rank(1)
                .score(70)
                .adviceType(AdviceType.IN_SEASON_COACHING);
    }
}
