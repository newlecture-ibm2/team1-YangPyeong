package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminOrderResponse;
import com.farmbalance.admin.application.port.in.dto.AdminOrderDto;
import com.farmbalance.admin.application.port.in.ManageOrderUseCase;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 주문 관리 Controller (관리자)
 */
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final ManageOrderUseCase manageOrderUseCase;

    /**
     * 전체 주문 목록 조회
     * GET /api/admin/orders
     */
    @GetMapping
    public ApiResponse<List<AdminOrderResponse>> getAllOrders() {
        List<AdminOrderDto> dtos = manageOrderUseCase.getAllOrders();
        List<AdminOrderResponse> responses = dtos.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    private AdminOrderResponse mapToResponse(AdminOrderDto dto) {
        List<AdminOrderResponse.AdminOrderItemResponse> items = dto.getItems().stream()
                .map(item -> AdminOrderResponse.AdminOrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return AdminOrderResponse.builder()
                .id(dto.getId())
                .buyerId(dto.getBuyerId())
                .orderNumber(dto.getOrderNumber())
                .totalAmount(dto.getTotalAmount())
                .status(dto.getStatus())
                .receiverName(dto.getReceiverName())
                .receiverPhone(dto.getReceiverPhone())
                .shippingAddress(dto.getShippingAddress())
                .shippingMemo(dto.getShippingMemo())
                .createdAt(dto.getCreatedAt())
                .items(items)
                .build();
    }

    /**
     * 주문 상태 변경
     * PATCH /api/admin/orders/{orderId}
     * Body: { "status": "SHIPPED" }
     */
    @PatchMapping("/{orderId}")
    public ApiResponse<Void> updateOrderStatus(@PathVariable Long orderId,
                                                @RequestBody Map<String, String> body) {
        String status = body.get("status");
        manageOrderUseCase.updateOrderStatus(orderId, status);
        return ApiResponse.ok(null);
    }
}
