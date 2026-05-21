package com.farmbalance.user.application.port.in;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

/**
 * 프로필 수정 커맨드
 */
@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class UpdateProfileCommand {
    private final String email;
    private final String name;
    private final String phone;
    private final String address;
    private final String bio;
}
