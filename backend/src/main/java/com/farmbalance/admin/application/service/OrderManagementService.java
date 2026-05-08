package com.farmbalance.admin.application.service;

import com.farmbalance.admin.adapter.in.web.dto.AdminOrderResponse;
import com.farmbalance.admin.application.port.in.ManageOrderUseCase;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.out.OrderRepository;
import com.farmbalance.shop.domain.Order;
import com.farmbalance.shop.domain.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderManagementService implements ManageOrderUseCase {

    private final OrderRepository orderRepository;

    @Override
    public List<AdminOrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(AdminOrderResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        order.changeStatus(OrderStatus.valueOf(status));
        orderRepository.save(order);
    }
}
