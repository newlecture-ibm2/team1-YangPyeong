package com.farmbalance.community.adapter.out.persistence.repository;

import com.farmbalance.community.adapter.out.persistence.entity.PostCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostCategoryJpaRepository extends JpaRepository<PostCategoryEntity, Long> {
    Optional<PostCategoryEntity> findByName(String name);
}
