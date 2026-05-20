package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.shop.adapter.out.persistence.entity.CartItemJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.entity.UploadJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.entity.ProductJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.CartItemJpaRepository;
import com.farmbalance.shop.adapter.out.persistence.repository.UploadJpaRepository;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductCategoryJpaRepository;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductJpaRepository;
import com.farmbalance.shop.application.port.out.CartRepository;
import com.farmbalance.shop.domain.CartItem;
import com.farmbalance.shop.domain.Product;
import com.farmbalance.shop.domain.ProductStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 장바구니 영속성 어댑터 (Output Port 구현).
 */
@Component
public class CartPersistenceAdapter implements CartRepository {

    private final CartItemJpaRepository cartItemJpaRepository;
    private final ProductJpaRepository productJpaRepository;
    private final ProductCategoryJpaRepository categoryJpaRepository;
    private final UploadJpaRepository uploadJpaRepository;

    public CartPersistenceAdapter(CartItemJpaRepository cartItemJpaRepository,
                                  ProductJpaRepository productJpaRepository,
                                  ProductCategoryJpaRepository categoryJpaRepository,
                                  UploadJpaRepository uploadJpaRepository) {
        this.cartItemJpaRepository = cartItemJpaRepository;
        this.productJpaRepository = productJpaRepository;
        this.categoryJpaRepository = categoryJpaRepository;
        this.uploadJpaRepository = uploadJpaRepository;
    }

    @Override
    public CartItem save(CartItem cartItem) {
        CartItemJpaEntity entity;
        if (cartItem.getId() != null) {
            entity = cartItemJpaRepository.findById(cartItem.getId()).orElseThrow();
            entity.updateQuantity(cartItem.getQuantity());
        } else {
            entity = CartItemJpaEntity.builder()
                    .userId(cartItem.getUserId())
                    .productId(cartItem.getProductId())
                    .quantity(cartItem.getQuantity())
                    .build();
        }
        CartItemJpaEntity saved = cartItemJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<CartItem> findByUserId(Long userId) {
        return cartItemJpaRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CartItem> findById(Long id) {
        return cartItemJpaRepository.findByIdAndDeletedAtIsNull(id).map(this::toDomain);
    }

    @Override
    public Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId) {
        return cartItemJpaRepository.findByUserIdAndProductIdAndDeletedAtIsNull(userId, productId)
                .map(this::toDomain);
    }

    @Override
    public void delete(Long id) {
        cartItemJpaRepository.deleteById(id);
    }

    @Override
    public void deleteByUserId(Long userId) {
        cartItemJpaRepository.deleteByUserId(userId);
    }

    // ── 변환 ──

    private CartItem toDomain(CartItemJpaEntity entity) {
        Product product = productJpaRepository.findByIdAndDeletedAtIsNull(entity.getProductId())
                .map(this::toProductDomain)
                .orElse(null);

        return new CartItem(entity.getId(), entity.getUserId(), entity.getProductId(),
                entity.getQuantity(), product);
    }

    private Product toProductDomain(ProductJpaEntity p) {
        String categoryName = null;
        if (p.getCategoryId() != null) {
            categoryName = categoryJpaRepository.findById(p.getCategoryId())
                    .map(ProductCategoryJpaEntity::getName)
                    .orElse(null);
        }

        List<String> imageUrls = uploadJpaRepository
                .findByEntityTypeAndEntityIdAndDeletedAtIsNullOrderByDisplayOrderAsc("PRODUCT", p.getId())
                .stream()
                .map(UploadJpaEntity::getFileUrl)
                .collect(Collectors.toList());

        return new Product(p.getId(), p.getSellerId(), null, p.getCategoryId(), categoryName,
                p.getName(), p.getPrice(), p.getStock(), p.getUnitKg(), p.getDescription(), p.getSalesCount(),
                ProductStatus.valueOf(p.getStatus()), p.getStatusReason(), imageUrls, p.getCreatedAt());
    }
}
