package com.farmbalance.community.application.port.in;

import com.farmbalance.community.domain.model.Post;

public interface CreatePostUseCase {
    Post createPost(Long authorId, Long categoryId, String title, String content, boolean isNotice);
}
