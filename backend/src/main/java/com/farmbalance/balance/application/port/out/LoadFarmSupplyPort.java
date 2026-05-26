package com.farmbalance.balance.application.port.out;

import java.util.List;
import java.util.Map;

public interface LoadFarmSupplyPort {
    /**
     * 특정 작물의 현재(ACTIVE 상태) 농가 총 예상 수확량(kg)을 조회합니다.
     */
    Double sumEstimatedYieldByCropName(String cropName);

    /**
     * 모든 작물의 현재 농가 총 예상 수확량(kg)을 일괄 조회하여 맵(작물명 -> 수확량)으로 반환합니다.
     */
    Map<String, Double> sumAllEstimatedYields();

    /**
     * 특정 읍면동(townCode, 7자리)에 해당하는 농장들의 작물별 예상 수확량(kg) 합계를 조회합니다.
     * farms.bjd_code가 7자리 또는 10자리로 혼재되어 있으므로,
     * 정확히 일치(eq) OR 범위 스캔(BETWEEN)의 복합 조건으로 조회합니다.
     *
     * @param townCode 읍면동 코드 (7자리, 예: "4183040")
     * @return 작물명 -> 예상 수확량(kg) 맵
     */
    Map<String, Double> sumEstimatedYieldsByTownCode(String townCode);

    /**
     * 특정 읍면동(townCode, 7자리) 범위 내에서 ACTIVE 재배 등록을 보유한 농가 수를 조회합니다.
     *
     * @param townCode 읍면동 코드 (7자리)
     * @return 참여 농가 수
     */
    int countFarmsByTownCode(String townCode);

    /**
     * 특정 유저가 소유한 농장들의 읍면동(7자리) 코드와 지역명을 조회합니다.
     * regions 테이블과 조인하여 읍면동 이름을 함께 반환합니다.
     *
     * @param userId 유저 ID
     * @return 읍면동 코드-이름 쌍 리스트 [["4183040", "용문면"], ...]
     */
    List<String[]> findTownsByUserId(Long userId);

    /**
     * 플랫폼에 등록된 전체 활성(ACTIVE) 농장 수를 카운트합니다.
     */
    long countAllFarms();

    /**
     * 플랫폼의 전체 활성 사용자 수를 조회합니다.
     */
    long countActiveUsers();

    /**
     * 플랫폼의 누적 AI 작물 추천 건수를 조회합니다.
     */
    long countTotalRecommends();

    /**
     * 플랫폼의 누적 직거래 주문 건수를 조회합니다.
     */
    long countTotalOrders();
}
