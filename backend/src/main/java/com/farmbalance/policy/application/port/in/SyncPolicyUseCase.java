package com.farmbalance.policy.application.port.in;

/**
 * 정책 동기화(수집) Input Port.
 */
public interface SyncPolicyUseCase {

    /**
     * 외부 API/크롤링 소스에서 정책 데이터를 수집하여 DB에 upsert합니다.
     *
     * @return 동기화 결과 (수집/업데이트/실패 건수)
     */
    SyncResult syncPolicies();

    /**
     * 동기화 결과를 담는 record.
     */
    record SyncResult(int fetched, int created, int updated, int failed) {
    }
}
