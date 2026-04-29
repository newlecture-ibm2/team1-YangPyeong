package com.farmbalance.gov.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.gov.application.port.in.DownloadGovDataUseCase;
import com.farmbalance.gov.application.port.in.GetDownloadHistoryUseCase;
import com.farmbalance.gov.application.port.in.GetGovUserInfoUseCase;
import com.farmbalance.gov.domain.model.DownloadHistory;
import com.farmbalance.gov.domain.model.GovDownloadFormat;
import com.farmbalance.gov.domain.model.GovDownloadType;
import com.farmbalance.gov.domain.model.GovUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import com.farmbalance.gov.adapter.in.web.dto.DownloadHistoryResponse;

@RestController
@RequestMapping("/api/gov/download")
@RequiredArgsConstructor
public class GovDownloadController {

    private final DownloadGovDataUseCase downloadUseCase;
    private final GetDownloadHistoryUseCase historyUseCase;
    private final GetGovUserInfoUseCase userInfoUseCase;

    private GovUserInfo checkGovUser(Long userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 인증이 필요합니다.");
        GovUserInfo info = userInfoUseCase.getGovUserInfo(userId);
        if (info == null || !"GOV".equals(info.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지자체 권한이 없습니다.");
        }
        return info;
    }

    @GetMapping
    public ResponseEntity<byte[]> downloadData(
            @AuthenticationPrincipal Long userId,
            @RequestParam GovDownloadType type,
            @RequestParam GovDownloadFormat format) {
        
        GovUserInfo user = checkGovUser(userId);
        byte[] data = downloadUseCase.download(type, format, userId, user.region());
        String fileName = downloadUseCase.getFileName(type, format);
        
        String contentType = format == GovDownloadFormat.CSV ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }

    @GetMapping("/history")
    public ApiResponse<List<DownloadHistoryResponse>> getDownloadHistory(
            @AuthenticationPrincipal Long userId) {
        checkGovUser(userId);
        List<DownloadHistoryResponse> res = historyUseCase.getHistory(userId).stream()
                .map(DownloadHistoryResponse::from).toList();
        return ApiResponse.ok(res);
    }
}
