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
     *
     * @param fetched   수집된 총 건수
     * @param created   신규 생성 건수
     * @param updated   갱신 건수
     * @param analyzed  AI 분석 성공 건수
     * @param skipped   AI 분석 건너뜀/실패 건수
     * @param failed    저장 실패 건수
     * @param warnings  보정/경고 메시지 목록
     */
    record SyncResult(int fetched, int created, int updated,
                      int analyzed, int skipped, int failed,
                      java.util.List<String> warnings) {
    }
}
