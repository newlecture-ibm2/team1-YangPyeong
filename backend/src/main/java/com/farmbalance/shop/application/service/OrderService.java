package com.farmbalance.shop.application.service;

import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.in.OrderUseCase;
import com.farmbalance.shop.application.port.out.OrderRepository;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.Order;
import com.farmbalance.shop.domain.OrderItem;
import com.farmbalance.shop.domain.OrderStatus;
import com.farmbalance.shop.domain.Product;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 주문 서비스 (UseCase 구현체).
 */
@Service
@Transactional(readOnly = true)
public class OrderService implements OrderUseCase {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public Order createOrder(Long buyerId, String receiverName, String receiverPhone,
                             String shippingAddress, String shippingMemo,
                             List<OrderItemCommand> items) {
        List<OrderItem> orderItems = new ArrayList<>();
        int totalAmount = 0;

        for (OrderItemCommand cmd : items) {
            Product product = productRepository.findById(cmd.productId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

            if (product.getStock() < cmd.quantity()) {
                throw new BusinessException(ErrorCode.PRODUCT_OUT_OF_STOCK);
            }

            // 재고 차감 + 판매 수량 증가
            product.decreaseStock(cmd.quantity());
            product.increaseSalesCount(cmd.quantity());
            productRepository.save(product);

            int subtotal = product.getPrice() * cmd.quantity();
            totalAmount += subtotal;

            orderItems.add(new OrderItem(
                    null, null, product.getId(), product.getName(),
                    cmd.quantity(), product.getPrice()
            ));
        }

        String orderNumber = generateOrderNumber();

        Order order = new Order(
                null, buyerId, orderNumber, totalAmount, OrderStatus.ORDERED,
                receiverName, receiverPhone, shippingAddress, shippingMemo,
                orderItems, LocalDateTime.now()
        );

        return orderRepository.save(order);
    }

    @Override
    public List<Order> getMyOrders(Long buyerId) {
        return orderRepository.findByBuyerId(buyerId);
    }

    @Override
    public List<Order> getSellerOrders(Long sellerId) {
        return orderRepository.findBySellerId(sellerId);
    }

    @Override
    @Transactional
    public Order advanceOrderStatus(Long sellerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        order.advanceStatus();
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order cancelOrder(Long sellerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        order.cancel();
        return orderRepository.save(order);
    }

    /** 주문번호 생성: ORD-yyyyMMddHHmm-XXXX */
    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "ORD-" + timestamp + "-" + suffix;
    }
}
