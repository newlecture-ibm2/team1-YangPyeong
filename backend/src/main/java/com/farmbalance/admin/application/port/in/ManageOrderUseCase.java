package com.farmbalance.admin.application.port.in;

import com.farmbalance.admin.application.port.in.dto.AdminOrderDto;
import java.util.List;

public interface ManageOrderUseCase {
    List<AdminOrderDto> getAllOrders();
    void updateOrderStatus(Long orderId, String status);
}
