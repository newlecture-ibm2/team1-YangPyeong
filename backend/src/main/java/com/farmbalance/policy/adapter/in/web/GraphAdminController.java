package com.farmbalance.policy.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.policy.application.service.GraphRefreshService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 그래프 데이터 수동 갱신용 관리 API
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class GraphAdminController {

    private final GraphRefreshService graphRefreshService;

    /**
     * 그래프 스키마 수동 갱신 실행
     * POST /api/admin/graph/refresh
     */
    @PostMapping("/api/admin/graph/refresh")
    public ApiResponse<String> refreshGraphManually() {
        log.info("Manual graph refresh triggered via API.");
        graphRefreshService.refreshGraph();
        return ApiResponse.ok("그래프 수동 갱신이 성공적으로 실행되었습니다.");
    }
}
