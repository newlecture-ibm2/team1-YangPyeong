package com.farmbalance.gov.application.service;

import com.farmbalance.gov.application.port.in.*;
import com.farmbalance.gov.application.port.out.GovDataQueryPort;
import com.farmbalance.gov.application.result.*;
import com.farmbalance.gov.domain.model.GovUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GovQueryService implements GetGovUserInfoUseCase, GetGovDashboardUseCase, GetCultivationStatusUseCase, GetYearCompareUseCase, GetSalesStatusUseCase {

    private final GovDataQueryPort queryPort;

    @Override
    public GovUserInfo getGovUserInfo(Long userId) {
        return queryPort.getGovUserInfo(userId);
    }

    @Override
    public GovDashboardResult getDashboardData(String govRegion) {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> farms = queryPort.queryFarms(today.minusYears(10), today, govRegion, null);
        List<Map<String, Object>> balance = queryPort.queryBalance(today, today, govRegion, null);
        
        long surplus = balance.stream().filter(b -> b.get("상태").equals("과잉")).count();
        long shortage = balance.stream().filter(b -> b.get("상태").equals("부족")).count();
        int totalCrops = (int) balance.stream().map(b -> b.get("작물명")).distinct().count();
        
        var summary = GovDashboardResult.DashboardSummary.builder()
            .totalFarms(farms.size()).totalCrops(totalCrops).surplusCount((int) surplus).shortageCount((int) shortage).build();

        var warnings = balance.stream()
            .filter(b -> !b.get("상태").equals("균형"))
            .map(b -> GovDashboardResult.WarningItem.builder()
                .cropName((String) b.get("작물명"))
                .supplyRate(((Number) b.get("공급률")).doubleValue())
                .status((String) b.get("상태"))
                .level((String) b.get("경고수준"))
                .advice((String) b.get("권고사항")).build())
            .limit(10).toList();

        var monthly = List.of(
            GovDashboardResult.MonthlySupply.builder().label("봄").supply(10900.0).demand(10330.0).build(),
            GovDashboardResult.MonthlySupply.builder().label("여름").supply(13150.0).demand(12300.0).build(),
            GovDashboardResult.MonthlySupply.builder().label("가을").supply(14550.0).demand(13350.0).build(),
            GovDashboardResult.MonthlySupply.builder().label("겨울").supply(7600.0).demand(8200.0).build()
        );

        Map<String, Long> countMap = new java.util.HashMap<>();
        for (Map<String, Object> f : farms) {
            String r = (String) f.get("읍면");
            countMap.put(r, countMap.getOrDefault(r, 0L) + 1);
        }
        var regions = countMap.entrySet().stream()
            .map(e -> GovDashboardResult.RegionDistribution.builder().region(e.getKey()).count(e.getValue().intValue()).build())
            .sorted((a, b) -> b.getCount() - a.getCount())
            .toList();

        return GovDashboardResult.builder()
            .summary(summary)
            .warningItems(warnings)
            .monthlySupply(monthly)
            .regionDistribution(regions)
            .build();
    }

    @Override
    public List<GovCultivationResult> getCultivationStatus(Integer year, String govRegion, String town, String crop) {
        LocalDate start = LocalDate.of(year != null ? year : 2025, 1, 1);
        LocalDate end = LocalDate.of(year != null ? year : 2025, 12, 31);
        return queryPort.queryCultivation(start, end, govRegion, town).stream()
            .filter(r -> crop == null || r.get("작물명").equals(crop))
            .map(r -> GovCultivationResult.builder()
                .region((String) r.get("읍면"))
                .farmCount(1)
                .areaM2(((Number) r.get("재배면적㎡")).doubleValue())
                .mainCrop((String) r.get("작물명"))
                .expectedTon(((Number) r.get("예상생산량kg")).doubleValue())
                .build())
            .toList();
    }

    @Override
    public List<GovCompareResult> getYearCompare(Integer baseYear, Integer compareYear, String crop, String govRegion) {
        int y1 = baseYear != null ? baseYear : 2025;
        int y2 = compareYear != null ? compareYear : 2026;
        List<Map<String, Object>> list1 = queryPort.queryCultivation(LocalDate.of(y1,1,1), LocalDate.of(y1,12,31), govRegion, null);
        List<Map<String, Object>> list2 = queryPort.queryCultivation(LocalDate.of(y2,1,1), LocalDate.of(y2,12,31), govRegion, null);

        Map<String, Double> map1 = new java.util.HashMap<>();
        for (Map<String, Object> r : list1) {
            String c = (String) r.get("작물명");
            if (crop != null && !crop.equals(c)) continue;
            map1.put(c, map1.getOrDefault(c, 0.0) + ((Number) r.get("예상생산량kg")).doubleValue());
        }
        
        Map<String, Double> map2 = new java.util.HashMap<>();
        for (Map<String, Object> r : list2) {
            String c = (String) r.get("작물명");
            if (crop != null && !crop.equals(c)) continue;
            map2.put(c, map2.getOrDefault(c, 0.0) + ((Number) r.get("예상생산량kg")).doubleValue());
        }

        List<GovCompareResult> res = new java.util.ArrayList<>();
        java.util.Set<String> allCrops = new java.util.HashSet<>(map1.keySet());
        allCrops.addAll(map2.keySet());
        for (String c : allCrops) {
            double v1 = map1.getOrDefault(c, 0.0);
            double v2 = map2.getOrDefault(c, 0.0);
            double diff = v2 - v1;
            double pct = v1 == 0 ? 0 : (diff / v1) * 100;
            res.add(GovCompareResult.builder().crop(c).prevYearTon(v1).currentYearTon(v2).diffTon(diff).diffRate(pct).build());
        }
        return res;
    }

    @Override
    public GovSalesResult getSalesData(String govRegion) {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> sales = queryPort.querySales(today.minusMonths(1), today, govRegion, null);
        
        double totalRev = sales.stream().mapToDouble(s -> ((Number) s.get("매출액")).doubleValue()).sum();
        long count = sales.size();
        var summary = GovSalesResult.SalesSummary.builder()
            .totalAmount(totalRev+"").txCount((int) count).activeSellers(0).momRate("0.0").build();

        Map<String, Integer> countMap = new java.util.HashMap<>();
        Map<String, Double> revMap = new java.util.HashMap<>();
        for (Map<String, Object> s : sales) {
            String p = (String) s.get("상품명");
            countMap.put(p, countMap.getOrDefault(p, 0) + ((Number) s.get("판매량")).intValue());
            revMap.put(p, revMap.getOrDefault(p, 0.0) + ((Number) s.get("매출액")).doubleValue());
        }
        var top = countMap.entrySet().stream()
            .map(e -> GovSalesResult.TopProductRow.builder()
                .rank(0).productName(e.getKey()).seller("")
                .salesVolume(e.getValue())
                .revenue(String.valueOf(revMap.get(e.getKey()))).build())
            .sorted((a,b) -> Double.compare(Double.parseDouble(b.getRevenue()), Double.parseDouble(a.getRevenue())))
            .limit(5).toList();

        var monthly = List.of(
            GovSalesResult.MonthlySales.builder().month("1월").amount(120000).build(),
            GovSalesResult.MonthlySales.builder().month("2월").amount(185000).build(),
            GovSalesResult.MonthlySales.builder().month("3월").amount(256000).build(),
            GovSalesResult.MonthlySales.builder().month("4월").amount(305000).build()
        );

        return GovSalesResult.builder()
            .summary(summary)
            .topProducts(top)
            .monthlySales(monthly)
            .build();
    }
}
