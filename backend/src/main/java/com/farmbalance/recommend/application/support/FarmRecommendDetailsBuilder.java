package com.farmbalance.recommend.application.support;

import com.farmbalance.recommend.application.port.out.LoadFarmForRecommendPort.FarmBasicData;
import com.farmbalance.recommend.domain.CultivationContextItem;
import com.farmbalance.recommend.domain.FarmCultivationContext;
import com.farmbalance.recommend.domain.RecommendMode;
import org.springframework.stereotype.Component;

@Component
public class FarmRecommendDetailsBuilder {

    public String build(FarmBasicData farm, FarmCultivationContext ctx, RecommendMode mode, String soilMismatchSummary) {
        StringBuilder sb = new StringBuilder();
        sb.append("[분석모드] ").append(mode.name()).append("\n");
        double pyeong = farm.getArea() != null ? farm.getArea() / 3.3058 : 0;
        sb.append(String.format("[농장] 위치: %s, 면적: %.1f평, 토양pH: %.1f, 유기물: %.1f, 토성: %s%n",
                farm.getAddress(),
                pyeong,
                farm.getPh() != null ? farm.getPh() : 0,
                farm.getOrganicMatter() != null ? farm.getOrganicMatter() : 0,
                farm.getSoilType() != null ? farm.getSoilType() : "미상"));

        if (soilMismatchSummary != null && !soilMismatchSummary.isBlank()) {
            sb.append("[토양 적합 비교] ").append(soilMismatchSummary).append("\n");
        }

        if (ctx != null && ctx.hasRegistrations()) {
            for (CultivationContextItem item : ctx.inSeasonItems()) {
                appendRegistration(sb, "재배 중", item);
            }
            for (CultivationContextItem item : ctx.plannedOnlyItems()) {
                appendRegistration(sb, "재배 예정", item);
            }
        } else {
            sb.append("[재배 현황] 등록된 작물 없음 (신규 재배 추천 모드)\n");
        }

        return sb.toString().trim();
    }

    private void appendRegistration(StringBuilder sb, String label, CultivationContextItem item) {
        sb.append(String.format("[%s] %s", label, item.getCropName()));
        if (item.getCultivationAreaSqm() != null) {
            sb.append(String.format(", 재배면적 %.0f㎡", item.getCultivationAreaSqm()));
        }
        if (item.getFarmerEstimatedYield() != null) {
            sb.append(String.format(", 예상 수확 %.0f%s",
                    item.getFarmerEstimatedYield(),
                    item.getYieldUnit() != null ? item.getYieldUnit() : "kg"));
        }
        if (item.getSowingDate() != null) {
            sb.append(String.format(", 파종일 %s", item.getSowingDate()));
        }
        if (item.isHasHarvestRecord() && item.getTotalHarvestKg() != null && item.getTotalHarvestKg() > 0) {
            sb.append(String.format(", 실제 수확 누적 %.0fkg", item.getTotalHarvestKg()));
        }
        sb.append(String.format(", 관리 이력 %d건", item.getRealActivityCount()));
        if (!item.getRecentActivitySummaries().isEmpty()) {
            sb.append("\n  최근: ").append(String.join(" | ", item.getRecentActivitySummaries()));
        }
        sb.append("\n");
    }
}
