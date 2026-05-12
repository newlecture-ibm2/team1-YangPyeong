package com.farmbalance.policy.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "batch_logs")
@Getter
@Setter
@NoArgsConstructor
public class BatchLogJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false, length = 100)
    private String jobName;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "total_processed")
    private Integer totalProcessed = 0;

    @Column(name = "total_failed")
    private Integer totalFailed = 0;

    @Column(name = "messages", columnDefinition = "TEXT")
    private String messages;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
