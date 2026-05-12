package com.farmbalance.shop.adapter.in.event;

import com.farmbalance.shop.adapter.out.persistence.entity.ProductJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductJpaRepository;
import com.farmbalance.user.domain.event.UserReactivatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * 유저 계정이 30일 이내에 복구(재활성화)되었을 때,
 * Soft Delete 상태였던 해당 유저의 상품들을 다시 원상 복구(노출)시킵니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShopProductRestoreOnUserReactivatedListener {

    private final ProductJpaRepository productJpaRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserReactivated(UserReactivatedEvent event) {
        // deletedAt이 null이 아닌(Soft Delete된) 해당 유저의 상품들 조회
        List<ProductJpaEntity> products =
                productJpaRepository.findBySellerIdAndDeletedAtIsNotNull(event.userId());
        if (products.isEmpty()) {
            return;
        }
        for (ProductJpaEntity product : products) {
            product.restore();
        }
        productJpaRepository.saveAll(products);
        log.info("복구된 유저의 상품 Soft Delete 해제: userId={}, productCount={}", event.userId(), products.size());
    }
}
