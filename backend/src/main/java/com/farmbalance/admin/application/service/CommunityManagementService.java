package com.farmbalance.admin.application.service;

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

    @Override
    public List<AdminPost> getAllPosts() {
        return adminPostPort.findAll();
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
}
