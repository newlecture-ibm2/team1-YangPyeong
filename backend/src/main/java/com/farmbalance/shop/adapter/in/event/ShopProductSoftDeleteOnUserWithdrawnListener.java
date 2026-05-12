package com.farmbalance.shop.adapter.in.event;

import com.farmbalance.shop.adapter.out.persistence.entity.ProductJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductJpaRepository;
import com.farmbalance.user.domain.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * 유저 탈퇴 당일(Day 0) 해당 유저의 판매 상품을 즉시 Soft Delete.
 * 타인에게 노출되는 상품이 구매되는 사고를 방지합니다.
 * (장바구니/찜은 본인만 접근 가능하므로 Day 0에는 처리하지 않고 30일 후 Hard Delete)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShopProductSoftDeleteOnUserWithdrawnListener {

    private final ProductJpaRepository productJpaRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        List<ProductJpaEntity> products =
                productJpaRepository.findBySellerIdAndDeletedAtIsNullOrderByCreatedAtDesc(event.userId());
        if (products.isEmpty()) {
            return;
        }
        for (ProductJpaEntity product : products) {
            product.softDelete();
        }
        productJpaRepository.saveAll(products);
        log.info("탈퇴 유저 상품 즉시 소프트 삭제: userId={}, productCount={}", event.userId(), products.size());
    }
}
