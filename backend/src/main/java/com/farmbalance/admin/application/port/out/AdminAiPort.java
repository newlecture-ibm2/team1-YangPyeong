package com.farmbalance.admin.application.port.out;

import java.util.List;

public interface AdminAiPort {

    List<ShopAuditResultDto> auditShopBatch(List<ShopAuditItemDto> items);

    List<ModerationResultDto> moderatePostBatch(List<ModerationItemDto> items);

    // --- DTOs ---
    record ShopAuditItemDto(Long productId, String productName, String category, int price, String description) {}
    
    record ShopAuditResultDto(Long productId, boolean valid, String reason) {}

    record ModerationItemDto(Long postId, String title, String content) {}

    record ModerationResultDto(Long postId, boolean clean, String reason) {}
}
