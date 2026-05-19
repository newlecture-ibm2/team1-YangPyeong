package com.farmbalance.shop.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.in.GetProductUseCase;
import com.farmbalance.shop.application.port.in.ManageProductUseCase;
import com.farmbalance.shop.application.port.out.UploadRepository;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.Product;
import com.farmbalance.shop.domain.ProductStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 상품 서비스 (UseCase 구현체).
 * Domain 객체만 사용합니다.
 */
@Service
@Transactional(readOnly = true)
public class ProductService implements GetProductUseCase, ManageProductUseCase {

    private final ProductRepository productRepository;
    private final UploadRepository uploadRepository;

    public ProductService(ProductRepository productRepository, UploadRepository uploadRepository) {
        this.productRepository = productRepository;
        this.uploadRepository = uploadRepository;
    }

    // ── GetProductUseCase 구현 ──

    @Override
    public List<Product> getProducts(String category, String sort, String keyword, int page, int size) {
        return productRepository.findAll(category, sort, keyword, page, size);
    }

    @Override
    public long countProducts(String category, String keyword) {
        return productRepository.count(category, keyword);
    }

    @Override
    public Product getProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    // ── ManageProductUseCase 구현 ──

    @Override
    @Transactional
    public Product registerProduct(Long sellerId, String name, int price, int stock,
            String description, String categoryName, List<String> imageUrls) {
        Product product = new Product(
                null, sellerId, null, null, categoryName,
                name, price, stock, description, 0,
                ProductStatus.PENDING, imageUrls, LocalDateTime.now());

        Product saved = productRepository.save(product);

        // 이미지 저장
        if (imageUrls != null && !imageUrls.isEmpty()) {
            uploadRepository.saveAll("PRODUCT", saved.getId(), imageUrls);
        }

        return saved;
    }

    @Override
    @Transactional
    public Product updateProduct(Long sellerId, Long productId, String name, int price, int stock,
            String description, String categoryName, List<String> imageUrls) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!product.getSellerId().equals(sellerId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        // 검수중 상품은 콘텐츠(이름·설명·카테고리·이미지) 변경 불가 — 가격·재고만 허용
        if (product.getStatus() == ProductStatus.PENDING) {
            throw new BusinessException(ErrorCode.PRODUCT_PENDING_CONTENT_LOCKED);
        }

        product.update(name, price, stock, description, null, categoryName);

        // 콘텐츠 수정 시 재검수를 위해 PENDING 상태로 전환
        product.changeStatus(ProductStatus.PENDING);

        // 이미지 교체: 기존 삭제 후 재등록
        uploadRepository.deleteByEntity("PRODUCT", productId);
        if (imageUrls != null && !imageUrls.isEmpty()) {
            uploadRepository.saveAll("PRODUCT", productId, imageUrls);
        }

        return productRepository.save(product);
    }

    @Override
    @Transactional
    public Product updateInventory(Long sellerId, Long productId, Integer price, Integer stock) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!product.getSellerId().equals(sellerId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        // price/stock 중 null이면 기존 값 유지
        int newPrice = price != null ? price : product.getPrice();
        int newStock = stock != null ? stock : product.getStock();

        if (newPrice <= 0) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        if (newStock < 0)  throw new BusinessException(ErrorCode.VALIDATION_ERROR);

        // 가격·재고만 변경 — 상태(status) 는 그대로 유지 (PENDING이어도 통과)
        product.updateInventory(newPrice, newStock);
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public Product changeProductStatus(Long sellerId, Long productId, String newStatus) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!product.getSellerId().equals(sellerId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        try {
            ProductStatus status = ProductStatus.valueOf(newStatus.toUpperCase());
            // Product 도메인 엔티티의 상태 변경 로직 (Setter가 없으므로 update 메서드 혹은 별도 메서드 사용)
            // 여기서는 Product 에 별도로 changeStatus() 메서드를 만들어야 함
            product.changeStatus(status);
            return productRepository.save(product);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }

    @Override
    @Transactional
    public void deleteProduct(Long sellerId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!product.getSellerId().equals(sellerId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        productRepository.softDelete(productId);
    }

    @Override
    public List<Product> getSellerProducts(Long sellerId) {
        return productRepository.findBySellerId(sellerId);
    }
}
