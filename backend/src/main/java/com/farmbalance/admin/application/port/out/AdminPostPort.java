package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminPost;

import java.util.List;
import java.util.Optional;

/**
 * ADM-008 커뮤니티 게시글 관리용 Output Port
 */
public interface AdminPostPort {

    List<AdminPost> findAll();

    List<AdminPost> findByFilter(String keyword, String status, int offset, int limit);

    long countByFilter(String keyword, String status);

    Optional<AdminPost> findById(Long id);

    void delete(Long id);
    void restore(Long id);

    void updateNotice(Long id, Boolean isNotice);

    void save(AdminPost post);
}
