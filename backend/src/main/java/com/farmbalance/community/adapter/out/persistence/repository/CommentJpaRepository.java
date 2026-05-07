package com.farmbalance.community.adapter.out.persistence.repository;

import com.farmbalance.community.adapter.out.persistence.entity.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentJpaRepository extends JpaRepository<CommentEntity, Long> {

    @Query("SELECT c FROM CommentEntity c WHERE c.post.id = :postId AND c.deletedAt IS NULL ORDER BY c.createdAt ASC")
    List<CommentEntity> findByPostId(@Param("postId") Long postId);

    long countByPostIdAndDeletedAtIsNull(Long postId);

    @Query("SELECT COUNT(c) > 0 FROM CommentEntity c WHERE c.post.id = :postId AND c.accepted = true AND c.deletedAt IS NULL")
    boolean existsAcceptedByPostId(@Param("postId") Long postId);
}
