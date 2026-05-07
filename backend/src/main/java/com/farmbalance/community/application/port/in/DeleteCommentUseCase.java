package com.farmbalance.community.application.port.in;

public interface DeleteCommentUseCase {
    void deleteComment(Long commentId, Long requesterId, boolean isAdmin);
}
