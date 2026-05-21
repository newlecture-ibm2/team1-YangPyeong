package com.farmbalance.community.adapter.in.web.dto;

import com.farmbalance.global.report.domain.Report;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyReportActivityResponse {
    private Long reportId;
    private String targetType;
    private Long targetId;
    private String targetTitle;
    private String reason;
    private String status;
    private LocalDateTime createdAt;

    public static MyReportActivityResponse of(Report report, String targetTitle) {
        return MyReportActivityResponse.builder()
                .reportId(report.getId())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .targetTitle(targetTitle)
                .reason(report.getReason())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
