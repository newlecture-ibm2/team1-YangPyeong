package com.farmbalance.admin.application.service;

import com.farmbalance.admin.adapter.in.web.dto.AdminShopProductResponse;
import com.farmbalance.admin.application.port.in.ManageShopUseCase;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.Product;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ADM-009 상점 관리 UseCase 구현체
 * [리팩터링] AdminProductPort(JdbcTemplate) → ProductRepository(JPA) 경유
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopManagementService implements ManageShopUseCase {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public List<AdminShopProductResponse> getProducts(String keyword, String category, String status, String sort, int page, int size) {
        List<String> statuses = status != null && !status.isEmpty() ? List.of(status.split(",")) : List.of("ALL");
        return productRepository.findAdminProducts(keyword, category, statuses, sort, page, size).stream()
                .map(product -> {
                    String sellerName = userRepository.findById(product.getSellerId())
                            .map(User::getName)
                            .orElse("알 수 없음");
                    return AdminShopProductResponse.from(product, sellerName);
                })
                .collect(Collectors.toList());
    }

    @Override
    public long countProducts(String keyword, String category, String status) {
        List<String> statuses = status != null && !status.isEmpty() ? List.of(status.split(",")) : List.of("ALL");
        return productRepository.countAdminProducts(keyword, category, statuses);
    }

    @Override
    @Transactional
    public void updateProductStatus(Long productId, String status) {
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        productRepository.updateStatus(productId, status);
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId) {
        productRepository.softDelete(productId);
    }
}
