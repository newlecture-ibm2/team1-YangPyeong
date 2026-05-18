package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminCommentPort;
import com.farmbalance.admin.domain.AdminComment;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ADM-008 커뮤니티 댓글 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminCommentPersistenceAdapter implements AdminCommentPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminComment> rowMapper = (rs, rowNum) -> AdminComment.builder()
            .id(rs.getLong("id"))
            .postId(rs.getLong("post_id"))
            .authorId(rs.getLong("author_id"))
            .content(rs.getString("content"))
            .accepted(rs.getBoolean("accepted"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminComment> findByPostId(Long postId) {
        String sql = "SELECT * FROM comments WHERE post_id = ? AND deleted_at IS NULL ORDER BY created_at";
        return jdbcTemplate.query(sql, rowMapper, postId);
    }

    @Override
    public void delete(Long id) {
        String sql = "UPDATE comments SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public java.util.Optional<AdminComment> findById(Long id) {
        String sql = "SELECT * FROM comments WHERE id = ?";
        List<AdminComment> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(results.get(0));
    }
}
