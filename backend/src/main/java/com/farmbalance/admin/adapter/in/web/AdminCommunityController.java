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
     * 전체 게시글 목록 조회 (검색 + 필터 + 페이징)
     * GET /api/admin/community
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> getPosts(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        List<AdminPost> posts = manageCommunityUseCase.getPosts(keyword, status, page, size);
        long total = manageCommunityUseCase.countPosts(keyword, status);

        return ApiResponse.ok(Map.of(
                "posts", posts,
                "totalElements", total,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    /**
     * 특정 게시글 상세 조회
     * GET /api/admin/community/{postId}
     */
    @GetMapping("/{postId}")
    public ApiResponse<AdminPost> getPostDetail(@PathVariable Long postId) {
        return ApiResponse.ok(manageCommunityUseCase.getPost(postId));
    }

    /**
     * 특정 게시글의 댓글 목록 조회
     * GET /api/admin/community/{postId}/comments
     */
    @GetMapping("/{postId}/comments")
    public ApiResponse<List<com.farmbalance.admin.domain.AdminComment>> getComments(@PathVariable Long postId) {
        return ApiResponse.ok(manageCommunityUseCase.getComments(postId));
    }

    /**
     * 댓글 삭제 (soft delete)
     * DELETE /api/admin/community/comments/{commentId}
     */
    @DeleteMapping("/comments/{commentId}")
    public ApiResponse<Void> deleteComment(@PathVariable Long commentId) {
        manageCommunityUseCase.deleteComment(commentId);
        return ApiResponse.ok(null);
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

    /**
     * 신규 공지사항 작성
     * POST /api/admin/community/notices
     */
    @PostMapping("/notices")
    public ApiResponse<Void> createNotice(@RequestBody com.farmbalance.admin.adapter.in.web.dto.CreateNoticeRequest request) {
        // TODO: 로그인 기능 연동 후 실제 Admin ID 사용 (현재는 임시 1L)
        Long adminId = 1L; 
        manageCommunityUseCase.createNotice(adminId, request);
        return ApiResponse.ok(null);
    }
}
