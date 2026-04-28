package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminProductPort;
import com.farmbalance.admin.domain.AdminProduct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-009 상점 상품 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminProductPersistenceAdapter implements AdminProductPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminProduct> rowMapper = (rs, rowNum) -> AdminProduct.builder()
            .id(rs.getLong("id"))
            .sellerId(rs.getLong("seller_id"))
            .categoryId(rs.getLong("category_id"))
            .name(rs.getString("name"))
            .price(rs.getBigDecimal("price"))
            .stock(rs.getInt("stock"))
            .description(rs.getString("description"))
            .imageUrl(rs.getString("image_url"))
            .status(rs.getString("status"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminProduct> findAll() {
        String sql = "SELECT * FROM products WHERE deleted_at IS NULL ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public Optional<AdminProduct> findById(Long id) {
        String sql = "SELECT * FROM products WHERE id = ? AND deleted_at IS NULL";
        List<AdminProduct> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }

    @Override
    public void updateStatus(Long id, String status) {
        String sql = "UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(sql, status, id);
    }
}
