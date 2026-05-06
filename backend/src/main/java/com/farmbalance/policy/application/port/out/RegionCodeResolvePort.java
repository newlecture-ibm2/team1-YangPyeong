package com.farmbalance.policy.application.port.out;

import java.util.Optional;

/**
 * 지역코드/지역명 → 정규화된 regions.code 변환 Output Port.
 * AI Analyzer 결과의 region_code를 regions 테이블 기준으로 보정합니다.
 *
 * 예:
 * - "경기도", "4100" → "41"
 * - "양평군", "41830", "4183" → "4183"
 * - "전국", "공통" → "0000"
 * - 매칭 실패 → null
 */
public interface RegionCodeResolvePort {

    /**
     * 지역코드 또는 지역명을 regions 테이블 기준 코드로 보정합니다.
     *
     * @param codeOrName AI가 반환한 지역코드 또는 지역명
     * @return 정규화된 regions.code, 없으면 Optional.empty()
     */
    Optional<String> resolveToCode(String codeOrName);
}
