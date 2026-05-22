package com.farmbalance.admin.application.service;

import com.farmbalance.admin.adapter.in.web.dto.CreateNoticeRequest;
import com.farmbalance.admin.application.port.in.ManageCommunityUseCase;
import com.farmbalance.admin.application.port.out.AdminPostPort;
import com.farmbalance.admin.application.port.out.AdminAiPort;
import com.farmbalance.admin.application.port.out.AdminAiPort.ModerationItemDto;
import com.farmbalance.admin.application.port.out.AdminAiPort.ModerationResultDto;
import com.farmbalance.admin.domain.AdminPost;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.user.application.port.out.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ADM-008 커뮤니티 관리 UseCase 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityManagementService implements ManageCommunityUseCase {

    private final AdminPostPort adminPostPort;
    private final com.farmbalance.admin.application.port.out.AdminCommentPort adminCommentPort;
    private final com.farmbalance.admin.application.port.out.AdminReportPort adminReportPort;
    private final AdminAiPort adminAiPort;
    private final UserRepository userRepository;
    private final com.farmbalance.notification.application.port.in.NotificationUseCase notificationUseCase;

    @Override
    public List<AdminPost> getPosts(String keyword, String status, int page, int size) {
        int offset = page * size;
        return adminPostPort.findByFilter(keyword, status, offset, size);
    }

    @Override
    public long countPosts(String keyword, String status) {
        return adminPostPort.countByFilter(keyword, status);
    }

    @Override
    public AdminPost getPost(Long postId) {
        return adminPostPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    }

    @Override
    public List<com.farmbalance.admin.domain.AdminComment> getComments(String keyword, String status, int page, int size) {
        int offset = page * size;
        return adminCommentPort.findByFilter(keyword, status, offset, size);
    }

    @Override
    public long countComments(String keyword, String status) {
        return adminCommentPort.countByFilter(keyword, status);
    }

    @Override
    public List<com.farmbalance.admin.domain.AdminComment> getComments(Long postId) {
        return adminCommentPort.findByPostId(postId);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        com.farmbalance.admin.domain.AdminComment comment = adminCommentPort.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.isHidden()) {
            throw new BusinessException(ErrorCode.COMMUNITY_MUST_BE_HIDDEN_BEFORE_DELETE);
        }

        adminCommentPort.delete(commentId);
        
        String snippet = comment.getContent() != null ? comment.getContent() : "";
        if (snippet.length() > 15) snippet = snippet.substring(0, 15) + "...";
        notificationUseCase.createNotification(
                comment.getAuthorId(),
                com.farmbalance.notification.domain.NotificationType.SYSTEM,
                com.farmbalance.notification.domain.NotificationCategory.SYSTEM,
                "댓글 삭제 안내",
                String.format("[%s] 댓글이 삭제 처리되었습니다.", snippet),
                "/mypage/community"
        );
    }

    @Override
    @Transactional
    public void deletePost(Long postId) {
        AdminPost post = adminPostPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.isHidden()) {
            throw new BusinessException(ErrorCode.COMMUNITY_MUST_BE_HIDDEN_BEFORE_DELETE);
        }

        adminPostPort.delete(postId);
        
        String title = post.getTitle() != null ? post.getTitle() : "게시글";
        notificationUseCase.createNotification(
                post.getAuthorId(),
                com.farmbalance.notification.domain.NotificationType.SYSTEM,
                com.farmbalance.notification.domain.NotificationCategory.SYSTEM,
                "게시글 삭제 안내",
                String.format("[%s] 게시글이 삭제 처리되었습니다.", title),
                "/mypage/community"
        );
    }

    @Override
    @Transactional
    public void hidePost(Long postId, String reason) {
        AdminPost post = adminPostPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        adminPostPort.hide(postId, reason);
        
        String title = post.getTitle() != null ? post.getTitle() : "게시글";
        String reasonStr = (reason != null && !reason.isBlank()) ? " 사유: " + reason : "";
        notificationUseCase.createNotification(
                post.getAuthorId(),
                com.farmbalance.notification.domain.NotificationType.SYSTEM,
                com.farmbalance.notification.domain.NotificationCategory.SYSTEM,
                "게시글 숨김 안내",
                String.format("[%s] 게시글이 숨김 처리되었습니다.%s", title, reasonStr),
                "/mypage/community"
        );
    }

    @Override
    @Transactional
    public void bulkDeletePosts(List<Long> postIds) {
        // 실제 구현에서는 hidden 상태인 것들만 삭제되도록 해야 함 (어댑터에서 쿼리 또는 여기서 루프 필터링)
        adminPostPort.bulkDelete(postIds);
    }

    @Override
    @Transactional
    public void hideComment(Long commentId, String reason) {
        com.farmbalance.admin.domain.AdminComment comment = adminCommentPort.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        adminCommentPort.hide(commentId, reason);
        
        String snippet = comment.getContent() != null ? comment.getContent() : "";
        if (snippet.length() > 15) snippet = snippet.substring(0, 15) + "...";
        String reasonStr = (reason != null && !reason.isBlank()) ? " 사유: " + reason : "";
        notificationUseCase.createNotification(
                comment.getAuthorId(),
                com.farmbalance.notification.domain.NotificationType.SYSTEM,
                com.farmbalance.notification.domain.NotificationCategory.SYSTEM,
                "댓글 숨김 안내",
                String.format("[%s] 댓글이 숨김 처리되었습니다.%s", snippet, reasonStr),
                "/mypage/community"
        );
    }

    @Override
    @Transactional
    public void bulkDeleteComments(List<Long> commentIds) {
        adminCommentPort.bulkDelete(commentIds);
    }

    @Override
    @Transactional
    public void restorePost(Long postId) {
        adminPostPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        adminPostPort.restore(postId);
    }

    @Override
    @Transactional
    public void restoreComment(Long commentId) {
        adminCommentPort.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        adminCommentPort.restore(commentId);
    }

    @Override
    @Transactional
    public void toggleNotice(Long postId, boolean isNotice) {
        adminPostPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        adminPostPort.updateNotice(postId, isNotice);
    }

    @Override
    @Transactional
    public void createNotice(Long adminId, CreateNoticeRequest request) {
        AdminPost notice = AdminPost.builder()
                .authorId(adminId)
                .categoryId(request.getCategoryId())
                .title(request.getTitle())
                .content(request.getContent())
                .isNotice(true)
                .build();
        
        adminPostPort.save(notice);
    }

    @Override
    public List<com.farmbalance.admin.domain.AdminGroupedReport> getReports(String status, int page, int size) {
        int offset = page * size;
        return adminReportPort.findGroupedByFilter(status, offset, size);
    }

    @Override
    public long countReports(String status) {
        return adminReportPort.countGroupedByFilter(status);
    }

    @Override
    @Transactional
    public void updateReportStatusByTarget(String targetType, Long targetId, String status) {
        adminReportPort.updateStatusByTarget(targetType, targetId, status);
    }

    @Override
    @Transactional
    public void sanctionReportByTarget(String targetType, Long targetId, boolean hideContent, boolean deleteContent, boolean suspendUser) {
        
        java.util.List<String> actions = new java.util.ArrayList<>();

        if ("POST".equals(targetType)) {
            AdminPost post = adminPostPort.findById(targetId).orElse(null);
            if (post != null) {
                if (hideContent) {
                    adminPostPort.hide(post.getId(), "신고 누적으로 인한 숨김 처리");
                    actions.add("게시글 숨김");
                }
                if (deleteContent) {
                    adminPostPort.delete(post.getId());
                    actions.add("게시글 삭제");
                }
                if (suspendUser) {
                    userRepository.updateStatus(post.getAuthorId(), "SUSPENDED", "신고 누적");
                    actions.add("작성자 정지");
                }
            }
        } else if ("COMMENT".equals(targetType)) {
            com.farmbalance.admin.domain.AdminComment comment = adminCommentPort.findById(targetId).orElse(null);
            if (comment != null) {
                if (hideContent) {
                    adminCommentPort.hide(comment.getId(), "신고 누적으로 인한 숨김 처리");
                    actions.add("댓글 숨김");
                }
                if (deleteContent) {
                    adminCommentPort.delete(comment.getId());
                    actions.add("댓글 삭제");
                }
                if (suspendUser) {
                    userRepository.updateStatus(comment.getAuthorId(), "SUSPENDED", "신고 누적");
                    actions.add("작성자 정지");
                }
            }
        }

        String actionTakenStr = String.join(", ", actions);
        adminReportPort.updateStatusAndActionByTarget(targetType, targetId, "RESOLVED", actionTakenStr);

        // 발송용 알림 제목 및 내용 구성 (첫 번째 액션 기준)
        if (!actions.isEmpty()) {
            String title = "커뮤니티 제재 안내";
            String contentPrefix = "POST".equals(targetType) ? "회원님의 게시글이 " : "회원님의 댓글이 ";
            String content = contentPrefix + "신고 누적 및 운영정책 위반으로 인해 [" + actions.get(0) + "] 처리되었습니다.";
            
            Long authorId = null;
            if ("POST".equals(targetType)) {
                AdminPost post = adminPostPort.findById(targetId).orElse(null);
                if (post != null) authorId = post.getAuthorId();
            } else if ("COMMENT".equals(targetType)) {
                com.farmbalance.admin.domain.AdminComment comment = adminCommentPort.findById(targetId).orElse(null);
                if (comment != null) authorId = comment.getAuthorId();
            }

            if (authorId != null) {
                notificationUseCase.createNotification(
                        authorId,
                        com.farmbalance.notification.domain.NotificationType.SYSTEM,
                        com.farmbalance.notification.domain.NotificationCategory.SYSTEM,
                        title,
                        content,
                        "/mypage/community"
                );
            }
        }
    }

    @Override
    @Transactional
    public void undoSanctionByTarget(String targetType, Long targetId) {
        // 일괄 '대기중(PENDING)' 상태로 업데이트하여 복구
        adminReportPort.updateStatusByTarget(targetType, targetId, "PENDING");

        if ("POST".equals(targetType)) {
            AdminPost post = adminPostPort.findById(targetId).orElse(null);
            if (post != null) {
                adminPostPort.restore(post.getId());
                userRepository.updateStatus(post.getAuthorId(), "ACTIVE", "관리자 신고 제재 취소");
            }
        } else if ("COMMENT".equals(targetType)) {
            com.farmbalance.admin.domain.AdminComment comment = adminCommentPort.findById(targetId).orElse(null);
            if (comment != null) {
                adminCommentPort.restore(comment.getId());
                userRepository.updateStatus(comment.getAuthorId(), "ACTIVE", "관리자 신고 제재 취소");
            }
        }
    }

    @Override
    @Transactional
    public int aiModerateActivePosts() {
        int hiddenCount = 0;

        // 1. 최신 ACTIVE 게시글 조회 (예: 100개)
        List<AdminPost> activePosts = adminPostPort.findByFilter("", "ACTIVE", 0, 100);
        if (!activePosts.isEmpty()) {
            List<ModerationItemDto> itemsToAudit = activePosts.stream().map(p -> {
                String content = p.getContent() != null ? p.getContent() : "";
                if (content.length() > 300) {
                    content = content.substring(0, 300);
                }
                return new ModerationItemDto(p.getId(), p.getTitle(), content);
            }).toList();

            List<ModerationResultDto> results = adminAiPort.moderatePostBatch(itemsToAudit);
            for (ModerationResultDto result : results) {
                if (!result.clean()) {
                    String reason = result.reason() != null && !result.reason().isBlank() ? result.reason() : "AI 시스템에 의한 자동 유해성 판단";
                    adminPostPort.hide(result.postId(), reason);
                    hiddenCount++;
                }
            }
        }

        // 2. 최신 ACTIVE 댓글 조회 (예: 100개)
        List<com.farmbalance.admin.domain.AdminComment> activeComments = adminCommentPort.findRecentActiveComments(100);
        if (!activeComments.isEmpty()) {
            List<AdminAiPort.CommentModerationItemDto> commentItemsToAudit = activeComments.stream().map(c -> {
                String content = c.getContent() != null ? c.getContent() : "";
                if (content.length() > 300) {
                    content = content.substring(0, 300);
                }
                return new AdminAiPort.CommentModerationItemDto(c.getId(), content);
            }).toList();

            List<AdminAiPort.CommentModerationResultDto> commentResults = adminAiPort.moderateCommentBatch(commentItemsToAudit);
            for (AdminAiPort.CommentModerationResultDto result : commentResults) {
                if (!result.clean()) {
                    String reason = result.reason() != null && !result.reason().isBlank() ? result.reason() : "AI 시스템에 의한 자동 유해성 판단";
                    adminCommentPort.hide(result.commentId(), reason);
                    hiddenCount++;
                }
            }
        }

        return hiddenCount;
    }
}
