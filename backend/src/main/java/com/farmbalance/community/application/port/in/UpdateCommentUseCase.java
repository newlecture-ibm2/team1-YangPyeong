package com.farmbalance.community.application.port.in;

import com.farmbalance.community.domain.model.Comment;

public interface UpdateCommentUseCase {
    Comment updateComment(Long commentId, Long userId, String content);
}
