package com.farmbalance.recommend.application.port.out;

public interface RecommendPricePort {
    /**
     * 특정 작물의 현재(최근) 1kg당 평균 도매 가격을 조회합니다.
     * @param cropName 작물명
     * @return 1kg당 가격(원). 데이터를 찾을 수 없으면 null 반환.
     */
    Integer getRecentPricePerKg(String cropName);
}
