package com.farmbalance.community.adapter.in.web;

import com.farmbalance.community.adapter.in.web.dto.MyCommentActivityResponse;
import com.farmbalance.community.adapter.in.web.dto.MyPostActivityResponse;
import com.farmbalance.community.adapter.in.web.dto.MyReportActivityResponse;
import com.farmbalance.community.application.port.out.CommentPort;
import com.farmbalance.community.application.port.out.LoadPostCategoryPort;
import com.farmbalance.community.application.port.out.PostPort;
import com.farmbalance.community.domain.model.Comment;
import com.farmbalance.community.domain.model.Post;
import com.farmbalance.global.response.ApiResponse;
import com.farmbalance.global.security.SecurityUtil;
import com.farmbalance.global.report.domain.Report;
import com.farmbalance.global.report.port.ReportPort;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "커뮤니티 - 내 활동", description = "마이페이지 커뮤니티 활동 이력 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community/me")
public class MyCommunityActivityController {

    private final PostPort postPort;
    private final CommentPort commentPort;
    private final LoadPostCategoryPort loadPostCategoryPort;
    private final ReportPort reportPort;

    @Operation(summary = "내 게시글 목록")
    @GetMapping("/posts")
    public ApiResponse<List<MyPostActivityResponse>> getMyPosts(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = SecurityUtil.getCurrentUserId();
        Page<Post> posts = postPort.findByAuthorIdAndStatus(userId, status, pageable);
        List<Long> postIds = posts.getContent().stream()
                .map(Post::getId)
                .collect(Collectors.toList());
        Map<Long, Long> commentCountMap = commentPort.countByPostIds(postIds);
        Page<MyPostActivityResponse> page = posts
                .map(post -> MyPostActivityResponse.of(
                        post,
                        loadPostCategoryPort.findNameById(post.getCategoryId()),
                        commentCountMap.getOrDefault(post.getId(), 0L).intValue()
                ));
        return ApiResponse.ok(page.getContent(),
                ApiResponse.Meta.of(page.getNumber(), page.getSize(), page.getTotalElements()));
    }

    @Operation(summary = "내 댓글 목록")
    @GetMapping("/comments")
    public ApiResponse<List<MyCommentActivityResponse>> getMyComments(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = SecurityUtil.getCurrentUserId();
        Page<Comment> comments = commentPort.findByAuthorIdAndStatus(userId, status, pageable);
        List<Long> postIds = comments.getContent().stream()
                .map(Comment::getPostId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> postTitleMap = postPort.findActiveTitlesByIds(postIds);
        Page<MyCommentActivityResponse> page = comments
                .map(comment -> MyCommentActivityResponse.of(
                        comment,
                        postTitleMap.getOrDefault(comment.getPostId(), "(삭제되었거나 없는 게시글)")
                ));
        return ApiResponse.ok(page.getContent(),
                ApiResponse.Meta.of(page.getNumber(), page.getSize(), page.getTotalElements()));
    }

    @Operation(summary = "내 신고 목록")
    @GetMapping("/reports")
    public ApiResponse<List<MyReportActivityResponse>> getMyReports(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = SecurityUtil.getCurrentUserId();
        Page<Report> reports = reportPort.findByReporterId(userId, pageable);
        Map<Long, String> postTitleMap = buildPostTitleMap(reports.getContent());
        Map<Long, String> commentContentMap = buildCommentContentMap(reports.getContent());
        Page<MyReportActivityResponse> page = reports
                .map(report -> MyReportActivityResponse.of(
                        report,
                        resolveReportTargetTitle(report, postTitleMap, commentContentMap)
                ));
        return ApiResponse.ok(page.getContent(),
                ApiResponse.Meta.of(page.getNumber(), page.getSize(), page.getTotalElements()));
    }

    private Map<Long, String> buildPostTitleMap(List<Report> reports) {
        List<Long> postIds = reports.stream()
                .filter(r -> "POST".equalsIgnoreCase(r.getTargetType()))
                .map(Report::getTargetId)
                .distinct()
                .collect(Collectors.toList());
        return postPort.findActiveTitlesByIds(postIds);
    }

    private Map<Long, String> buildCommentContentMap(List<Report> reports) {
        List<Long> commentIds = reports.stream()
                .filter(r -> "COMMENT".equalsIgnoreCase(r.getTargetType()))
                .map(Report::getTargetId)
                .distinct()
                .collect(Collectors.toList());
        return commentPort.findActiveContentsByIds(commentIds);
    }

    private String resolveReportTargetTitle(Report report, Map<Long, String> postTitleMap, Map<Long, String> commentContentMap) {
        if ("POST".equalsIgnoreCase(report.getTargetType())) {
            return postTitleMap.getOrDefault(report.getTargetId(), "(삭제되었거나 없는 게시글)");
        }
        if ("COMMENT".equalsIgnoreCase(report.getTargetType())) {
            String content = commentContentMap.get(report.getTargetId());
            if (content == null || content.isBlank()) {
                return "(삭제되었거나 없는 댓글)";
            }
            return content.length() > 50 ? content.substring(0, 50) + "..." : content;
        }
        return "(알 수 없는 대상)";
    }
}
