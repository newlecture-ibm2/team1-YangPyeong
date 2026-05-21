package com.farmbalance.user.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 보안질문 도메인 모델 (순수 Java — Framework 의존성 없음)
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SecurityQuestion {

    private Long id;
    private Long userId;
    private String question;
    private String answer;   // BCrypt 해시로 저장
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
