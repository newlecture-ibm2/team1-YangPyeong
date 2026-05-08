package com.farmbalance.global.report.adapter;

import com.farmbalance.global.report.domain.Report;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ReportJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Report toDomain() {
        return Report.builder()
                .id(this.id)
                .targetType(this.targetType)
                .targetId(this.targetId)
                .reporterId(this.reporterId)
                .reason(this.reason)
                .status(this.status)
                .createdAt(this.createdAt)
                .build();
    }

    public static ReportJpaEntity fromDomain(Report report) {
        return ReportJpaEntity.builder()
                .id(report.getId())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .reporterId(report.getReporterId())
                .reason(report.getReason())
                .status(report.getStatus() != null ? report.getStatus() : "PENDING")
                .build();
    }
}
