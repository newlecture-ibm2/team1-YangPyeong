package com.farmbalance.policy.application.port.in;

import com.farmbalance.global.event.HealthCheckTriggerEvent;

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
     * 정책 데이터 헬스체크 이벤트를 수신하여 가벼운 점검을 수행합니다.
     */
    void onHealthCheckTriggerEvent(HealthCheckTriggerEvent event);

    /**
     * 기존 DB의 policy_data 중 정규화가 안 된 건(title=null 등)을
     * content 기반으로 재정규화합니다.
     * AI 서버 없이 Java 로직만으로 title/category/region_code를 보정합니다.
     */
    ReprocessResult reprocessExisting();

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

    /**
     * 재정규화 결과를 담는 record.
     */
    record ReprocessResult(int total, int updated, int failed,
                           java.util.List<String> warnings) {
    }
}
