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
        sb.append("[분석모드] ").append(mode.name()).append('\n');

        double pyeong = farm.getArea() != null ? farm.getArea() / 3.3058 : 0;
        sb.append("[농장] 위치: ").append(nullToEmpty(farm.getAddress()))
                .append(", 면적: ").append(String.format("%.1f", pyeong)).append("평")
                .append(", 토양pH: ").append(farm.getPh() != null ? farm.getPh() : 0)
                .append(", 유기물: ").append(farm.getOrganicMatter() != null ? farm.getOrganicMatter() : 0)
                .append(", 토성: ").append(farm.getSoilType() != null ? farm.getSoilType() : "미상")
                .append('\n');

        if (soilMismatchSummary != null && !soilMismatchSummary.isBlank()) {
            sb.append("[토양 적합 비교] ").append(soilMismatchSummary).append('\n');
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
        sb.append('[').append(label).append("] ").append(item.getCropName());
        if (item.getCultivationAreaSqm() != null) {
            sb.append(", 재배면적 ").append(String.format("%.0f", item.getCultivationAreaSqm())).append('㎡');
        }
        if (item.getFarmerEstimatedYield() != null) {
            sb.append(", 예상 수확 ").append(String.format("%.0f", item.getFarmerEstimatedYield()))
                    .append(item.getYieldUnit() != null ? item.getYieldUnit() : "kg");
        }
        if (item.getSowingDate() != null) {
            sb.append(", 파종일 ").append(item.getSowingDate());
        }
        if (item.isHasHarvestRecord() && item.getTotalHarvestKg() != null && item.getTotalHarvestKg() > 0) {
            sb.append(", 실제 수확 누적 ").append(String.format("%.0f", item.getTotalHarvestKg())).append("kg");
        }
        sb.append(", 관리 이력 ").append(item.getRealActivityCount()).append("건");
        if (!item.getRecentActivitySummaries().isEmpty()) {
            sb.append("\n  최근: ").append(String.join(" | ", item.getRecentActivitySummaries()));
        }
        sb.append('\n');
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
