package com.farmbalance.recommend.application.port.out;

import com.farmbalance.recommend.domain.SupplyStatus;

/**
 * 수급 상태 조회 출력 포트
 * Balance 모듈 또는 외부 API에서 구현
 */
public interface LoadSupplyStatusPort {

    /**
     * 특정 작물의 현재 수급 상태를 조회합니다.
     *
     * @param cropId     작물 ID
     * @param regionCode 법정동 코드
     * @return 수급 상태
     */
    SupplyStatus loadSupplyStatus(Long cropId, String regionCode);
}
