package com.farmbalance.farm.adapter.out.persistence.repository;

import com.farmbalance.farm.adapter.out.persistence.entity.FarmJpaEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FarmJpaRepository extends JpaRepository<FarmJpaEntity, Long> {

    // 특정 사용자의 농장 목록 조회
    List<FarmJpaEntity> findAllByUserId(Long userId);

    // 농장 이름으로 부분 일치 검색
    List<FarmJpaEntity> findByNameContaining(String name);

    // PNU 중복 체크
    boolean existsByPnuCode(String pnuCode);

    // PNU 코드로 조회
    Optional<FarmJpaEntity> findByPnuCode(String pnuCode);

    // 인증 상태별 농장 목록 조회 (Admin 승인 관리용)
    List<FarmJpaEntity> findByCertificationStatusOrderByCreatedAtDesc(
            com.farmbalance.farm.domain.CertificationStatus certificationStatus);

    /**
     * 비관적 락을 적용한 농장 조회 (면적 검증 시 동시성 제어용)
     * 동시에 여러 재배 등록 요청이 들어와도 순차적으로 처리되어 데이터 정합성을 보장합니다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FarmJpaEntity f WHERE f.id = :farmId")
    Optional<FarmJpaEntity> findByIdWithLock(@Param("farmId") Long farmId);
}
