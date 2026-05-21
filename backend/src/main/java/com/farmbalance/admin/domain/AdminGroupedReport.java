package com.farmbalance.admin.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminGroupedReport {
    private String targetType;
    private Long targetId;
    private long reportCount;
    private String recentReason;
    private String allReasons;
    private String status;
    private String actionTaken;
    private LocalDateTime recentReportAt;
}
