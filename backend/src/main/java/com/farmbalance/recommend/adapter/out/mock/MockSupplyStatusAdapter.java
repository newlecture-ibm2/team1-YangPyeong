package com.farmbalance.recommend.adapter.out.mock;

import com.farmbalance.recommend.application.port.out.LoadSupplyStatusPort;
import com.farmbalance.recommend.domain.SupplyStatus;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 수급 상태 목업 어댑터
 * TODO: balance 모듈 또는 외부 수급 API 연동 시 교체 예정
 */
@Component
public class MockSupplyStatusAdapter implements LoadSupplyStatusPort {

    /** 작물별 고정 수급 상태 (프론트 목업과 동기화) */
    private static final Map<Long, SupplyStatus> MOCK_STATUS = Map.of(
            1L, SupplyStatus.BALANCED,        // 유기농 배추
            2L, SupplyStatus.BALANCED,        // 청양고추
            3L, SupplyStatus.BALANCED,        // 방울토마토
            4L, SupplyStatus.SHORT_CAUTION,   // 감자
            5L, SupplyStatus.BALANCED,        // 당근
            6L, SupplyStatus.EXCESS_CAUTION,  // 깻잎
            7L, SupplyStatus.SHORT_WARN       // 양파
    );

    @Override
    public SupplyStatus loadSupplyStatus(Long cropId, String regionCode) {
        return MOCK_STATUS.getOrDefault(cropId, SupplyStatus.BALANCED);
    }
}
