package com.farmbalance.community.adapter.in.web;

import com.farmbalance.community.adapter.in.web.dto.CategoryResponse;
import com.farmbalance.community.application.port.out.LoadPostCategoryPort;
import com.farmbalance.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "커뮤니티 - 카테고리", description = "커뮤니티 카테고리 조회 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community/categories")
public class PostCategoryController {

    private final LoadPostCategoryPort loadPostCategoryPort;

    @Operation(summary = "커뮤니티 카테고리 목록 조회")
    @GetMapping
    public ApiResponse<List<CategoryResponse>> getCategories() {
        List<CategoryResponse> categories = loadPostCategoryPort.loadAllCategories().stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .build())
                .collect(Collectors.toList());
        
        return ApiResponse.ok(categories);
    }
}
