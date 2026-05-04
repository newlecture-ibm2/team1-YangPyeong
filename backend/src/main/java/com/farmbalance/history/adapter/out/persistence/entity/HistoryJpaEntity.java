package com.farmbalance.history.adapter.out.persistence.entity;

import com.farmbalance.history.domain.HistoryType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "cultivation_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class HistoryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long farmId;

    @Column
    private Long cultivationRegistrationId;

    @Column(nullable = false)
    private java.time.LocalDate recordDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", length = 20)
    private HistoryType activityType;

    @Column(name = "activity_content", columnDefinition = "TEXT")
    private String activityContent;

    @Column(name = "avg_temp")
    private Double avgTemp;

    @Column(name = "total_rain")
    private Double totalRain;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public HistoryJpaEntity(Long farmId, Long cultivationRegistrationId, java.time.LocalDate recordDate, 
                          HistoryType activityType, String activityContent, Double avgTemp, Double totalRain) {
        this.farmId = farmId;
        this.cultivationRegistrationId = cultivationRegistrationId;
        this.recordDate = recordDate;
        this.activityType = activityType;
        this.activityContent = activityContent;
        this.avgTemp = avgTemp;
        this.totalRain = totalRain;
    }

    public void update(String activityContent, HistoryType activityType) {
        this.activityContent = activityContent;
        this.activityType = activityType;
    }
}
