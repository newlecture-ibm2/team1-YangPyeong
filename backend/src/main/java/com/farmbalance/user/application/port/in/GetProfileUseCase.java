package com.farmbalance.user.application.port.in;

import com.farmbalance.user.domain.User;

/**
 * 프로필 조회 유스케이스
 */
public interface GetProfileUseCase {
    User getProfile(String email);
}
