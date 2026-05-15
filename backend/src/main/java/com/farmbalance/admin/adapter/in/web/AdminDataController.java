package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.policy.application.service.GraphRefreshService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 어드민 데이터 관리 컨트롤러
 */
@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
public class AdminDataController {

    private final GraphRefreshService graphRefreshService;

    /**
     * GraphRAG용 그래프 DB 수동 최신화 (배치 강제 실행)
     * 프론트엔드 /admin/data 페이지의 수동 동기화 버튼용
     */
    @PostMapping("/graph-refresh")
    public ApiResponse<Map<String, String>> refreshGraph() {
        try {
            graphRefreshService.refreshGraph();
            return ApiResponse.ok(Map.of("message", "그래프 DB 최신화가 시작/완료되었습니다."));
        } catch (Exception e) {
            String msg = e.getMessage();
            Throwable cause = e.getCause();
            while (cause != null) {
                msg += " | Caused by: " + cause.getMessage();
                cause = cause.getCause();
            }
            return ApiResponse.ok(Map.of("message", "ERROR: " + msg));
        }
    }
}
