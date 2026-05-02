package com.farmbalance.user.application.port.in;

/**
 * 닉네임(이름) 중복 확인 유스케이스
 */
public interface CheckNicknameUseCase {
    boolean isNicknameAvailable(String name);
}
