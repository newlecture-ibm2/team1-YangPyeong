package com.farmbalance.gov.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 다운로드 이력 도메인 모델 — 순수 POJO, Spring 어노테이션 없음
 * "로그 기록" 수준의 모델이며, 파일 저장/재다운로드 기능 없음
 */
@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class DownloadHistory {
    private final Long id;
    private final Long userId;
    private final String type;
    private final String format;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final String town;
    private final LocalDateTime createdAt;
}
