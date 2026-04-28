package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminOrderItemPort;
import com.farmbalance.admin.domain.AdminOrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ADM-009 주문 항목 조회 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminOrderItemPersistenceAdapter implements AdminOrderItemPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminOrderItem> rowMapper = (rs, rowNum) -> AdminOrderItem.builder()
            .id(rs.getLong("id"))
            .orderId(rs.getLong("order_id"))
            .productId(rs.getLong("product_id"))
            .quantity(rs.getInt("quantity"))
            .unitPrice(rs.getBigDecimal("unit_price"))
            .subtotal(rs.getBigDecimal("subtotal"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminOrderItem> findByOrderId(Long orderId) {
        String sql = "SELECT * FROM order_items WHERE order_id = ? AND deleted_at IS NULL";
        return jdbcTemplate.query(sql, rowMapper, orderId);
    }
}
