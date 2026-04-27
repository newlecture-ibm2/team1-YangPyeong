package com.farmbalance.global.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * JPA 엔티티 공통 시간 필드.
 * 모든 JPA 엔티티는 이 클래스를 상속하여 createdAt, updatedAt을 자동 관리합니다.
 *
 * <pre>
 * 사용 예시:
 * {@code
 * @Entity
 * public class UserJpaEntity extends BaseTimeEntity {
 *     ...
 * }
 * }
 * </pre>
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
