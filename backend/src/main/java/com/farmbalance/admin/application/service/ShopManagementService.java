package com.farmbalance.admin.application.service;

import com.farmbalance.admin.adapter.in.web.dto.AdminShopProductResponse;
import com.farmbalance.admin.application.port.in.ManageShopUseCase;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.Product;
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

    @Override
    public List<AdminShopProductResponse> getAllProducts() {
        return productRepository.findAllProducts().stream()
                .map(AdminShopProductResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateProductStatus(Long productId, String status) {
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        productRepository.updateStatus(productId, status);
    }
}
