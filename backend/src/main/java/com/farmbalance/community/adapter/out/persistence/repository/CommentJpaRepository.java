package com.farmbalance.community.adapter.out.persistence.repository;

import com.farmbalance.community.adapter.out.persistence.entity.CommentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentJpaRepository extends JpaRepository<CommentEntity, Long> {

    @Query("SELECT c FROM CommentEntity c WHERE c.post.id = :postId AND c.isHidden = false ORDER BY c.createdAt ASC")
    List<CommentEntity> findByPostId(@Param("postId") Long postId);

    @Query("SELECT c FROM CommentEntity c WHERE c.id = :id AND c.deletedAt IS NULL AND c.isHidden = false")
    Optional<CommentEntity> findActiveById(@Param("id") Long id);

    @Query("SELECT c.id, c.content FROM CommentEntity c WHERE c.id IN :ids AND c.deletedAt IS NULL")
    List<Object[]> findActiveContentsByIds(@Param("ids") List<Long> ids);

    @Query("SELECT c.post.id, COUNT(c) FROM CommentEntity c " +
           "WHERE c.post.id IN :postIds AND c.deletedAt IS NULL AND c.isHidden = false GROUP BY c.post.id")
    List<Object[]> countByPostIds(@Param("postIds") List<Long> postIds);

    @Query("SELECT c FROM CommentEntity c JOIN FETCH c.post p " +
           "WHERE c.authorId = :authorId AND c.deletedAt IS NULL AND p.deletedAt IS NULL " +
           "AND (:status = 'ALL' OR (:status = 'ACTIVE' AND c.isHidden = false) OR (:status = 'HIDDEN' AND c.isHidden = true))")
    Page<CommentEntity> findByAuthorIdAndStatus(@Param("authorId") Long authorId, @Param("status") String status, Pageable pageable);

    long countByPostIdAndDeletedAtIsNullAndIsHiddenFalse(Long postId);

    @Query("SELECT COUNT(c) > 0 FROM CommentEntity c WHERE c.post.id = :postId AND c.accepted = true AND c.deletedAt IS NULL AND c.isHidden = false")
    boolean existsAcceptedByPostId(@Param("postId") Long postId);
}
