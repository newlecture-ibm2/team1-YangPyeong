package com.farmbalance.admin.application.port.out;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public interface AdminAiPort {

    List<ShopAuditResultDto> auditShopBatch(List<ShopAuditItemDto> items);

    List<ModerationResultDto> moderatePostBatch(List<ModerationItemDto> items);

    boolean syncRagData();

    // --- DTOs ---
    record ShopAuditItemDto(@JsonProperty("product_id") Long productId, @JsonProperty("product_name") String productName, String category, int price, String description) {}
    
    record ShopAuditResultDto(@JsonProperty("product_id") Long productId, @JsonProperty("is_valid") boolean valid, String reason) {}

    record ModerationItemDto(@JsonProperty("post_id") Long postId, String title, String content) {}

    record ModerationResultDto(@JsonProperty("post_id") Long postId, @JsonProperty("is_clean") boolean clean, String reason) {}
}
