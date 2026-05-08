package com.farmbalance.recommend.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.recommend.adapter.in.web.dto.RecommendResponse;
import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.application.port.in.GetRecommendHistoryUseCase;
import com.farmbalance.recommend.domain.RecommendResult;
import java.util.List;
import java.util.stream.Collectors;

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
    private final GetRecommendHistoryUseCase getRecommendHistoryUseCase;

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

    /**
     * 특정 농장의 전체 추천 이력 조회
     *
     * GET /api/recommend/{farmId}/history
     */
    @GetMapping("/{farmId}/history")
    public ApiResponse<List<RecommendResponse>> getHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long farmId) {
            
        log.info("AI 작물 추천 이력 전체 조회: userId={}, farmId={}", userId, farmId);
        
        List<RecommendResult> history = getRecommendHistoryUseCase.getHistory(farmId);
        List<RecommendResponse> response = history.stream()
                .map(RecommendResponse::from)
                .collect(Collectors.toList());
                
        return ApiResponse.ok(response);
    }

    /**
     * 특정 농장의 최근 추천 이력 1건 조회
     *
     * GET /api/recommend/{farmId}/history/latest
     */
    @GetMapping("/{farmId}/history/latest")
    public ApiResponse<RecommendResponse> getLatestHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long farmId) {
            
        log.info("AI 작물 추천 이력 단건 조회: userId={}, farmId={}", userId, farmId);
        
        RecommendResult result = getRecommendHistoryUseCase.getLatestHistory(farmId);
        RecommendResponse response = RecommendResponse.from(result);
        
        return ApiResponse.ok(response);
    }
}
