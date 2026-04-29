package com.farmbalance.user.adapter.out.persistence.entity;

import com.farmbalance.user.domain.SecurityQuestion;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 보안질문 JPA 엔티티 (Driven Adapter)
 * domain.SecurityQuestion ↔ SecurityQuestionJpaEntity 변환을 담당합니다.
 */
@Entity
@Table(name = "security_questions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class SecurityQuestionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String question;

    @Column(nullable = false, length = 255)
    private String answer;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /* ── 도메인 모델 변환 ── */

    public SecurityQuestion toDomain() {
        return SecurityQuestion.builder()
                .id(id)
                .userId(userId)
                .question(question)
                .answer(answer)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    public static SecurityQuestionJpaEntity fromDomain(SecurityQuestion sq) {
        return SecurityQuestionJpaEntity.builder()
                .id(sq.getId())
                .userId(sq.getUserId())
                .question(sq.getQuestion())
                .answer(sq.getAnswer())
                .build();
    }
}
