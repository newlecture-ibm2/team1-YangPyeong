package com.farmbalance.gov.domain.model;

/**
 * 지자체 사용자 정보
 * @param region 기존 문자열 (하위호환)
 * @param regionCode 시군구 코드 (신규, "4183")
 * @param regionName 시군구 이름 (신규, regions 테이블에서 조회)
 */
public record GovUserInfo(
    Long id,
    String name,
    String role,
    String email,
    String regionCode,
    String regionName
) {}
