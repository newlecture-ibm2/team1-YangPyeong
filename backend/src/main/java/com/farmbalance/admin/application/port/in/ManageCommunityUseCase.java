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
     * 게시글 복구 (restore soft delete)
     */
    void restorePost(Long postId);

    /**
     * 게시글 공지 설정/해제
     */
    void toggleNotice(Long postId, boolean isNotice);

    /**
     * 신규 공지사항 작성
     */
    void createNotice(Long adminId, CreateNoticeRequest request);

    /**
     * 신고 내역 조회 (페이징)
     */
    List<com.farmbalance.admin.domain.AdminGroupedReport> getReports(String status, int page, int size);

    /**
     * 신고 내역 개수 조회
     */
    long countReports(String status);

    /**
     * 특정 타겟(게시글/댓글)에 대한 신고 상태 일괄 변경
     */
    void updateReportStatusByTarget(String targetType, Long targetId, String status);

    /**
     * 특정 타겟(게시글/댓글) 제재 일괄 처리
     */
    void sanctionReportByTarget(String targetType, Long targetId, boolean deleteContent, boolean suspendUser);

    /**
     * 특정 타겟(게시글/댓글) 제재 일괄 취소 (Undo)
     */
    void undoSanctionByTarget(String targetType, Long targetId);

    /** AI를 활용해 최근 작성된 ACTIVE 게시글의 스팸 여부를 일괄 자동 검사 */
    int aiModerateActivePosts();
}
