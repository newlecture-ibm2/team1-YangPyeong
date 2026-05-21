package com.farmbalance.community.application.service;

import com.farmbalance.community.application.port.in.CreatePostUseCase;
import com.farmbalance.community.application.port.in.DeletePostUseCase;
import com.farmbalance.community.application.port.in.LoadPostUseCase;
import com.farmbalance.community.application.port.in.ReportPostUseCase;
import com.farmbalance.community.application.port.in.UpdatePostUseCase;
import com.farmbalance.community.application.port.out.LoadPostCategoryPort;
import com.farmbalance.community.application.port.out.PostPort;
import com.farmbalance.community.domain.model.Post;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.global.report.domain.Report;
import com.farmbalance.global.report.port.ReportPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PostService implements CreatePostUseCase, LoadPostUseCase, UpdatePostUseCase, DeletePostUseCase, ReportPostUseCase {

    private final PostPort postPort;
    private final LoadPostCategoryPort loadPostCategoryPort;
    private final ReportPort reportPort;

    @Override
    public Post createPost(Long authorId, Long categoryId, String title, String content, boolean isNotice) {
        if (!loadPostCategoryPort.existsById(categoryId)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "존재하지 않는 카테고리입니다.");
        }

        Post post = Post.builder()
                .authorId(authorId)
                .categoryId(categoryId)
                .title(title)
                .content(content)
                .viewCount(0)
                .isNotice(isNotice)
                .createdAt(LocalDateTime.now())
                .build();

        return postPort.save(post);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Post> getPosts(List<Long> categoryIds, String keyword, String searchType, Pageable pageable) {
        return postPort.findByFilters(categoryIds, keyword, searchType, pageable);
    }

    @Override
    public Post getPostDetail(Long postId, Long requesterId, boolean isAdmin) {
        Post post = postPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (post.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        if (post.isHidden()) {
            if (!isAdmin && (requesterId == null || !post.getAuthorId().equals(requesterId))) {
                throw new BusinessException(ErrorCode.POST_NOT_FOUND); // 접근 불가
            }
        }

        post.increaseViewCount();
        return postPort.save(post);
    }

    @Override
    public Post updatePost(Long postId, Long requesterId, Long categoryId, String title, String content, boolean isNotice, boolean isAdmin) {
        Post post = postPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!isAdmin && !post.getAuthorId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.POST_NOT_AUTHOR);
        }

        if (categoryId != null && !loadPostCategoryPort.existsById(categoryId)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "존재하지 않는 카테고리입니다.");
        }

        post.update(categoryId, title, content, isNotice);
        return postPort.save(post);
    }

    @Override
    public void deletePost(Long postId, Long requesterId, boolean isAdmin) {
        Post post = postPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!isAdmin && !post.getAuthorId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.POST_NOT_AUTHOR);
        }

        post.delete();
        postPort.save(post);
    }

    @Override
    public void reportPost(Long postId, Long userId, String reason) {
        // 1. 게시글 존재 확인
        Post post = postPort.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        // 2. 자기 게시글 신고 차단
        if (post.getAuthorId().equals(userId)) {
            throw new BusinessException(ErrorCode.REPORT_OWN_CONTENT);
        }

        // 3. 중복 신고 차단
        if (reportPort.existsByTargetAndReporter("POST", postId, userId)) {
            throw new BusinessException(ErrorCode.REPORT_DUPLICATE);
        }

        // 4. 저장
        Report report = Report.builder()
                .targetType("POST")
                .targetId(postId)
                .reporterId(userId)
                .reason(reason)
                .status("PENDING")
                .build();
        reportPort.save(report);

        log.info("게시글 신고 접수 - postId: {}, userId: {}, reason: {}", postId, userId, reason);
    }
}

