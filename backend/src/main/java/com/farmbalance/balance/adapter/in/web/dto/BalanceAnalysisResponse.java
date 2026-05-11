package com.farmbalance.balance.adapter.in.web.dto;

import com.farmbalance.balance.domain.BalanceStatus;
import com.farmbalance.balance.domain.SupplyRatioResult;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BalanceAnalysisResponse {
    private String cropName;
    private Integer baseYear;
    private Double supplyRatio;
    private BalanceStatus status;
    private String statusLabel;
    private String message;

    public static BalanceAnalysisResponse from(String cropName, SupplyRatioResult result) {
        double roundedRatio = Math.round(result.getRatio() * 10.0) / 10.0;
        
        return BalanceAnalysisResponse.builder()
                .cropName(cropName)
                .baseYear(result.getBaseYear())
                .supplyRatio(roundedRatio)
                .status(result.getStatus())
                .statusLabel(result.getStatus().getLabel())
                .message(generateMessage(cropName, result.getStatus(), roundedRatio))
                .build();
    }

    private static String generateMessage(String cropName, BalanceStatus status, double ratio) {
        if (status == BalanceStatus.UNKNOWN) {
            return "양평군 " + cropName + "에 대한 통계 기준 데이터가 없어 수급 비율을 계산할 수 없습니다.";
        }
        
        String actionStr = "";
        switch (status) {
            case EXCESS_WARN:
                actionStr = "기준치보다 상당히 높아 가격 하락 및 공급 과잉이 크게 우려됩니다. 다른 작물 재배를 고려해보세요.";
                break;
            case EXCESS_CAUTION:
                actionStr = "기준치보다 다소 높아 공급 과잉이 우려됩니다. 재배 면적을 신중히 검토하세요.";
                break;
            case BALANCED:
                actionStr = "기준치와 비슷하여 수급이 적정한 수준입니다.";
                break;
            case SHORT_CAUTION:
                actionStr = "기준치보다 낮아 공급 부족이 예상됩니다. 재배를 적극 고려해 볼 만합니다.";
                break;
            case SHORT_WARN:
                actionStr = "기준치보다 현저히 낮아 공급 부족이 크게 우려됩니다. 전략적 재배를 적극 권장합니다.";
                break;
            default:
                break;
        }
        return "현재 양평군 " + cropName + " 공급량이 기준치 대비 " + ratio + "% 수준으로, " + actionStr;
    }
}
