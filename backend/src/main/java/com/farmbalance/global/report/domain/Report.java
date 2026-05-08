package com.farmbalance.global.report.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class Report {
    private Long id;
    private String targetType;   // "POST", "COMMENT"
    private Long targetId;
    private Long reporterId;
    private String reason;
    private String status;       // "PENDING", "RESOLVED", "DISMISSED"
    private LocalDateTime createdAt;
}
