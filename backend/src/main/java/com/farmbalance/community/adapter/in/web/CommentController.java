package com.farmbalance.community.adapter.in.web;

import com.farmbalance.community.adapter.in.web.dto.CommentRequest;
import com.farmbalance.community.adapter.in.web.dto.CommentResponse;
import com.farmbalance.community.application.port.in.*;
import com.farmbalance.community.adapter.in.web.dto.ReportRequest;
import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.user.domain.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.UserJpaRepository;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "커뮤니티 - 댓글", description = "커뮤니티 댓글 CRUD 및 채택 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community")
public class CommentController {

    private final CreateCommentUseCase createCommentUseCase;
    private final LoadCommentUseCase loadCommentUseCase;
    private final DeleteCommentUseCase deleteCommentUseCase;
    private final AcceptCommentUseCase acceptCommentUseCase;
    private final UpdateCommentUseCase updateCommentUseCase;
    private final ReportCommentUseCase reportCommentUseCase;
    private final UserJpaRepository userJpaRepository;

    @Operation(summary = "댓글 수정")
    @PutMapping("/comments/{commentId}")
    public ApiResponse<CommentResponse> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentRequest request,
            Authentication authentication) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        com.farmbalance.community.domain.model.Comment domainComment = 
                updateCommentUseCase.updateComment(commentId, userId, request.getContent());
        
        CommentResponse response = CommentResponse.fromDomain(
                domainComment,
                resolveNickname(domainComment.getAuthorId())
        );
        return ApiResponse.ok(response);
    }

    private String resolveNickname(Long authorId) {
        return userJpaRepository.findById(authorId)
                .map(UserJpaEntity::getName)
                .orElse("알 수 없음");
    }

    private Long getUserId(Authentication auth) {
        return SecurityUtil.getCurrentUserId();
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.name()));
    }

    @Operation(summary = "댓글 작성")
    @PostMapping("/posts/{postId}/comments")
    public ApiResponse<CommentResponse> createComment(
            @PathVariable Long postId,
            @RequestBody CommentRequest request,
            Authentication authentication) {
        
        Long userId = getUserId(authentication);

        com.farmbalance.community.domain.model.Comment domainComment = 
                createCommentUseCase.createComment(postId, userId, request.getContent());
        
        CommentResponse response = CommentResponse.fromDomain(
                domainComment,
                resolveNickname(domainComment.getAuthorId())
        );
        return ApiResponse.ok(response);
    }

    @Operation(summary = "댓글 목록 조회")
    @GetMapping("/posts/{postId}/comments")
    public ApiResponse<List<CommentResponse>> getComments(@PathVariable Long postId) {
        List<CommentResponse> response = loadCommentUseCase.getComments(postId).stream()
                .map(comment -> CommentResponse.fromDomain(comment, resolveNickname(comment.getAuthorId())))
                .collect(Collectors.toList());
        return ApiResponse.ok(response);
    }

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/comments/{commentId}")
    public ApiResponse<Void> deleteComment(@PathVariable Long commentId, Authentication authentication) {
        deleteCommentUseCase.deleteComment(commentId, getUserId(authentication), isAdmin(authentication));
        return ApiResponse.ok(null);
    }

    @Operation(summary = "답변 채택 (Q&A 전용)")
    @PutMapping("/comments/{commentId}/accept")
    public ApiResponse<Void> acceptComment(@PathVariable Long commentId, Authentication authentication) {
        acceptCommentUseCase.acceptComment(commentId, getUserId(authentication));
        return ApiResponse.ok(null);
    }

    @Operation(summary = "댓글 신고")
    @PostMapping("/comments/{commentId}/report")
    public ApiResponse<Void> reportComment(
            @PathVariable Long commentId,
            @RequestBody ReportRequest request,
            Authentication authentication) {
        reportCommentUseCase.reportComment(commentId, getUserId(authentication), request.getReason());
        return ApiResponse.ok(null);
    }
}

