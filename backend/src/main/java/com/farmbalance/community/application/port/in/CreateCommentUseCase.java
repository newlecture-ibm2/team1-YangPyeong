package com.farmbalance.community.application.port.in;

import com.farmbalance.community.domain.model.Comment;

public interface CreateCommentUseCase {
    Comment createComment(Long postId, Long authorId, String content);
}
