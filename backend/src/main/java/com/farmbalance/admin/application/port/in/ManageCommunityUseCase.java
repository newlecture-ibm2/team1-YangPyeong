package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.domain.AdminPost;

import java.util.List;

/**
 * ADM-008 커뮤니티 관리 Input Port
 * 게시글 목록 조회, 삭제, 공지 설정
 */
public interface ManageCommunityUseCase {

    /**
     * 전체 게시글 목록 조회 (관리자용)
     */
    List<AdminPost> getAllPosts();

    /**
     * 게시글 삭제 (soft delete)
     */
    void deletePost(Long postId);

    /**
     * 게시글 공지 설정/해제
     */
    void toggleNotice(Long postId, boolean isNotice);
}
