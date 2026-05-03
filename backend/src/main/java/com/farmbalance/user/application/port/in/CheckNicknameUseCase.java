package com.farmbalance.user.application.port.in;

/**
 * 닉네임(이름) 중복 확인 유스케이스
 */
public interface CheckNicknameUseCase {
    /** 닉네임 중복 확인 (회원가입용) */
    boolean isNicknameAvailable(String name);

    /** 닉네임 중복 확인 (프로필 수정용 — 자기 자신 제외) */
    boolean isNicknameAvailable(String name, String excludeEmail);
}
