package com.farmbalance.gov.adapter.in.web;

import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.gov.application.port.in.DownloadGovDataUseCase;
import com.farmbalance.gov.application.port.in.GetDownloadHistoryUseCase;
import com.farmbalance.gov.application.port.out.DownloadHistoryPort;
import com.farmbalance.gov.domain.model.DownloadHistory;
import com.farmbalance.gov.domain.model.GovDownloadFormat;
import com.farmbalance.gov.domain.model.GovDownloadType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 지자체 데이터 내보내기 Controller (Driving Adapter)
 * - /download : Excel/CSV 즉시 생성 + 이력 저장
 * - /download/history : 최근 10건 조회
 * 서버에 파일을 저장하지 않습니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/gov")
@RequiredArgsConstructor
public class GovDownloadController {

    private final DownloadGovDataUseCase downloadUseCase;
    private final DownloadHistoryPort historyPort;
    private final GetDownloadHistoryUseCase historyUseCase;

    private Long resolveUserId(HttpServletRequest request) {
        try {
            return SecurityUtil.getCurrentUserId();
        } catch (Exception e) {
            String headerId = request.getHeader("X-USER-ID");
            if (headerId != null && !headerId.isEmpty()) {
                return Long.parseLong(headerId);
            }
            return 1L; // 임시 폴백
        }
    }

    @GetMapping("/download")
    public Object downloadData(
            @RequestParam GovDownloadType type,
            @RequestParam GovDownloadFormat format,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "ALL") String town,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        // 날짜 범위 검증
        if (startDate.isAfter(endDate)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("E-GOV-DL-001", "시작일이 종료일보다 클 수 없습니다."));
        }
        if (startDate.isBefore(LocalDate.of(2020, 1, 1))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("E-GOV-DL-002", "2020년 이전 데이터는 지원하지 않습니다."));
        }

        try {
            // 파일명 규칙: farmbalance_{type}_{yyyyMMdd}.{xlsx|csv}
            String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String ext = format == GovDownloadFormat.XLSX ? "xlsx" : "csv";
            String filename = "farmbalance_" + type.name().toLowerCase() + "_" + dateStr + "." + ext;
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            // Content-Type 설정
            if (format == GovDownloadFormat.XLSX) {
                response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            } else {
                response.setContentType("text/csv; charset=UTF-8");
            }
            response.setHeader("Content-Disposition",
                    "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename);
            response.setCharacterEncoding("UTF-8");

            Long userId = resolveUserId(request);

            // 이력 저장 (파일 생성 직전)
            historyPort.save(DownloadHistory.builder()
                    .userId(userId)
                    .type(type.name())
                    .format(format.name())
                    .startDate(startDate)
                    .endDate(endDate)
                    .town(town)
                    .build());

            // OutputStream에 직접 기록 (서버 파일 저장 없음)
            downloadUseCase.exportData(type, format, startDate, endDate, town, response.getOutputStream());
            response.getOutputStream().flush();
            return null;

        } catch (Exception e) {
            log.error("[Gov Download] 데이터 내보내기 실패: type={}, format={}", type, format, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail("E-GOV-DL-500", "데이터 내보내기에 실패했습니다."));
        }
    }

    /** 최근 다운로드 이력 조회 (최신 10건) */
    @GetMapping("/download/history")
    public ApiResponse<List<DownloadHistory>> getDownloadHistory(HttpServletRequest request) {
        Long userId = resolveUserId(request);
        return ApiResponse.ok(historyUseCase.getRecentHistory(userId));
    }
}
