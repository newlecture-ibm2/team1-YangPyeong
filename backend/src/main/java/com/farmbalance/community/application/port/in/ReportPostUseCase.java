package com.farmbalance.community.application.port.in;

public interface ReportPostUseCase {
    void reportPost(Long postId, Long userId, String reason);
}
