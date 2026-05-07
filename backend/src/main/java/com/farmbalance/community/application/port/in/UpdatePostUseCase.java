package com.farmbalance.community.application.port.in;

import com.farmbalance.community.domain.model.Post;

public interface UpdatePostUseCase {
    Post updatePost(Long postId, Long requesterId, Long categoryId, String title, String content, boolean isNotice, boolean isAdmin);
}
