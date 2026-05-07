package com.farmbalance.policy.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 정책 상세 조회 응답 DTO.
 * normalized_data + AI 신뢰도 정보 포함.
 */
public record PolicyDetailResponse(
        Long id,
        String title,
        String organization,
        String regionCode,
        String regionName,
        String category,
        String target,
        String contentSummary,
        String supportAmount,
        LocalDate applyStart,
        LocalDate applyEnd,
        String source,
        String sourceUrl,
        /** AI 분석 신뢰도 (0.00~1.00) */
        BigDecimal aiConfidence,
        /** AI 신뢰도가 0.6 미만이면 true */
        boolean isLowConfidence,
        /** AI 분석 완료 여부 (normalized_data 존재 여부) */
        boolean isAnalyzed,
        /** AI 정규화 결과 — JSON 객체로 직렬화됨 */
        @JsonRawValue
        String normalizedData
) {
}
