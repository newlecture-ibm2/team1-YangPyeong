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
            .postTitle(rs.getString("post_title"))
            .authorId(rs.getLong("author_id"))
            .authorNickname(rs.getString("author_nickname"))
            .authorEmail(rs.getString("author_email"))
            .content(rs.getString("content"))
            .accepted(rs.getBoolean("accepted"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .isHidden(rs.getBoolean("is_hidden"))
            .statusReason(rs.getString("status_reason"))
            .build();

    @Override
    public List<AdminComment> findByPostId(Long postId) {
        String sql = "SELECT c.*, p.title as post_title, u.nickname as author_nickname, u.email as author_email FROM comments c LEFT JOIN posts p ON c.post_id = p.id LEFT JOIN users u ON c.author_id = u.id WHERE c.post_id = ? AND c.deleted_at IS NULL ORDER BY c.created_at";
        return jdbcTemplate.query(sql, rowMapper, postId);
    }

    @Override
    public void delete(Long id) {
        String sql = "UPDATE comments SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public void hide(Long id, String reason) {
        String sql = "UPDATE comments SET is_hidden = true, status_reason = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, reason, id);
    }

    @Override
    public void bulkDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        String inSql = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        String sql = String.format("UPDATE comments SET deleted_at = NOW(), updated_at = NOW() WHERE is_hidden = true AND id IN (%s)", inSql);
        jdbcTemplate.update(sql, ids.toArray());
    }

    @Override
    public int deleteOldHidden(java.time.LocalDateTime threshold) {
        String sql = "UPDATE comments SET deleted_at = NOW(), updated_at = NOW() WHERE is_hidden = true AND deleted_at IS NULL AND updated_at < ?";
        return jdbcTemplate.update(sql, threshold);
    }

    @Override
    public void restore(Long id) {
        String sql = "UPDATE comments SET deleted_at = NULL, is_hidden = false, status_reason = NULL, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public java.util.Optional<AdminComment> findById(Long id) {
        String sql = "SELECT c.*, p.title as post_title, u.nickname as author_nickname, u.email as author_email FROM comments c LEFT JOIN posts p ON c.post_id = p.id LEFT JOIN users u ON c.author_id = u.id WHERE c.id = ?";
        List<AdminComment> results = jdbcTemplate.query(sql, rowMapper, id);
        return results.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(results.get(0));
    }

    @Override
    public List<AdminComment> findRecentActiveComments(int limit) {
        String sql = "SELECT c.*, p.title as post_title, u.nickname as author_nickname, u.email as author_email FROM comments c LEFT JOIN posts p ON c.post_id = p.id LEFT JOIN users u ON c.author_id = u.id WHERE c.deleted_at IS NULL AND c.is_hidden = false ORDER BY c.created_at DESC LIMIT ?";
        return jdbcTemplate.query(sql, rowMapper, limit);
    }

    @Override
    public List<AdminComment> findByFilter(String keyword, String status, int offset, int limit) {
        StringBuilder sql = new StringBuilder("SELECT c.*, p.title as post_title, u.nickname as author_nickname, u.email as author_email FROM comments c LEFT JOIN posts p ON c.post_id = p.id LEFT JOIN users u ON c.author_id = u.id WHERE c.deleted_at IS NULL");
        java.util.List<Object> params = new java.util.ArrayList<>();

        if (status != null && !status.isEmpty() && !status.equals("ALL")) {
            if (status.equals("ACTIVE")) {
                sql.append(" AND c.is_hidden = false");
            } else if (status.equals("HIDDEN")) {
                sql.append(" AND c.is_hidden = true");
            }
        }

        if (keyword != null && !keyword.isEmpty()) {
            sql.append(" AND c.content LIKE ?");
            params.add("%" + keyword + "%");
        }

        sql.append(" ORDER BY c.created_at DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbcTemplate.query(sql.toString(), params.toArray(), rowMapper);
    }

    @Override
    public long countByFilter(String keyword, String status) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL");
        java.util.List<Object> params = new java.util.ArrayList<>();

        if (status != null && !status.isEmpty() && !status.equals("ALL")) {
            if (status.equals("ACTIVE")) {
                sql.append(" AND is_hidden = false");
            } else if (status.equals("HIDDEN")) {
                sql.append(" AND is_hidden = true");
            }
        }

        if (keyword != null && !keyword.isEmpty()) {
            sql.append(" AND content LIKE ?");
            params.add("%" + keyword + "%");
        }

        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }
}
