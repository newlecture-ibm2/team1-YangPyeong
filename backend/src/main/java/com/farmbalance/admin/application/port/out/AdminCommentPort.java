package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminComment;

import java.util.List;

/**
 * ADM-008 커뮤니티 댓글 관리용 Output Port
 */
public interface AdminCommentPort {

    List<AdminComment> findByPostId(Long postId);

    void delete(Long id);
}
