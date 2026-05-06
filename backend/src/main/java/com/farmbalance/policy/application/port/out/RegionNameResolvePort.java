package com.farmbalance.policy.application.port.out;

import java.util.Optional;

/**
 * 지역코드 → 지역명 변환 Output Port.
 * regions 마스터 테이블을 조회하여 지역명을 반환합니다.
 *
 * gov 도메인의 RegionQueryPort를 직접 참조하지 않고,
 * policy 도메인 자체의 Port로 정의합니다. (헥사고날 의존성 규칙 준수)
 */
public interface RegionNameResolvePort {

    /**
     * 지역코드로 지역명을 조회합니다.
     *
     * @param regionCode 지역코드 (예: "4183")
     * @return 지역명 (예: "양평군"), 없으면 Optional.empty()
     */
    Optional<String> findNameByCode(String regionCode);
}
