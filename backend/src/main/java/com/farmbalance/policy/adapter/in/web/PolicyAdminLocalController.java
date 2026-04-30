package com.farmbalance.policy.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.policy.adapter.out.persistence.repository.PolicyDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 정책 데이터 정리용 관리 API (local 프로파일 전용).
 * 운영 환경에서는 이 컨트롤러가 로드되지 않습니다.
 *
 * 사용 예: curl -X DELETE 'http://localhost:8080/api/admin/policies?source=SEED'
 */
@RestController
@RequiredArgsConstructor
@Profile("local")
public class PolicyAdminLocalController {

    private final PolicyDataRepository policyDataRepository;

    /**
     * 특정 source의 정책 데이터 일괄 삭제.
     * DELETE /api/admin/policies?source=SEED
     *
     * 주의: 운영 환경에서는 @Profile("local")로 차단됩니다.
     */
    @DeleteMapping("/api/admin/policies")
    @Transactional
    public ApiResponse<Map<String, String>> deletePoliciesBySource(
            @RequestParam String source) {
        policyDataRepository.deleteBySource(source);
        return ApiResponse.ok(Map.of("message", source + " 소스 데이터 삭제 완료"));
    }
}
