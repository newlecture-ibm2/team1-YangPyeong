package com.farmbalance.admin.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AdminReport {
    private Long id;
    private String targetType;
    private Long targetId;
    private Long reporterId;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
}
