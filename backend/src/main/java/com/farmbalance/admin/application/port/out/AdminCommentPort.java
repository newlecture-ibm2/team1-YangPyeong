package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminComment;

import java.util.List;

/**
 * ADM-008 커뮤니티 댓글 관리용 Output Port
 */
public interface AdminCommentPort {

    List<AdminComment> findByPostId(Long postId);

    java.util.Optional<AdminComment> findById(Long id);
    void hide(Long id, String reason);
    void bulkDelete(List<Long> ids);
    int deleteOldHidden(java.time.LocalDateTime threshold);
    void delete(Long id);

    void restore(Long id);
    List<AdminComment> findRecentActiveComments(int limit);
}
