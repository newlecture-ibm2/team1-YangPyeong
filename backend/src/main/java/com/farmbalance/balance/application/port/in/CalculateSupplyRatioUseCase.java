package com.farmbalance.balance.application.port.in;

import com.farmbalance.balance.adapter.in.web.dto.BalanceDashboardResponse;
import com.farmbalance.balance.domain.SupplyRatioResult;
import java.util.List;
import java.util.Map;

public interface CalculateSupplyRatioUseCase {
    SupplyRatioResult calculateSupplyRatio(String cropName, Integer year);
    Map<String, SupplyRatioResult> calculateAllSupplyRatios(Integer year);
    SupplyRatioResult recalculate(String cropName);
    List<com.farmbalance.balance.domain.SupplyTrendResult> getSupplyTrend(String cropName);

    /**
     * 로그인 유저 기반 읍면동 수급 대시보드를 조회합니다.
     *
     * @param userId 로그인 유저 ID
     * @param townCode 선택된 읍면동 코드 (null이면 첫 번째 농장의 읍면동 또는 양평군 전체)
     * @return 대시보드 응답 DTO
     */
    BalanceDashboardResponse getDashboard(Long userId, String townCode);
}

