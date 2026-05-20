package com.farmbalance.recommend.application.support;

import com.farmbalance.recommend.domain.CultivationContextItem;
import com.farmbalance.recommend.domain.FarmCultivationContext;
import com.farmbalance.recommend.domain.RecommendMode;

import java.util.Map;

/**
 * 재배 가이드 캐시 키용 경험 수준 (novice | experienced) 판별
 */
public final class CropGuideExperienceResolver {

    private CropGuideExperienceResolver() {
    }

    public static String resolve(long cropId, Map<String, Object> request, FarmCultivationContext ctx) {
        String advice = stringVal(request.get("advice_type"));
        if ("IN_SEASON_COACHING".equals(advice)) {
            return "experienced";
        }

        String requested = CropGuideCacheKey.normalizeExperience(stringVal(request.get("experience_level")));
        if ("experienced".equals(requested)) {
            return "experienced";
        }

        if (ctx != null && ctx.getItems() != null) {
            for (CultivationContextItem item : ctx.getItems()) {
                if (item.getCropId() != null
                        && item.getCropId() == cropId
                        && item.isHasHarvestRecord()
                        && item.getTotalHarvestKg() != null
                        && item.getTotalHarvestKg() > 0) {
                    return "experienced";
                }
            }
        }

        return "novice";
    }

    public static RecommendMode resolveRecommendMode(Map<String, Object> request, FarmCultivationContext ctx) {
        String advice = stringVal(request.get("advice_type"));
        if ("IN_SEASON_COACHING".equals(advice)) {
            return RecommendMode.MANAGE;
        }
        String mode = stringVal(request.get("recommend_mode"));
        if (!mode.isEmpty()) {
            try {
                return RecommendMode.valueOf(mode.toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        if (ctx != null && ctx.hasRegistrations() && !ctx.inSeasonItems().isEmpty()) {
            return RecommendMode.MIXED;
        }
        return RecommendMode.PLAN;
    }

    private static String stringVal(Object o) {
        return o != null ? o.toString().trim() : "";
    }
}
