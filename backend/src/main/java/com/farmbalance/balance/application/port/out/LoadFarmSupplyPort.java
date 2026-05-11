package com.farmbalance.balance.application.port.out;

public interface LoadFarmSupplyPort {
    /**
     * 특정 작물의 현재(ACTIVE 상태) 농가 총 예상 수확량(kg)을 조회합니다.
     */
    Double sumEstimatedYieldByCropName(String cropName);
}
