package com.farmbalance.recommend.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.recommend.adapter.in.web.dto.RecommendResponse;
import com.farmbalance.recommend.application.port.in.RecommendCropUseCase;
import com.farmbalance.recommend.application.port.in.GetRecommendHistoryUseCase;
import com.farmbalance.recommend.application.port.in.DiagnoseCropImageUseCase;
import com.farmbalance.recommend.domain.RecommendResult;
import java.util.List;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final DiagnoseCropImageUseCase diagnoseCropImageUseCase;

    /**
     * 지정 농장에 대해 AI 작물 추천 실행
     *
     * POST /api/recommend/{farmId}
     */
    @PostMapping("/{farmId}")
    public ApiResponse<RecommendResponse> recommend(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long farmId) {

        log.info("AI 작물 추천 요청: userId={}, farmId={}", userId, farmId);

        RecommendResult result = recommendCropUseCase.recommend(userId, farmId);
        RecommendResponse response = RecommendResponse.from(result);

        return ApiResponse.ok(response);
    }

    /**
     * 특정 농장의 추천 이력 조회 (최근 20건)
     *
     * GET /api/recommend/{farmId}/history
     */
    @GetMapping("/{farmId}/history")
    public ApiResponse<List<RecommendResponse>> getHistory(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long farmId) {
            
        log.info("AI 작물 추천 이력 조회: userId={}, farmId={}", userId, farmId);
        
        List<RecommendResult> history = getRecommendHistoryUseCase.getHistory(userId, farmId);
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
        
        RecommendResult result = getRecommendHistoryUseCase.getLatestHistory(userId, farmId);
        RecommendResponse response = RecommendResponse.from(result);
        
        return ApiResponse.ok(response);
    }

    /**
     * 작물 병해충 이미지 진단
     *
     * POST /api/recommend/diagnose
     */
    @PostMapping(value = "/diagnose", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> diagnoseImage(
            @AuthenticationPrincipal Long userId,
            @RequestPart("image") MultipartFile image) {
            
        log.info("작물 이미지 진단 요청: userId={}", userId);
        String diagnosis = diagnoseCropImageUseCase.diagnose(userId, image);
        return ApiResponse.ok(diagnosis);
    }
}
