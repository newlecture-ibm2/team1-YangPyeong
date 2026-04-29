package com.farmbalance.farm.adapter.out.persistence.repository;

import com.farmbalance.farm.adapter.out.persistence.entity.FarmJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FarmJpaRepository extends JpaRepository<FarmJpaEntity, Long> {

    // 특정 사용자의 농장 목록 조회
    List<FarmJpaEntity> findAllByUserId(Long userId);

    // 농장 이름으로 부분 일치 검색
    List<FarmJpaEntity> findByNameContaining(String name);

    // PNU 중복 체크
    boolean existsByPnuCode(String pnuCode);

    // PNU 코드로 조회
    java.util.Optional<FarmJpaEntity> findByPnuCode(String pnuCode);
}
