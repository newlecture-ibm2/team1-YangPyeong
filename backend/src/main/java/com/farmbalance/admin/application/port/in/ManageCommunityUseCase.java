package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.adapter.in.web.dto.CreateNoticeRequest;
import com.farmbalance.admin.domain.AdminPost;

import java.util.List;

/**
 * ADM-008 커뮤니티 관리 Input Port
 * 게시글 목록 조회, 삭제, 공지 설정
 */
public interface ManageCommunityUseCase {

    /**
     * 전체 게시글 목록 조회 (관리자용 - 필터 및 페이징)
     */
    List<AdminPost> getPosts(String keyword, String status, int page, int size);

    /**
     * 전체 게시글 개수 조회 (필터)
     */
    long countPosts(String keyword, String status);

    /**
     * 특정 게시글 조회
     */
    AdminPost getPost(Long postId);

    /**
     * 특정 게시글의 댓글 목록 조회
     */
    List<com.farmbalance.admin.domain.AdminComment> getComments(Long postId);

    /**
     * 댓글 삭제 (soft delete)
     */
    void deleteComment(Long commentId);

    /**
     * 게시글 삭제 (soft delete)
     */
    void deletePost(Long postId);

    /**
     * 게시글 공지 설정/해제
     */
    void toggleNotice(Long postId, boolean isNotice);

    /**
     * 신규 공지사항 작성
     */
    void createNotice(Long adminId, CreateNoticeRequest request);
}
