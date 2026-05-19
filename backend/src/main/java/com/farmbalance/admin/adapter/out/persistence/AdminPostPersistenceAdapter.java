package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminPostPort;
import com.farmbalance.admin.domain.AdminPost;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-008 커뮤니티 게시글 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminPostPersistenceAdapter implements AdminPostPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminPost> rowMapper = (rs, rowNum) -> AdminPost.builder()
            .id(rs.getLong("id"))
            .authorId(rs.getLong("author_id"))
            .categoryId(rs.getLong("category_id"))
            .title(rs.getString("title"))
            .content(rs.getString("content"))
            .viewCount(rs.getInt("view_count"))
            .isNotice(rs.getBoolean("is_notice"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .isHidden(rs.getBoolean("is_hidden"))
            .statusReason(rs.getString("status_reason"))
            .build();

    @Override
    public List<AdminPost> findAll() {
        String sql = "SELECT * FROM posts ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public List<AdminPost> findByFilter(String keyword, String status, int offset, int limit) {
        StringBuilder sql = new StringBuilder("SELECT * FROM posts WHERE 1=1 ");
        if (keyword != null && !keyword.isBlank()) {
            sql.append("AND title LIKE '%").append(keyword).append("%' ");
        }
        if ("ACTIVE".equalsIgnoreCase(status)) {
            sql.append("AND deleted_at IS NULL AND is_hidden = false ");
        } else if ("HIDDEN".equalsIgnoreCase(status)) {
            sql.append("AND is_hidden = true ");
        } else if ("DELETED".equalsIgnoreCase(status)) {
            sql.append("AND deleted_at IS NOT NULL ");
        }
        sql.append("ORDER BY created_at DESC LIMIT ? OFFSET ?");
        return jdbcTemplate.query(sql.toString(), rowMapper, limit, offset);
    }

    @Override
    public long countByFilter(String keyword, String status) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM posts WHERE 1=1 ");
        if (keyword != null && !keyword.isBlank()) {
            sql.append("AND title LIKE '%").append(keyword).append("%' ");
        }
        if ("ACTIVE".equalsIgnoreCase(status)) {
            sql.append("AND deleted_at IS NULL AND is_hidden = false ");
        } else if ("HIDDEN".equalsIgnoreCase(status)) {
            sql.append("AND is_hidden = true ");
        } else if ("DELETED".equalsIgnoreCase(status)) {
            sql.append("AND deleted_at IS NOT NULL ");
        }
        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public Optional<AdminPost> findById(Long id) {
        String sql = "SELECT * FROM posts WHERE id = ?";
        List<AdminPost> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public void hide(Long id, String reason) {
        String sql = "UPDATE posts SET is_hidden = true, status_reason = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, reason, id);
    }

    @Override
    public void bulkDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        String inSql = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        String sql = String.format("UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE is_hidden = true AND id IN (%s)", inSql);
        jdbcTemplate.update(sql, ids.toArray());
    }

    @Override
    public int deleteOldHidden(java.time.LocalDateTime threshold) {
        String sql = "UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE is_hidden = true AND deleted_at IS NULL AND updated_at < ?";
        return jdbcTemplate.update(sql, threshold);
    }

    @Override
    public void delete(Long id) {
        String sql = "UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public void restore(Long id) {
        String sql = "UPDATE posts SET deleted_at = NULL, is_hidden = false, status_reason = NULL, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public void updateNotice(Long id, Boolean isNotice) {
        String sql = "UPDATE posts SET is_notice = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, isNotice, id);
    }

    @Override
    public void save(AdminPost post) {
        String sql = "INSERT INTO posts (author_id, category_id, title, content, is_notice, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, NOW(), NOW())";
        jdbcTemplate.update(sql, post.getAuthorId(), post.getCategoryId(), post.getTitle(), post.getContent(), post.getIsNotice());
    }
}
