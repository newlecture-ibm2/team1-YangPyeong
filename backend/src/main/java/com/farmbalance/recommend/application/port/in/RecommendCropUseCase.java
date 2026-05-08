package com.farmbalance.recommend.application.port.in;

import com.farmbalance.recommend.domain.RecommendResult;

/**
 * AI 작물 추천 실행 유스케이스
 */
public interface RecommendCropUseCase {

    /**
     * 지정된 농장에 대해 AI 작물 추천을 실행합니다.
     *
     * @param userId 요청 사용자 ID (농장 소유자 검증용)
     * @param farmId 농장 ID
     * @return 추천 결과 (농장 정보 + 작물 추천 목록)
     */
    RecommendResult recommend(Long userId, Long farmId);
}
