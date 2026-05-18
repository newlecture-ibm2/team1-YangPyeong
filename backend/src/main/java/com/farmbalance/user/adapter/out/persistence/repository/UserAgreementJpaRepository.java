package com.farmbalance.user.adapter.out.persistence.repository;

import com.farmbalance.user.adapter.out.persistence.entity.UserAgreementJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAgreementJpaRepository extends JpaRepository<UserAgreementJpaEntity, Long> {
    List<UserAgreementJpaEntity> findAllByUserId(Long userId);
}
