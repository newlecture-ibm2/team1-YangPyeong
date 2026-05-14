package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.shop.adapter.out.persistence.repository.OrderJpaRepository;
import com.farmbalance.user.application.port.out.CheckShopOrderPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 유저 도메인의 CheckShopOrderPort 구현체.
 * 해당 유저의 상점 주문(거래) 존재 여부를 조회합니다.
 */
@Component
@RequiredArgsConstructor
public class ShopOrderCheckAdapter implements CheckShopOrderPort {

    private final OrderJpaRepository orderJpaRepository;

    @Override
    public boolean hasAnyOrderByUserId(Long userId) {
        return orderJpaRepository.existsByBuyerIdAndDeletedAtIsNull(userId);
    }
}
