package com.farmbalance.user.adapter.out.persistence;

import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.UserJpaRepository;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.AuthProvider;
import com.farmbalance.user.domain.Role;
import com.farmbalance.user.domain.User;
import com.farmbalance.user.domain.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

/**
 * 사용자 Persistence Adapter
 * Output Port(UserRepository)를 구현하여 JPA와 연결합니다.
 */
@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserRepository {

    private final UserJpaRepository userJpaRepository;
    private final EntityManager entityManager;

    @Override
    public User save(User user) {
        UserJpaEntity entity = UserJpaEntity.fromDomain(user);
        UserJpaEntity saved = userJpaRepository.save(entity);
        return saved.toDomain();
    }

    @Override
    public Optional<User> findById(Long id) {
        return userJpaRepository.findById(id).map(UserJpaEntity::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userJpaRepository.findByEmail(email).map(UserJpaEntity::toDomain);
    }

    @Override
    public Optional<User> findByProviderAndProviderId(String provider, String providerId) {
        AuthProvider authProvider = AuthProvider.valueOf(provider);
        return userJpaRepository.findByProviderAndProviderId(authProvider, providerId)
                .map(UserJpaEntity::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userJpaRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByName(String name) {
        return userJpaRepository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndEmailNot(String name, String email) {
        return userJpaRepository.existsByNameAndEmailNot(name, email);
    }

    @Override
    public void deleteByEmail(String email) {
        userJpaRepository.deleteByEmail(email);
    }

    @Override
    public List<User> findWithdrawnUsersForAnonymization(UserStatus status, LocalDateTime withdrawalRequestedAtInclusive) {
        return userJpaRepository
                .findByStatusAndAnonymizedAtIsNullAndWithdrawalRequestedAtLessThanEqual(status, withdrawalRequestedAtInclusive)
                .stream()
                .map(UserJpaEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findAll() {
        return userJpaRepository.findAll().stream()
                .map(UserJpaEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findByFilter(String keyword, String role, String status, int offset, int limit) {
        StringBuilder jpql = new StringBuilder("SELECT u FROM UserJpaEntity u WHERE 1=1");
        List<Object> params = new ArrayList<>();
        int paramIndex = 1;

        paramIndex = appendFilterConditions(jpql, params, paramIndex, keyword, role, status);

        jpql.append(" ORDER BY u.createdAt DESC");

        TypedQuery<UserJpaEntity> query = entityManager.createQuery(jpql.toString(), UserJpaEntity.class);
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }
        query.setFirstResult(offset);
        query.setMaxResults(limit);

        return query.getResultList().stream()
                .map(UserJpaEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long countByFilter(String keyword, String role, String status) {
        StringBuilder jpql = new StringBuilder("SELECT COUNT(u) FROM UserJpaEntity u WHERE 1=1");
        List<Object> params = new ArrayList<>();
        int paramIndex = 1;

        appendFilterConditions(jpql, params, paramIndex, keyword, role, status);

        TypedQuery<Long> query = entityManager.createQuery(jpql.toString(), Long.class);
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }

        Long count = query.getSingleResult();
        return count != null ? count : 0;
    }

    @Override
    public void updateRole(Long id, String role) {
        userJpaRepository.findById(id).ifPresent(entity -> {
            entity.updateRole(Role.valueOf(role));
            userJpaRepository.save(entity);
        });
    }

    @Override
    public void updateStatus(Long id, String status) {
        userJpaRepository.findById(id).ifPresent(entity -> {
            entity.updateStatus(UserStatus.valueOf(status));
            userJpaRepository.save(entity);
        });
    }

    /**
     * 검색/필터 WHERE 절 조건을 동적으로 추가하는 헬퍼
     */
    private int appendFilterConditions(StringBuilder jpql, List<Object> params, int paramIndex,
                                       String keyword, String role, String status) {
        if (keyword != null && !keyword.isBlank()) {
            jpql.append(" AND (u.name LIKE ?").append(paramIndex)
                .append(" OR u.email LIKE ?").append(paramIndex + 1).append(")");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            paramIndex += 2;
        }
        if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
            jpql.append(" AND u.role = ?").append(paramIndex);
            params.add(Role.valueOf(role.toUpperCase()));
            paramIndex++;
        }
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            jpql.append(" AND u.status = ?").append(paramIndex);
            params.add(UserStatus.valueOf(status.toUpperCase()));
            paramIndex++;
        }
        return paramIndex;
    }
}

