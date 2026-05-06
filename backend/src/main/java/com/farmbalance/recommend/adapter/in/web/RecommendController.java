package com.farmbalance.recommend.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.recommend.adapter.in.web.dto.RecommendResponse;
import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.domain.RecommendResult;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AI 작물 추천 API 컨트롤러
 */
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
    public ResponseEntity<ApiResponse<RecommendResponse>> recommend(
            @PathVariable Long farmId) {

        RecommendResult result = recommendCropUseCase.recommend(farmId);
        RecommendResponse response = RecommendResponse.from(result);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
