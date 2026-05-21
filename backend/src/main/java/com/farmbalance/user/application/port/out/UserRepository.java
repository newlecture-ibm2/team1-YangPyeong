package com.farmbalance.user.application.port.out;

import com.farmbalance.user.domain.User;
import com.farmbalance.user.domain.UserStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 사용자 저장소 Output Port (인터페이스)
 * adapter/out/persistence 에서 구현합니다.
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    boolean existsByEmail(String email);

    boolean existsByName(String name);

    boolean existsByNameAndEmailNot(String name, String email);

    void deleteByEmail(String email);

    /**
     * 비식별화 대상 (WITHDRAWN, anonymized_at 없음, withdrawal_requested_at ≤ cutoff).
     */
    List<User> findWithdrawnUsersForAnonymization(UserStatus status, LocalDateTime withdrawalRequestedAtInclusive);

    /**
     * 삭제되지 않은 전체 사용자 목록 조회 (최신순)
     */
    List<User> findAll();

    /**
     * 검색 + 필터 + 페이징 조회
     */
    List<User> findByFilter(String keyword, String role, String status, int offset, int limit);

    /**
     * 검색 + 필터 기준 총 건수
     */
    long countByFilter(String keyword, String role, String status);

    /**
     * 사용자 역할 변경
     */
    void updateRole(Long id, String role);

    /**
     * 사용자 상태 및 사유 변경
     */
    void updateStatus(Long id, String status, String reason);
}
