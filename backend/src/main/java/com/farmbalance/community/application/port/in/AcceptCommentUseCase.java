package com.farmbalance.community.application.port.in;

public interface AcceptCommentUseCase {
    void acceptComment(Long commentId, Long requesterId);
}
