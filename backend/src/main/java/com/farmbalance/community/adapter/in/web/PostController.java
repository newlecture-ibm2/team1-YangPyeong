package com.farmbalance.community.adapter.in.web;

import com.farmbalance.community.adapter.in.web.dto.PostRequest;
import com.farmbalance.community.adapter.in.web.dto.PostResponse;
import com.farmbalance.community.application.port.in.CreatePostUseCase;
import com.farmbalance.community.application.port.in.DeletePostUseCase;
import com.farmbalance.community.application.port.in.LoadPostUseCase;
import com.farmbalance.community.application.port.in.UpdatePostUseCase;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.user.domain.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.user.adapter.out.persistence.entity.UserJpaEntity;
import com.farmbalance.user.adapter.out.persistence.repository.UserJpaRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "커뮤니티 - 게시글", description = "커뮤니티 게시글 CRUD API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community/posts")
public class PostController {

    private final CreatePostUseCase createPostUseCase;
    private final LoadPostUseCase loadPostUseCase;
    private final UpdatePostUseCase updatePostUseCase;
    private final DeletePostUseCase deletePostUseCase;
    private final com.farmbalance.community.application.port.in.ReportPostUseCase reportPostUseCase; // 추가
    private final com.farmbalance.community.application.port.out.CommentPort commentPort;
    private final com.farmbalance.community.application.port.out.LoadPostCategoryPort loadPostCategoryPort;
    private final UserJpaRepository userJpaRepository;

    private String resolveNickname(Long authorId) {
        return userJpaRepository.findById(authorId)
                .map(UserJpaEntity::getName)
                .orElse("알 수 없음");
    }

    /** 작성자 계정 상태 문자열 (ACTIVE / WITHDRAWN / SUSPENDED 등) */
    private String resolveStatus(Long authorId) {
        return userJpaRepository.findById(authorId)
                .map(u -> u.getStatus().name())
                .orElse("UNKNOWN");
    }

    private Long getUserId(Authentication auth) {
        return SecurityUtil.getCurrentUserId();
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.name()));
    }

    @Operation(summary = "게시글 작성")
    @PostMapping
    public ApiResponse<PostResponse> createPost(@RequestBody PostRequest request, Authentication authentication) {
        Long userId = getUserId(authentication);
        
        com.farmbalance.community.domain.model.Post domainPost = 
                createPostUseCase.createPost(userId, request.getCategoryId(), request.getTitle(), request.getContent(), request.isNotice());
        
        PostResponse response = PostResponse.fromDomain(
                domainPost,
                loadPostCategoryPort.findNameById(domainPost.getCategoryId()),
                0,
                resolveNickname(domainPost.getAuthorId()),
                resolveStatus(domainPost.getAuthorId()),
                false
        );
        return ApiResponse.ok(response);
    }

    @Operation(summary = "게시글 목록 조회")
    @GetMapping
    public ApiResponse<List<PostResponse>> getPosts(
            @RequestParam(required = false) List<Long> categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String searchType,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<PostResponse> result = loadPostUseCase.getPosts(categoryId, keyword, searchType, pageable)
                .map(post -> PostResponse.fromDomain(
                        post,
                        loadPostCategoryPort.findNameById(post.getCategoryId()),
                        (int) commentPort.countByPostId(post.getId()),
                        resolveNickname(post.getAuthorId()),
                        resolveStatus(post.getAuthorId()),
                        commentPort.existsAcceptedByPostId(post.getId())
                ));
        
        return ApiResponse.ok(
                result.getContent(),
                ApiResponse.Meta.of(result.getNumber(), result.getSize(), result.getTotalElements())
        );
    }

    @Operation(summary = "게시글 상세 조회")
    @GetMapping("/{postId}")
    public ApiResponse<PostResponse> getPost(@PathVariable Long postId, Authentication authentication) {
        Long requesterId = null;
        if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
            requesterId = getUserId(authentication);
        }
        
        com.farmbalance.community.domain.model.Post post = loadPostUseCase.getPostDetail(postId, requesterId, isAdmin(authentication));
        return ApiResponse.ok(PostResponse.fromDomain(
                post,
                loadPostCategoryPort.findNameById(post.getCategoryId()),
                (int) commentPort.countByPostId(post.getId()),
                resolveNickname(post.getAuthorId()),
                resolveStatus(post.getAuthorId()),
                commentPort.existsAcceptedByPostId(post.getId())
        ));
    }

    @Operation(summary = "게시글 수정")
    @PutMapping("/{postId}")
    public ApiResponse<PostResponse> updatePost(
            @PathVariable Long postId,
            @RequestBody PostRequest request,
            Authentication authentication) {
        
        Long userId = getUserId(authentication);
        boolean admin = isAdmin(authentication);
        
        com.farmbalance.community.domain.model.Post post = 
                updatePostUseCase.updatePost(postId, userId, request.getCategoryId(), request.getTitle(), request.getContent(), request.isNotice(), admin);
        
        PostResponse response = PostResponse.fromDomain(
                post,
                loadPostCategoryPort.findNameById(post.getCategoryId()),
                (int) commentPort.countByPostId(post.getId()),
                resolveNickname(post.getAuthorId()),
                resolveStatus(post.getAuthorId()),
                commentPort.existsAcceptedByPostId(post.getId())
        );
        return ApiResponse.ok(response);
    }

    @Operation(summary = "게시글 삭제")
    @DeleteMapping("/{postId}")
    public ApiResponse<Void> deletePost(@PathVariable Long postId, Authentication authentication) {
        deletePostUseCase.deletePost(postId, getUserId(authentication), isAdmin(authentication));
        return ApiResponse.ok(null);
    }

    @Operation(summary = "게시글 신고")
    @PostMapping("/{postId}/report")
    public ApiResponse<Void> reportPost(
            @PathVariable Long postId,
            @RequestBody com.farmbalance.community.adapter.in.web.dto.ReportRequest request,
            Authentication authentication) {
        reportPostUseCase.reportPost(postId, getUserId(authentication), request.getReason());
        return ApiResponse.ok(null);
    }
}

