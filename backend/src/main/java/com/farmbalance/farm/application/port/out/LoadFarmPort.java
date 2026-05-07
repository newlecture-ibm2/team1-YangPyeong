package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.CultivationRegistration;
import com.farmbalance.farm.domain.Farm;
import java.util.List;
import java.util.Optional;

public interface LoadFarmPort {
    List<Farm> loadFarmsByUserId(Long userId);
    Optional<Farm> loadFarmById(Long farmId);
    List<Farm> loadAllFarms();
    List<CultivationRegistration> loadCultivationsByFarmId(Long farmId);
    Optional<CultivationRegistration> loadCultivationById(Long id);

    /**
     * 비관적 락을 적용한 농장 조회 (면적 검증 시 동시성 제어용)
     */
    Optional<Farm> loadFarmByIdWithLock(Long farmId);

    /**
     * 특정 농장의 ACTIVE 상태 재배 구역 면적 합계를 조회합니다.
     */
    Double sumActiveAreaByFarmId(Long farmId);

    /**
     * 특정 재배 등록을 제외한 ACTIVE 상태 면적 합계를 조회합니다. (수정 시 사용)
     */
    Double sumActiveAreaByFarmIdExcluding(Long farmId, Long excludeId);
}
