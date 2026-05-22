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

    // 특정 사용자의 농장 목록 조회 (삭제되지 않은 것만)
    List<FarmJpaEntity> findAllByUserIdAndDeletedAtIsNull(Long userId);

    // 농장 이름으로 부분 일치 검색 (삭제되지 않은 것만)
    List<FarmJpaEntity> findByNameContainingAndDeletedAtIsNull(String name);

    // PNU 중복 체크 (삭제되지 않은 농장 중에서)
    boolean existsByPnuCodeAndDeletedAtIsNull(String pnuCode);

    // PNU 코드로 조회 (삭제되지 않은 것만)
    Optional<FarmJpaEntity> findByPnuCodeAndDeletedAtIsNull(String pnuCode);

    // PNU 중복 체크 (다른 농장이 동일 PNU 사용 중인지, 수정 시 본인 농장 제외)
    boolean existsByPnuCodeAndIdNotAndDeletedAtIsNull(String pnuCode, Long id);

    // 타 사용자의 PNU 중복 체크 (본인 제외, 삭제되지 않은 농장 중에서)
    boolean existsByPnuCodeAndUserIdNotAndDeletedAtIsNull(String pnuCode, Long userId);

    @Query("SELECT f FROM FarmJpaEntity f WHERE f.user.id = :userId AND f.deletedAt IS NULL")
    List<FarmJpaEntity> findAllActiveFarmsByUserId(@Param("userId") Long userId);

    // 인증 상태별 농장 목록 조회 (Admin 승인 관리용)
    List<FarmJpaEntity> findByCertificationStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
            com.farmbalance.farm.domain.CertificationStatus certificationStatus);

    /**
     * 비관적 락을 적용한 농장 조회 (면적 검증 시 동시성 제어용)
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FarmJpaEntity f WHERE f.id = :farmId AND f.deletedAt IS NULL")
    Optional<FarmJpaEntity> findByIdWithLock(@Param("farmId") Long farmId);

    // 상세 조회용
    Optional<FarmJpaEntity> findByIdAndDeletedAtIsNull(Long id);
}
