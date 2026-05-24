package com.farmbalance.global.error;

import com.farmbalance.global.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.util.stream.Collectors;

/**
 * 전역 예외 핸들러.
 * 모든 예외를 ApiResponse 형태로 통일하여 반환합니다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        log.warn("[Business] {} - {}", e.getCode(), e.getMessage());
        return ResponseEntity
                .status(e.getStatus())
                .body(ApiResponse.fail(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.fail(ErrorCode.VALIDATION_ERROR.getCode(), message));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        log.warn("[AccessDenied] {}", e.getMessage());
        ErrorCode ec = ErrorCode.ACCESS_DENIED;
        return ResponseEntity
                .status(ec.getStatus())
                .body(ApiResponse.fail(ec.getCode(), ec.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("[IllegalArgument] {}", e.getMessage(), e);
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.fail(ErrorCode.VALIDATION_ERROR.getCode(), e.getMessage()));
    }

    /** 클라이언트(브라우저/BFF)가 응답 전에 연결을 끊은 경우 — 분석 지연·타임아웃 시 흔함 */
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleClientDisconnect(AsyncRequestNotUsableException e) {
        log.warn("[ClientDisconnect] 응답 전송 중 연결 종료: {}", e.getMessage());
    }

    /** 정적 리소스(이미지 등) 404 — Internal 로그 없이 조용히 404만 반환 */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(
            org.springframework.web.servlet.resource.NoResourceFoundException e) {
        log.debug("[NotFound] 리소스 없음: {}", e.getMessage());
        return ResponseEntity
                .status(404)
                .body(ApiResponse.fail("E-404", "리소스를 찾을 수 없습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception e) {
        log.error("[Internal] 예기치 않은 오류", e);
        ErrorCode ec = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity
                .status(ec.getStatus())
                .body(ApiResponse.fail(ec.getCode(), ec.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(org.springframework.web.server.ResponseStatusException e) {
        log.warn("[ResponseStatus] {} - {}", e.getStatusCode(), e.getReason());
        return ResponseEntity
                .status(e.getStatusCode())
                .body(ApiResponse.fail("E-HTTP-" + e.getStatusCode().value(), e.getReason() != null ? e.getReason() : e.getMessage()));
    }
}
