package com.farmbalance.policy.adapter.in.web.dto;

import java.math.BigDecimal;
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
        String sourceUrl,
        /** AI 분석 신뢰도 */
        BigDecimal aiConfidence,
        /** AI 신뢰도 낮음 여부 */
        boolean isLowConfidence,
        /** AI 분석 완료 여부 */
        boolean isAnalyzed
) {
}
