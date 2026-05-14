package com.farmbalance.admin.adapter.out.persistence.repository;

import com.farmbalance.admin.adapter.out.persistence.entity.UserSanctionLogJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSanctionLogJpaRepository extends JpaRepository<UserSanctionLogJpaEntity, Long> {
    List<UserSanctionLogJpaEntity> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);
}
