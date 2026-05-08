package com.farmbalance.community.application.port.in;

public interface ReportCommentUseCase {
    void reportComment(Long commentId, Long userId, String reason);
}
