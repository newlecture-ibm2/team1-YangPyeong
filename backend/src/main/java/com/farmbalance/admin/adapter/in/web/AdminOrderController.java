package com.farmbalance.admin.adapter.in.web;

import com.farmbalance.admin.adapter.in.web.dto.AdminOrderResponse;
import com.farmbalance.admin.application.port.in.ManageOrderUseCase;
import com.farmbalance.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        return ApiResponse.ok(manageOrderUseCase.getAllOrders());
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
