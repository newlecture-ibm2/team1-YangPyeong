package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.dto.AdminShopProductDto;
import com.farmbalance.admin.application.port.in.ManageShopUseCase;
import com.farmbalance.admin.application.port.out.AdminAiPort;
import com.farmbalance.admin.application.port.out.AdminAiPort.ShopAuditItemDto;
import com.farmbalance.admin.application.port.out.AdminAiPort.ShopAuditResultDto;
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
    private final AdminAiPort adminAiPort;

    @Override
    public List<AdminShopProductDto> getProducts(String keyword, String category, String status, String sort, int page, int size) {
        List<String> statuses = status != null && !status.isEmpty() ? List.of(status.split(",")) : List.of("ALL");
        return productRepository.findAdminProducts(keyword, category, statuses, sort, page, size).stream()
                .map(product -> {
                    String sellerName = userRepository.findById(product.getSellerId())
                            .map(User::getName)
                            .orElse("알 수 없음");
                    return AdminShopProductDto.from(product, sellerName);
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
    public void updateProductStatus(Long productId, String status, String reason) {
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        productRepository.updateStatus(productId, status, reason);
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId) {
        productRepository.softDelete(productId);
    }

    @Override
    @Transactional
    public int aiAuditPendingProducts() {
        // 1. PENDING 상품 모두 조회
        List<Product> pendingProducts = productRepository.findAdminProducts("", "ALL", List.of("PENDING"), "createdAt", 0, 100);
        if (pendingProducts.isEmpty()) {
            return 0;
        }

        // 2. DTO 변환 (설명은 최대 300자로 자르기)
        List<ShopAuditItemDto> itemsToAudit = pendingProducts.stream().map(p -> {
            String desc = p.getDescription() != null ? p.getDescription() : "";
            if (desc.length() > 300) {
                desc = desc.substring(0, 300);
            }
            return new ShopAuditItemDto(p.getId(), p.getName(), p.getCategoryName(), p.getPrice(), desc);
        }).toList();

        // 3. AI 서버 일괄 요청 (Chunking)
        int processedCount = 0;
        int chunkSize = 20;
        for (int i = 0; i < itemsToAudit.size(); i += chunkSize) {
            List<ShopAuditItemDto> chunk = itemsToAudit.subList(i, Math.min(itemsToAudit.size(), i + chunkSize));
            List<ShopAuditResultDto> results = adminAiPort.auditShopBatch(chunk);

            // 4. 결과에 따라 상태 업데이트
            for (ShopAuditResultDto result : results) {
                if (result.valid()) {
                    productRepository.updateStatus(result.productId(), "ACTIVE", null);
                    processedCount++;
                } else {
                    productRepository.updateStatus(result.productId(), "REJECTED", "[AI 자동 반려] " + result.reason());
                    processedCount++;
                }
            }
        }

        return processedCount;
    }

    @Override
    @Transactional
    public int aiAuditActiveProducts() {
        // 1. ACTIVE 상품 최신 100개 조회 (정기적인 검수를 위해)
        List<Product> activeProducts = productRepository.findAdminProducts("", "ALL", List.of("ACTIVE"), "createdAt", 0, 100);
        if (activeProducts.isEmpty()) {
            return 0;
        }

        List<ShopAuditItemDto> itemsToAudit = activeProducts.stream().map(p -> {
            String desc = p.getDescription() != null ? p.getDescription() : "";
            if (desc.length() > 300) desc = desc.substring(0, 300);
            return new ShopAuditItemDto(p.getId(), p.getName(), p.getCategoryName(), p.getPrice(), desc);
        }).toList();

        // 3. AI 서버 일괄 요청 (Chunking)
        int hiddenCount = 0;
        int chunkSize = 20;
        for (int i = 0; i < itemsToAudit.size(); i += chunkSize) {
            List<ShopAuditItemDto> chunk = itemsToAudit.subList(i, Math.min(itemsToAudit.size(), i + chunkSize));
            List<ShopAuditResultDto> results = adminAiPort.auditShopBatch(chunk);

            for (ShopAuditResultDto result : results) {
                if (!result.valid()) {
                    productRepository.updateStatus(result.productId(), "INACTIVE", "[AI 재검수 적발] " + result.reason());
                    hiddenCount++;
                }
            }
        }

        return hiddenCount;
    }
}
