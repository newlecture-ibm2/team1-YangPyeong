package com.farmbalance.user.application.port.in;

import com.farmbalance.user.adapter.in.web.dto.LoginRequest;
import com.farmbalance.user.adapter.in.web.dto.TokenResponse;

/**
 * 로그인 Input Port
 *
 * ※ DTO(LoginRequest/TokenResponse)가 adapter 패키지에 위치하지만,
 *   프로젝트 규모를 고려하여 별도 Command 객체 없이 직접 참조합니다.
 *   규모 확장 시 application/port/in/command/ 패키지로 분리를 검토하세요.
 */
public interface LoginUseCase {
    TokenResponse login(LoginRequest request);
}
