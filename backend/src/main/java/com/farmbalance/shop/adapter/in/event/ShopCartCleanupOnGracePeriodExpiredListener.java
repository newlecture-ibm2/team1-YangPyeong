package com.farmbalance.shop.adapter.in.event;

import com.farmbalance.shop.adapter.out.persistence.repository.CartItemJpaRepository;
import com.farmbalance.user.domain.event.UserGracePeriodExpiredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 유저 탈퇴 30일 유예기간 만료 시 장바구니/찜 데이터 일괄 Hard Delete.
 * 탈퇴 당일(Day 0)에는 복구 가능성을 위해 유지하고,
 * 유예기간 만료 후 주인 없는 데이터를 영구 삭제합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShopCartCleanupOnGracePeriodExpiredListener {

    private final CartItemJpaRepository cartItemJpaRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserGracePeriodExpired(UserGracePeriodExpiredEvent event) {
        cartItemJpaRepository.deleteByUserId(event.userId());
        log.info("탈퇴 유예 만료 → 장바구니/찜 일괄 삭제: userId={}", event.userId());
    }
}
