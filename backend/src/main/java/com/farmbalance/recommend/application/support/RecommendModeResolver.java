package com.farmbalance.recommend.application.support;

import com.farmbalance.recommend.domain.FarmCultivationContext;
import com.farmbalance.recommend.domain.RecommendMode;
import org.springframework.stereotype.Component;

@Component
public class RecommendModeResolver {

    public RecommendMode resolve(FarmCultivationContext ctx) {
        if (ctx == null || !ctx.hasRegistrations()) {
            return RecommendMode.PLAN;
        }
        long inSeason = ctx.inSeasonItems().size();
        long planned = ctx.plannedOnlyItems().size();
        if (inSeason == 0) {
            return RecommendMode.PLANNED;
        }
        if (planned == 0) {
            return RecommendMode.MANAGE;
        }
        return RecommendMode.MIXED;
    }
}
