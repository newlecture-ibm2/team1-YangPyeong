package com.farmbalance.policy.application.port.out;

import java.util.List;
import java.util.Map;

public interface PolicyGraphQueryPort {
    /**
     * 특정 농업인과 여러 정책 후보들 간의 그래프 관계(FARMER, FARM, CROP, REGION, POLICY, BALANCE_STATUS 등)를 조회합니다.
     */
    List<Map<String, Object>> findRelationsForFarmerAndPolicies(Long farmerId, List<Long> policyIds);
}
