package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.shop.adapter.out.persistence.entity.UploadJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.entity.ProductCategoryJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.entity.ProductJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.UploadJpaRepository;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductCategoryJpaRepository;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductJpaRepository;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.Product;
import com.farmbalance.shop.domain.ProductStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 상품 영속성 어댑터 (Output Port 구현).
 * Domain ↔ JPA Entity 변환을 담당합니다.
 */
@Component
public class ProductPersistenceAdapter implements ProductRepository {

    private final ProductJpaRepository productJpaRepository;
    private final ProductCategoryJpaRepository categoryJpaRepository;
    private final UploadJpaRepository uploadJpaRepository;

    public ProductPersistenceAdapter(ProductJpaRepository productJpaRepository,
                                     ProductCategoryJpaRepository categoryJpaRepository,
                                     UploadJpaRepository uploadJpaRepository) {
        this.productJpaRepository = productJpaRepository;
        this.categoryJpaRepository = categoryJpaRepository;
        this.uploadJpaRepository = uploadJpaRepository;
    }

    @Override
    public Product save(Product product) {
        // 카테고리명으로 ID 조회
        Long categoryId = product.getCategoryId();
        if (categoryId == null && product.getCategoryName() != null) {
            categoryId = categoryJpaRepository.findByName(product.getCategoryName())
                    .map(ProductCategoryJpaEntity::getId)
                    .orElse(null);
        }

        ProductJpaEntity entity;
        if (product.getId() != null) {
            // 수정
            entity = productJpaRepository.findById(product.getId()).orElseThrow();
            entity.update(product.getName(), product.getPrice(), product.getStock(),
                    product.getDescription(), categoryId);
            entity.updateSalesCount(product.getSalesCount());
            entity.updateStatus(product.getStatus().name());
        } else {
            // 신규
            entity = ProductJpaEntity.builder()
                    .sellerId(product.getSellerId())
                    .categoryId(categoryId)
                    .name(product.getName())
                    .price(product.getPrice())
                    .stock(product.getStock())
                    .description(product.getDescription())
                    .salesCount(product.getSalesCount())
                    .status(product.getStatus().name())
                    .build();
        }

        ProductJpaEntity saved = productJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Product> findById(Long id) {
        return productJpaRepository.findByIdAndDeletedAtIsNull(id)
                .map(this::toDomain);
    }

    @Override
    public List<Product> findAll(String category, String sort, String keyword, int page, int size) {
        Sort jpaSort = resolveSort(sort);
        Pageable pageable = PageRequest.of(page, size, jpaSort);
        return productJpaRepository.findActiveProducts(category, keyword, pageable)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long count(String category, String keyword) {
        return productJpaRepository.countActiveProducts(category, keyword);
    }

    @Override
    public List<Product> findBySellerId(Long sellerId) {
        return productJpaRepository.findBySellerIdAndDeletedAtIsNullOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void softDelete(Long id) {
        productJpaRepository.findById(id).ifPresent(ProductJpaEntity::softDelete);
    }

    // ── 변환 메서드 ──

    private Product toDomain(ProductJpaEntity entity) {
        // 카테고리명 조회
        String categoryName = null;
        if (entity.getCategoryId() != null) {
            categoryName = categoryJpaRepository.findById(entity.getCategoryId())
                    .map(ProductCategoryJpaEntity::getName)
                    .orElse(null);
        }

        // 파일 URL 목록 조회
        List<String> imageUrls = uploadJpaRepository
                .findByEntityTypeAndEntityIdAndDeletedAtIsNullOrderByDisplayOrderAsc("PRODUCT", entity.getId())
                .stream()
                .map(UploadJpaEntity::getFileUrl)
                .collect(Collectors.toList());

        return new Product(
                entity.getId(),
                entity.getSellerId(),
                null, // sellerName은 Controller에서 별도 처리
                entity.getCategoryId(),
                categoryName,
                entity.getName(),
                entity.getPrice(),
                entity.getStock(),
                entity.getDescription(),
                entity.getSalesCount(),
                ProductStatus.valueOf(entity.getStatus()),
                imageUrls,
                entity.getCreatedAt()
        );
    }

    private Sort resolveSort(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        return switch (sort) {
            case "priceLow" -> Sort.by(Sort.Direction.ASC, "price");
            case "priceHigh" -> Sort.by(Sort.Direction.DESC, "price");
            case "bestSelling" -> Sort.by(Sort.Direction.DESC, "salesCount");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    @Override
    public List<Product> findAllProducts() {
        return productJpaRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void updateStatus(Long id, String status) {
        productJpaRepository.findById(id).ifPresent(entity -> {
            entity.updateStatus(status);
            productJpaRepository.save(entity);
        });
    }
}
