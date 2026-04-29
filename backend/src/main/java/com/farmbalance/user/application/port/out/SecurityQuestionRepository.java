package com.farmbalance.user.application.port.out;

import com.farmbalance.user.domain.SecurityQuestion;

import java.util.Optional;

/**
 * 보안질문 저장소 Output Port (인터페이스)
 * adapter/out/persistence 에서 구현합니다.
 */
public interface SecurityQuestionRepository {

    SecurityQuestion save(SecurityQuestion securityQuestion);

    Optional<SecurityQuestion> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
