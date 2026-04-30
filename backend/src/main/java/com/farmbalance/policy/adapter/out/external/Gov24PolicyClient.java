package com.farmbalance.policy.adapter.out.external;

import com.farmbalance.policy.application.port.out.PolicyExternalFetchPort;
import com.farmbalance.policy.domain.model.PolicyData;
import com.farmbalance.policy.domain.model.PolicySource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * 정부24 정책 API 클라이언트 (Mock).
 * TODO: 실제 API 키 발급 후 구현 예정
 */
@Slf4j
@Component
public class Gov24PolicyClient implements PolicyExternalFetchPort {

    @Override
    public List<PolicyData> fetchPolicies() {
        // TODO: 실제 정부24 API 호출 구현
        log.info("[Gov24PolicyClient] Mock — 실제 API 키 발급 전이므로 빈 목록 반환");
        return Collections.emptyList();
    }

    @Override
    public String getSourceName() {
        return PolicySource.GOV24.name();
    }
}
