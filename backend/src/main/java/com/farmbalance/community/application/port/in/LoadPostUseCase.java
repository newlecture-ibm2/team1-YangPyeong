package com.farmbalance.community.application.port.in;

import com.farmbalance.community.domain.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LoadPostUseCase {
    Page<Post> getPosts(List<Long> categoryIds, String keyword, String searchType, Pageable pageable);
    Post getPostDetail(Long postId);
}
