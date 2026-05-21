package com.farmbalance.global.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * 페이징 응답 래퍼
 */
@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class PageResponse<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalCount;
    private final int totalPages;

    public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalCount) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalCount(totalCount)
                .totalPages((int) Math.ceil((double) totalCount / size))
                .build();
    }
}
