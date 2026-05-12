package com.farmbalance.admin.application.service;

import com.farmbalance.admin.adapter.in.web.dto.CreateNoticeRequest;
import com.farmbalance.admin.application.port.in.ManageCommunityUseCase;
import com.farmbalance.admin.application.port.out.AdminPostPort;
import com.farmbalance.admin.domain.AdminPost;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
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
}
