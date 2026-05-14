package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.GetDashboardUseCase;
import com.farmbalance.admin.application.port.out.AdminDashboardPort;
import com.farmbalance.admin.domain.AdminDashboard;
import com.farmbalance.balance.application.port.in.CalculateSupplyRatioUseCase;
import com.farmbalance.balance.domain.BalanceStatus;
import com.farmbalance.balance.domain.SupplyRatioResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ADM-011 관리자 대시보드 UseCase 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService implements GetDashboardUseCase {

    private final AdminDashboardPort adminDashboardPort;
    private final CalculateSupplyRatioUseCase calculateSupplyRatioUseCase;

    @Override
    public AdminDashboard getDashboard() {
        // 1. DB에서 집계된 기본 통계 조회
        AdminDashboard dashboard = adminDashboardPort.aggregateDashboard();

        // 2. 현재 년도의 전체 작물 밸런스 상태 조회
        int currentYear = LocalDate.now().getYear();
        Map<String, SupplyRatioResult> allRatios = calculateSupplyRatioUseCase.calculateAllSupplyRatios(currentYear);

        // 3. 상태 분포 맵핑
        Map<String, Integer> statusDistribution = new HashMap<>();
        statusDistribution.put(BalanceStatus.BALANCED.name(), 0);
        statusDistribution.put(BalanceStatus.EXCESS_WARN.name(), 0);
        statusDistribution.put(BalanceStatus.EXCESS_CAUTION.name(), 0);
        statusDistribution.put(BalanceStatus.SHORT_WARN.name(), 0);
        statusDistribution.put(BalanceStatus.SHORT_CAUTION.name(), 0);

        List<AdminDashboard.CropBalanceStat> allBalanceStats = new ArrayList<>();

        for (Map.Entry<String, SupplyRatioResult> entry : allRatios.entrySet()) {
            String cropName = entry.getKey();
            SupplyRatioResult result = entry.getValue();
            String status = result.getStatus().name();
            
            if (statusDistribution.containsKey(status)) {
                statusDistribution.put(status, statusDistribution.get(status) + 1);
            }
            
            allBalanceStats.add(new AdminDashboard.CropBalanceStat(cropName, result.getRatio(), status));
        }

        // 4. 과잉 위험 작물 Top 3 (ratio 내림차순)
        List<AdminDashboard.CropBalanceStat> excessRiskCrops = allBalanceStats.stream()
                .filter(stat -> stat.getStatus().equals(BalanceStatus.EXCESS_WARN.name()) || stat.getStatus().equals(BalanceStatus.EXCESS_CAUTION.name()))
                .sorted((a, b) -> Double.compare(b.getRatio(), a.getRatio()))
                .limit(3)
                .collect(Collectors.toList());

        // 5. 부족 위험 작물 Top 3 (ratio 오름차순)
        List<AdminDashboard.CropBalanceStat> shortageRiskCrops = allBalanceStats.stream()
                .filter(stat -> stat.getStatus().equals(BalanceStatus.SHORT_WARN.name()) || stat.getStatus().equals(BalanceStatus.SHORT_CAUTION.name()))
                .sorted(Comparator.comparingDouble(AdminDashboard.CropBalanceStat::getRatio))
                .limit(3)
                .collect(Collectors.toList());

        // 6. 결과 병합
        return AdminDashboard.builder()
                .pendingFarmApprovals(dashboard.getPendingFarmApprovals())
                .pendingReports(dashboard.getPendingReports())
                .activeUsers(dashboard.getActiveUsers())
                .weeklyNewOrders(dashboard.getWeeklyNewOrders())
                .topCropsByArea(dashboard.getTopCropsByArea())
                .topSeedsBySales(dashboard.getTopSeedsBySales())
                .balanceStatusDistribution(statusDistribution)
                .excessRiskCrops(excessRiskCrops)
                .shortageRiskCrops(shortageRiskCrops)
                .build();
    }
}
