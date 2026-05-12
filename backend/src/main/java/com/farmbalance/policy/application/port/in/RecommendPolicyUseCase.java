package com.farmbalance.policy.application.port.in;

import com.farmbalance.policy.adapter.in.web.dto.PolicyRecommendResponse;

public interface RecommendPolicyUseCase {
    PolicyRecommendResponse recommendForUser(Long userId);
}
