package com.farmbalance.gov.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 다운로드 이력 JPA Entity — 로그 기록 용도
 */
@Entity
@Table(name = "download_history")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadHistoryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 10)
    private String format;

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(length = 50)
    private String town;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
