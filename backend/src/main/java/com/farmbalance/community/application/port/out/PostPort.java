package com.farmbalance.community.application.port.out;

import com.farmbalance.community.domain.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.List;
import java.util.Optional;

public interface PostPort {
    Post save(Post post);
    Optional<Post> findById(Long id);
    Optional<Post> findActiveById(Long id);
    Map<Long, String> findActiveTitlesByIds(List<Long> ids);
    Page<Post> findByFilters(List<Long> categoryIds, String keyword, String searchType, Pageable pageable);
    Page<Post> findByAuthorId(Long authorId, Pageable pageable);
    void deleteById(Long id);
}
