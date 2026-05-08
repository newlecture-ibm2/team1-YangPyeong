package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.ManageCommunityUseCase;
import com.farmbalance.admin.domain.AdminPost;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ADM-008 커뮤니티 관리 Controller (Driving Adapter)
 * API URL: /api/admin/community
 */
@RestController
@RequestMapping("/api/admin/community")
@RequiredArgsConstructor
public class AdminCommunityController {

    private final ManageCommunityUseCase manageCommunityUseCase;

    /**
     * 전체 게시글 목록 조회 (관리자용)
     * GET /api/admin/community
     */
    @GetMapping
    public ApiResponse<List<AdminPost>> getAllPosts() {
        return ApiResponse.ok(manageCommunityUseCase.getAllPosts());
    }

    /**
     * 게시글 삭제 (soft delete)
     * DELETE /api/admin/community/{postId}
     */
    @DeleteMapping("/{postId}")
    public ApiResponse<Void> deletePost(@PathVariable Long postId) {
        manageCommunityUseCase.deletePost(postId);
        return ApiResponse.ok(null);
    }

    /**
     * 게시글 공지 설정/해제
     * PATCH /api/admin/community/{postId}/notice
     * Body: { "isNotice": true }
     */
    @PatchMapping("/{postId}/notice")
    public ApiResponse<Void> toggleNotice(@PathVariable Long postId,
                                           @RequestBody Map<String, Boolean> body) {
        Boolean isNotice = body.getOrDefault("isNotice", false);
        manageCommunityUseCase.toggleNotice(postId, isNotice);
        return ApiResponse.ok(null);
    }
}
