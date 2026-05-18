package com.farmbalance.balance.application.port.out;

public interface LoadFarmSupplyPort {
    /**
     * 특정 작물의 현재(ACTIVE 상태) 농가 총 예상 수확량(kg)을 조회합니다.
     */
    Double sumEstimatedYieldByCropName(String cropName);

    /**
     * 모든 작물의 현재 농가 총 예상 수확량(kg)을 일괄 조회하여 맵(작물명 -> 수확량)으로 반환합니다.
     */
    java.util.Map<String, Double> sumAllEstimatedYields();
}
