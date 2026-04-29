package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminOrderItem;

import java.util.List;

/**
 * ADM-009 주문 항목 조회용 Output Port
 */
public interface AdminOrderItemPort {

    List<AdminOrderItem> findByOrderId(Long orderId);
}
