package com.farmbalance.user.application.port.out;

/**
 * 상점 주문(거래) 존재 여부를 확인하는 Output Port.
 * 유저 비식별화 시 전자상거래법 보존 기간 분기를 위해 사용합니다.
 * 구현체는 shop 도메인 어댑터에 위치합니다.
 */
public interface CheckShopOrderPort {

    /**
     * 해당 유저가 구매자 또는 판매자로 참여한 주문이 존재하는지 확인합니다.
     *
     * @param userId 확인할 유저 ID
     * @return 주문 존재 여부
     */
    boolean hasAnyOrderByUserId(Long userId);
}
