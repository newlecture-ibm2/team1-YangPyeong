package com.farmbalance.policy.adapter.in.web.dto;

import java.time.LocalDate;

/**
 * 정책 목록 조회 응답 DTO.
 */
public record PolicyListResponse(
        Long id,
        String title,
        String organization,
        String regionCode,
        String regionName,
        String category,
        String target,
        String contentSummary,
        String supportAmount,
        LocalDate applyEnd,
        String source,
        String sourceUrl
) {
}
