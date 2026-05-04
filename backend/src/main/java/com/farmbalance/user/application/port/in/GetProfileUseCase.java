package com.farmbalance.user.application.port.in;

import com.farmbalance.user.domain.User;

import java.util.Optional;

/**
 * 프로필 조회 유스케이스
 */
public interface GetProfileUseCase {
    User getProfile(String email);

    /** 이메일로 사용자 조회 (존재하지 않으면 Optional.empty) */
    Optional<User> findByEmail(String email);
}
