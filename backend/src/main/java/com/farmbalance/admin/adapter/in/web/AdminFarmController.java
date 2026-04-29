package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.ApproveFarmUseCase;
import com.farmbalance.admin.application.port.in.dto.ApproveFarmCommand;
import com.farmbalance.farm.domain.CertificationStatus;
import com.farmbalance.global.response.ApiResponse;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/farms")
@RequiredArgsConstructor
public class AdminFarmController {

    private final ApproveFarmUseCase approveFarmUseCase;

    @PostMapping("/approve")
    public ResponseEntity<ApiResponse<Void>> approveFarm(@RequestBody ApproveFarmRequest request) {
        
        ApproveFarmCommand command = ApproveFarmCommand.builder()
                .farmId(request.getFarmId())
                .status(request.getStatus())
                .build();
                
        approveFarmUseCase.approveFarm(command);
        
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @Getter
    @NoArgsConstructor
    public static class ApproveFarmRequest {
        private Long farmId;
        private CertificationStatus status;
    }
}
