package com.farmbalance.recommend.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.recommend.adapter.in.web.dto.RecommendResponse;
import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.domain.RecommendResult;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * AI 작물 추천 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
public class RecommendController {

    private final RecommendCropUseCase recommendCropUseCase;

    /**
     * 지정 농장에 대해 AI 작물 추천 실행
     *
     * POST /api/recommend/{farmId}
     */
    @PostMapping("/{farmId}")
    public ApiResponse<RecommendResponse> recommend(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long farmId) {

        // TODO: 운영 전 제거 — 개발 환경에서 인증 없이 테스트하기 위한 임시 코드
        if (userId == null) {
            userId = 9001L;
        }

        log.info("AI 작물 추천 요청: userId={}, farmId={}", userId, farmId);

        RecommendResult result = recommendCropUseCase.recommend(farmId);
        RecommendResponse response = RecommendResponse.from(result);

        return ApiResponse.ok(response);
    }
}
