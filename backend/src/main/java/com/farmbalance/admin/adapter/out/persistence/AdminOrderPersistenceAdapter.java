package com.farmbalance.admin.adapter.out.persistence;

import com.farmbalance.admin.application.port.out.AdminOrderPort;
import com.farmbalance.admin.domain.AdminOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * ADM-009 주문 관리 Persistence Adapter (JdbcTemplate)
 */
@Component
@RequiredArgsConstructor
public class AdminOrderPersistenceAdapter implements AdminOrderPort {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AdminOrder> rowMapper = (rs, rowNum) -> AdminOrder.builder()
            .id(rs.getLong("id"))
            .buyerId(rs.getLong("buyer_id"))
            .orderNumber(rs.getString("order_number"))
            .totalAmount(rs.getBigDecimal("total_amount"))
            .status(rs.getString("status"))
            .receiverName(rs.getString("receiver_name"))
            .receiverPhone(rs.getString("receiver_phone"))
            .shippingAddress(rs.getString("shipping_address"))
            .shippingMemo(rs.getString("shipping_memo"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .deletedAt(rs.getTimestamp("deleted_at") != null ? rs.getTimestamp("deleted_at").toLocalDateTime() : null)
            .build();

    @Override
    public List<AdminOrder> findAll() {
        String sql = "SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public Optional<AdminOrder> findById(Long id) {
        String sql = "SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL";
        List<AdminOrder> result = jdbcTemplate.query(sql, rowMapper, id);
        return result.stream().findFirst();
    }
}
