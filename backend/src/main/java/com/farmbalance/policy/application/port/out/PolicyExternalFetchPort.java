package com.farmbalance.policy.application.port.out;

import com.farmbalance.policy.domain.model.PolicyData;

import java.util.List;

/**
 * 외부 정책 수집 Output Port.
 * 각 외부 API/크롤링 클라이언트가 구현합니다.
 */
public interface PolicyExternalFetchPort {

    /**
     * 외부 소스에서 정책 데이터를 가져옵니다.
     *
     * @return 수집된 정책 도메인 객체 목록
     */
    List<PolicyData> fetchPolicies();

    /**
     * 이 수집기의 소스명을 반환합니다.
     */
    String getSourceName();
}
