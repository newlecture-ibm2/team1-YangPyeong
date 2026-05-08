package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.adapter.in.web.dto.AdminOrderResponse;
import java.util.List;

public interface ManageOrderUseCase {
    List<AdminOrderResponse> getAllOrders();
    void updateOrderStatus(Long orderId, String status);
}
