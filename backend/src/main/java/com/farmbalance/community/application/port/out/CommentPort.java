package com.farmbalance.community.application.port.out;

import com.farmbalance.community.domain.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CommentPort {
    Comment save(Comment comment);
    Optional<Comment> findById(Long id);
    Optional<Comment> findActiveById(Long id);
    Map<Long, String> findActiveContentsByIds(List<Long> ids);
    Map<Long, Long> findPostIdsByIds(List<Long> ids);
    Map<Long, Long> countByPostIds(List<Long> postIds);
    List<Comment> findByPostId(Long postId);
    Page<Comment> findByAuthorIdAndStatus(Long authorId, String status, Pageable pageable);
    long countByPostId(Long postId);
    boolean existsAcceptedByPostId(Long postId);
    void deleteById(Long id);
}
