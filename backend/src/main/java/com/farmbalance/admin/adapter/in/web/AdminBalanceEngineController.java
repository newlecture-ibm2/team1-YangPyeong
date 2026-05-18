package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.AdminBalanceEngineUseCase;
import com.farmbalance.admin.domain.AdminBalanceData;
import com.farmbalance.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/balance-engine")
@RequiredArgsConstructor
@Tag(name = "Admin Balance Engine", description = "관리자용 수급 밸런스 엔진 제어 및 모니터링 API")
public class AdminBalanceEngineController {

    private final AdminBalanceEngineUseCase adminBalanceEngineUseCase;

    @Operation(summary = "상세 수급 데이터 조회", description = "모든 작물의 상세 수급 원시 데이터를 조회합니다.")
    @GetMapping("/data")
    public ApiResponse<List<AdminBalanceData>> getBalanceData() {
        return ApiResponse.ok(adminBalanceEngineUseCase.getBalanceData());
    }

    @Operation(summary = "수급 임계치 설정 조회", description = "현재 시스템에 적용된 수급 임계치 설정을 반환합니다.")
    @GetMapping("/properties")
    public ApiResponse<AdminBalanceEngineUseCase.BalanceThresholdsDto> getThresholds() {
        return ApiResponse.ok(adminBalanceEngineUseCase.getThresholds());
    }

    @Operation(summary = "수급 임계치 설정 업데이트 (Hot Reload)", description = "수급 임계치 설정을 실시간으로 업데이트합니다.")
    @PutMapping("/properties")
    public ApiResponse<String> updateThresholds(@RequestBody AdminBalanceEngineUseCase.BalanceThresholdsDto thresholds) {
        adminBalanceEngineUseCase.updateThresholds(thresholds);
        return ApiResponse.ok("수급 임계치가 성공적으로 업데이트되었습니다.");
    }
}
