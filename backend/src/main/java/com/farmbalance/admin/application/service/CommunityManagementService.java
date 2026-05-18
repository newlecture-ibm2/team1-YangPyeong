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
    public List<com.farmbalance.admin.domain.AdminComment> getComments(Long postId) {
        return adminCommentPort.findByPostId(postId);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        adminCommentPort.delete(commentId);
    }

    @Override
    @Transactional
    public void deletePost(Long postId) {
        adminPostPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        adminPostPort.delete(postId);
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
    public void sanctionReportByTarget(String targetType, Long targetId, boolean deleteContent, boolean suspendUser) {
        // 일괄 '처리완료' 상태로 업데이트
        adminReportPort.updateStatusByTarget(targetType, targetId, "RESOLVED");

        if ("POST".equals(targetType)) {
            AdminPost post = adminPostPort.findById(targetId).orElse(null);
            if (post != null) {
                if (deleteContent) adminPostPort.delete(post.getId());
                if (suspendUser) userRepository.updateStatus(post.getAuthorId(), "SUSPENDED");
            }
        } else if ("COMMENT".equals(targetType)) {
            com.farmbalance.admin.domain.AdminComment comment = adminCommentPort.findById(targetId).orElse(null);
            if (comment != null) {
                if (deleteContent) adminCommentPort.delete(comment.getId());
                if (suspendUser) userRepository.updateStatus(comment.getAuthorId(), "SUSPENDED");
            }
        }
    }

    @Override
    @Transactional
    public int aiModerateActivePosts() {
        // 1. 최신 ACTIVE 게시글 조회 (예: 100개)
        List<AdminPost> activePosts = adminPostPort.findByFilter("", "ACTIVE", 0, 100);
        if (activePosts.isEmpty()) {
            return 0;
        }

        // 2. DTO 변환
        List<ModerationItemDto> itemsToAudit = activePosts.stream().map(p -> {
            String content = p.getContent() != null ? p.getContent() : "";
            if (content.length() > 300) {
                content = content.substring(0, 300);
            }
            return new ModerationItemDto(p.getId(), p.getTitle(), content);
        }).toList();

        // 3. AI 서버 일괄 요청
        List<ModerationResultDto> results = adminAiPort.moderatePostBatch(itemsToAudit);

        // 4. 비정상(false)인 게시글을 HIDDEN으로 업데이트 (delete 처리)
        int hiddenCount = 0;
        for (ModerationResultDto result : results) {
            if (!result.clean()) {
                adminPostPort.delete(result.postId());
                hiddenCount++;
            }
        }

        return hiddenCount;
    }
}
