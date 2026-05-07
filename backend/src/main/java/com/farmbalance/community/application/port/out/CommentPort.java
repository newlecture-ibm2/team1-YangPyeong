package com.farmbalance.community.application.port.out;

import com.farmbalance.community.domain.model.Comment;

import java.util.List;
import java.util.Optional;

public interface CommentPort {
    Comment save(Comment comment);
    Optional<Comment> findById(Long id);
    List<Comment> findByPostId(Long postId);
    long countByPostId(Long postId);
    boolean existsAcceptedByPostId(Long postId);
    void deleteById(Long id);
}
