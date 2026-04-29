package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminPost;

import java.util.List;
import java.util.Optional;

/**
 * ADM-008 커뮤니티 게시글 관리용 Output Port
 */
public interface AdminPostPort {

    List<AdminPost> findAll();

    Optional<AdminPost> findById(Long id);

    void delete(Long id);

    void updateNotice(Long id, Boolean isNotice);
}
