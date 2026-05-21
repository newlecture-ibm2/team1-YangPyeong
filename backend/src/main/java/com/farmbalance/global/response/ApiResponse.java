package com.farmbalance.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * 모든 API 응답의 공통 래퍼.
 * 프론트엔드 BFF의 ApiResponse<T>와 1:1 대응됩니다.
 *
 * <pre>
 * 기획서 API 응답 표준:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "error": null,
 *   "meta": { "page": 1, "size": 20, "total": 100 }
 * }
 * </pre>
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorDetail error;
    private Meta meta;

    /** 성공 응답 (데이터만) */
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }

    /** 성공 응답 (데이터 + 페이징 메타 정보) */
    public static <T> ApiResponse<T> ok(T data, Meta meta) {
        return ApiResponse.<T>builder().success(true).data(data).meta(meta).build();
    }

    /** 실패 응답 */
    public static <T> ApiResponse<T> fail(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(new ErrorDetail(code, message))
                .build();
    }

    @Getter
    public static class ErrorDetail {
        private final String code;
        private final String message;

        public ErrorDetail(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }

    /**
     * 페이징 메타 정보.
     * PageResponse 대신 ApiResponse 안에 meta로 포함시킬 때 사용합니다.
     */
    @Getter
    @Builder
    public static class Meta {
        private final int page;
        private final int size;
        private final long total;
        private final int totalPages;

        public static Meta of(int page, int size, long total) {
            return Meta.builder()
                    .page(page)
                    .size(size)
                    .total(total)
                    .totalPages((int) Math.ceil((double) total / size))
                    .build();
        }
    }
}
