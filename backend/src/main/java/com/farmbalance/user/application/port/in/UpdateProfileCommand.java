package com.farmbalance.user.application.port.in;

import lombok.Builder;
import lombok.Getter;

/**
 * 프로필 수정 커맨드
 */
@Getter
@Builder
public class UpdateProfileCommand {
    private final String email;
    private final String name;
    private final String phone;
    private final String address;
    private final String bio;
}
