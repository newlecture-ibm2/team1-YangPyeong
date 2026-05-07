package com.farmbalance.global.event;

/**
 * 외부 API 동기화 이벤트 (도메인 간 결합 없이 동기화 결과를 전달)
 *
 * <p>사용 방법:</p>
 * <pre>
 * // 다른 도메인에서 API 호출 후 결과를 이벤트로 발행
 * eventPublisher.publishEvent(new ApiSyncEvent("WEATHER", "SUCCESS", 15, null));
 * </pre>
 *
 * @param apiName     API 식별자 (예: WEATHER, KOSIS, SOIL_EXAM)
 * @param status      결과 상태: SUCCESS, FAILED
 * @param recordCount 수집된 레코드 수
 * @param errorMessage 실패 시 에러 메시지
 */
public record ApiSyncEvent(
        String apiName,
        String status,
        int recordCount,
        String errorMessage
) {}
