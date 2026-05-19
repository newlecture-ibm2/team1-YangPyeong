package com.farmbalance.community.adapter.out.persistence;

import com.farmbalance.community.adapter.out.persistence.entity.CommentEntity;
import com.farmbalance.community.adapter.out.persistence.entity.PostEntity;
import com.farmbalance.community.adapter.out.persistence.repository.CommentJpaRepository;
import com.farmbalance.community.adapter.out.persistence.repository.PostJpaRepository;
import com.farmbalance.community.application.port.out.CommentPort;
import com.farmbalance.community.domain.model.Comment;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CommentPersistenceAdapter implements CommentPort {

    private final CommentJpaRepository commentJpaRepository;
    private final PostJpaRepository postJpaRepository;

    @Override
    public Comment save(Comment comment) {
        PostEntity post = postJpaRepository.findById(comment.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + comment.getPostId()));

        CommentEntity entity = CommentEntity.fromDomain(comment, post);
        return commentJpaRepository.save(entity).toDomain();
    }

    @Override
    public Optional<Comment> findById(Long id) {
        return commentJpaRepository.findById(id).map(CommentEntity::toDomain);
    }

    @Override
    public Optional<Comment> findActiveById(Long id) {
        return commentJpaRepository.findActiveById(id).map(CommentEntity::toDomain);
    }

    @Override
    public Map<Long, String> findActiveContentsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        return commentJpaRepository.findActiveContentsByIds(ids).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (String) row[1]
                ));
    }

    @Override
    public Map<Long, Long> countByPostIds(List<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) return Map.of();
        return commentJpaRepository.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    public List<Comment> findByPostId(Long postId) {
        return commentJpaRepository.findByPostId(postId).stream()
                .map(CommentEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Page<Comment> findByAuthorIdAndStatus(Long authorId, String status, Pageable pageable) {
        return commentJpaRepository.findByAuthorIdAndStatus(authorId, status, pageable).map(CommentEntity::toDomain);
    }

    @Override
    public long countByPostId(Long postId) {
        return commentJpaRepository.countByPostIdAndDeletedAtIsNullAndIsHiddenFalse(postId);
    }

    @Override
    public boolean existsAcceptedByPostId(Long postId) {
        return commentJpaRepository.existsAcceptedByPostId(postId);
    }

    @Override
    public void deleteById(Long id) {
        commentJpaRepository.deleteById(id);
    }
}
