package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.dto.AdminShopProductDto;
import com.farmbalance.admin.application.port.in.ManageShopUseCase;
import com.farmbalance.admin.application.port.out.AdminAiPort;
import com.farmbalance.admin.application.port.out.AdminAiPort.ShopAuditItemDto;
import com.farmbalance.admin.application.port.out.AdminAiPort.ShopAuditResultDto;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.Product;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
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
    private final NotificationUseCase notificationUseCase;

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
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        productRepository.updateStatus(productId, status, reason);

        // 검수 결과 알림 발송 (ACTIVE: 승인, REJECTED: 반려)
        if ("ACTIVE".equals(status)) {
            notificationUseCase.createNotification(
                    product.getSellerId(),
                    NotificationType.SYSTEM,
                    NotificationCategory.SYSTEM,
                    "상품 검수 완료",
                    String.format("[%s] 상품이 검수를 통과하여 판매 중입니다.", product.getName()),
                    "/mypage/seller"
            );
        } else if ("REJECTED".equals(status)) {
            String reasonSuffix = (reason != null && !reason.isBlank()) ? " 사유: " + reason : "";
            notificationUseCase.createNotification(
                    product.getSellerId(),
                    NotificationType.SYSTEM,
                    NotificationCategory.SYSTEM,
                    "상품 검수 반려",
                    String.format("[%s] 상품이 반려되었습니다.%s", product.getName(), reasonSuffix),
                    "/mypage/seller"
            );
        }
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

        // 3. AI 서버 일괄 요청
        List<ShopAuditResultDto> results = adminAiPort.auditShopBatch(itemsToAudit);

        // 4. 빠른 조회를 위해 productId → Product 맵 생성
        Map<Long, Product> pendingProductMap = pendingProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // 5. 결과에 따라 정상인 상품만 ACTIVE로 업데이트 + 승인 알림 발송
        int approvedCount = 0;
        for (ShopAuditResultDto result : results) {
            if (result.valid()) {
                productRepository.updateStatus(result.productId(), "ACTIVE", null);

                Product product = pendingProductMap.get(result.productId());
                if (product != null) {
                    notificationUseCase.createNotification(
                            product.getSellerId(),
                            NotificationType.SYSTEM,
                            NotificationCategory.SYSTEM,
                            "상품 검수 완료",
                            String.format("[%s] 상품이 검수를 통과하여 판매 중입니다.", product.getName()),
                            "/mypage/seller"
                    );
                }
                approvedCount++;
            }
            // 비정상(false)인 경우는 PENDING 그대로 둡니다. (또는 REJECTED, INACTIVE + reason으로 처리할 수 있음. 현재는 PENDING)
        }

        return approvedCount;
    }
}
