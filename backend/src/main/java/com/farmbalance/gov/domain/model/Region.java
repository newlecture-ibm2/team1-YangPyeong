package com.farmbalance.gov.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

/**
 * 지역 도메인 모델 — 순수 POJO (Spring 어노테이션 사용 금지)
 * 시도/시군구/읍면동 계층 구조를 표현합니다.
 */
@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class Region {
    private final Long id;
    private final String code;
    private final String name;
    private final String type;       // PROVINCE | CITY | TOWN
    private final String parentCode;
}
