package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.application.port.in.ManageCommunityUseCase;
import com.farmbalance.admin.domain.AdminPost;
import com.farmbalance.admin.adapter.in.web.dto.HideRequest;
import com.farmbalance.admin.adapter.in.web.dto.BulkDeleteRequest;
import com.farmbalance.global.response.ApiResponse;
import jakarta.validation.Valid;
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
     * 댓글 숨김 (관리자 제재/AI 차단)
     * PATCH /api/admin/community/comments/{commentId}/hide
     */
    @PatchMapping("/comments/{commentId}/hide")
    public ApiResponse<Void> hideComment(@PathVariable Long commentId, @Valid @RequestBody HideRequest request) {
        manageCommunityUseCase.hideComment(commentId, request.getReason());
        return ApiResponse.ok(null);
    }

    /**
     * 댓글 일괄 삭제 (격리된 상태에서만 가능)
     * POST /api/admin/community/comments/bulk-delete
     */
    @PostMapping("/comments/bulk-delete")
    public ApiResponse<Void> bulkDeleteComments(@Valid @RequestBody BulkDeleteRequest request) {
        manageCommunityUseCase.bulkDeleteComments(request.getIds());
        return ApiResponse.ok(null);
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
     * 게시글 숨김 (관리자 제재/AI 차단)
     * PATCH /api/admin/community/{postId}/hide
     */
    @PatchMapping("/{postId}/hide")
    public ApiResponse<Void> hidePost(@PathVariable Long postId, @Valid @RequestBody HideRequest request) {
        manageCommunityUseCase.hidePost(postId, request.getReason());
        return ApiResponse.ok(null);
    }

    /**
     * 게시글 일괄 삭제 (격리된 상태에서만 가능)
     * POST /api/admin/community/bulk-delete
     */
    @PostMapping("/bulk-delete")
    public ApiResponse<Void> bulkDeletePosts(@Valid @RequestBody BulkDeleteRequest request) {
        manageCommunityUseCase.bulkDeletePosts(request.getIds());
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
     * 게시글 복구 (restore soft delete)
     * PATCH /api/admin/community/{postId}/restore
     */
    @PatchMapping("/{postId}/restore")
    public ApiResponse<Void> restorePost(@PathVariable Long postId) {
        manageCommunityUseCase.restorePost(postId);
        return ApiResponse.ok(null);
    }

    /**
     * 댓글 복구 (restore soft delete)
     * PATCH /api/admin/community/comments/{commentId}/restore
     */
    @PatchMapping("/comments/{commentId}/restore")
    public ApiResponse<Void> restoreComment(@PathVariable Long commentId) {
        manageCommunityUseCase.restoreComment(commentId);
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
        Long adminId = com.farmbalance.global.security.SecurityUtil.getCurrentUserId();
        manageCommunityUseCase.createNotice(adminId, request);
        return ApiResponse.ok(null);
    }

    /**
     * 신고 내역 목록 조회
     * GET /api/admin/community/reports
     */
    @GetMapping("/reports")
    public ApiResponse<Map<String, Object>> getReports(
            @RequestParam(required = false, defaultValue = "PENDING") String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        List<com.farmbalance.admin.domain.AdminGroupedReport> reports = manageCommunityUseCase.getReports(status, page, size);
        long total = manageCommunityUseCase.countReports(status);
        return ApiResponse.ok(Map.of(
                "reports", reports,
                "totalElements", total,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    /**
     * 특정 타겟 신고 상태 일괄 변경
     * PATCH /api/admin/community/reports/target/status
     * Body: { "targetType": "POST", "targetId": 1, "status": "RESOLVED" }
     */
    @PatchMapping("/reports/target/status")
    public ApiResponse<Void> updateReportStatusByTarget(@RequestBody Map<String, Object> body) {
        String targetType = (String) body.get("targetType");
        Number targetIdNum = (Number) body.get("targetId");
        String status = (String) body.get("status");

        if (targetType == null || targetIdNum == null || status == null || status.isBlank()) {
            throw new IllegalArgumentException("targetType, targetId, and status are required");
        }

        manageCommunityUseCase.updateReportStatusByTarget(targetType, targetIdNum.longValue(), status.toUpperCase());
        return ApiResponse.ok(null);
    }

    /**
     * 특정 타겟 신고 제재 일괄 처리
     * POST /api/admin/community/reports/target/sanction
     * Body: { "targetType": "POST", "targetId": 1, "deleteContent": true, "suspendUser": true }
     */
    @PostMapping("/reports/target/sanction")
    public ApiResponse<Void> sanctionReportByTarget(@RequestBody Map<String, Object> request) {
        String targetType = (String) request.get("targetType");
        Number targetIdNum = (Number) request.get("targetId");
        Boolean deleteContent = (Boolean) request.getOrDefault("deleteContent", false);
        Boolean suspendUser = (Boolean) request.getOrDefault("suspendUser", false);

        if (targetType == null || targetIdNum == null) {
            throw new IllegalArgumentException("targetType and targetId are required");
        }

        manageCommunityUseCase.sanctionReportByTarget(targetType, targetIdNum.longValue(), deleteContent, suspendUser);
        return ApiResponse.ok(null);
    }

    /**
     * 특정 타겟(게시물/댓글) 신고 제재 일괄 복구 (Undo)
     * POST /api/admin/community/reports/target/sanction/undo
     * Body: { "targetType": "POST", "targetId": 1 }
     */
    @PostMapping("/reports/target/sanction/undo")
    public ApiResponse<Void> undoSanctionByTarget(@RequestBody Map<String, Object> request) {
        String targetType = (String) request.get("targetType");
        Number targetIdNum = (Number) request.get("targetId");

        if (targetType == null || targetIdNum == null) {
            throw new IllegalArgumentException("targetType and targetId are required");
        }

        manageCommunityUseCase.undoSanctionByTarget(targetType, targetIdNum.longValue());
        return ApiResponse.ok(null);
    }

    /**
     * AI 일괄 스팸 청소 실행
     * POST /api/admin/community/ai-moderate
     */
    @PostMapping("/ai-moderate")
    public ApiResponse<Map<String, Integer>> aiModerate() {
        int hiddenCount = manageCommunityUseCase.aiModerateActivePosts();
        return ApiResponse.ok(Map.of("hiddenCount", hiddenCount));
    }
}
