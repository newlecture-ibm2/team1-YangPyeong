package com.farmbalance.shop.application.service;

import com.farmbalance.global.email.EmailService;
import com.farmbalance.global.email.OrderEmailTemplate;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.in.OrderUseCase;
import com.farmbalance.shop.application.port.out.OrderRepository;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.Order;
import com.farmbalance.shop.domain.OrderItem;
import com.farmbalance.shop.domain.OrderStatus;
import com.farmbalance.shop.domain.Product;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
            UserRepository userRepository, EmailService emailService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
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
                    cmd.quantity(), product.getPrice()));
        }

        String orderNumber = generateOrderNumber();

        Order order = new Order(
                null, buyerId, orderNumber, totalAmount, OrderStatus.ORDERED,
                receiverName, receiverPhone, shippingAddress, shippingMemo,
                null, null, orderItems, LocalDateTime.now(), null);

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

        // 판매자 소유 주문인지 검증
        validateSellerOwnership(sellerId, orderId);

        OrderStatus previousStatus = order.getStatus();
        order.advanceStatus();
        Order saved = orderRepository.save(order);

        // 이메일 알림 발송 (비동기)
        sendStatusEmail(saved, previousStatus);

        return saved;
    }

    @Override
    @Transactional
    public Order shipOrder(Long sellerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // 판매자 소유 주문인지 검증
        validateSellerOwnership(sellerId, orderId);

        // 더미 송장번호 생성 (FARM-XXXXXXXX)
        String trackingNumber = "FARM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        OrderStatus previousStatus = order.getStatus();
        order.ship(trackingNumber);
        Order saved = orderRepository.save(order);

        // 배송 시작 이메일 알림
        sendStatusEmail(saved, previousStatus);

        return saved;
    }

    @Override
    @Transactional
    public Order cancelOrder(Long sellerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // 판매자 소유 주문인지 검증
        validateSellerOwnership(sellerId, orderId);

        // 재고 복구 + 판매수량 감소
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                product.increaseStock(item.getQuantity());
                product.decreaseSalesCount(item.getQuantity());
                productRepository.save(product);
            });
        }

        order.cancel();
        Order saved = orderRepository.save(order);

        // 주문 거절 이메일 발송 (비동기)
        sendCancelEmail(saved);

        return saved;
    }

    /** 해당 주문이 판매자의 상품을 포함하는지 검증 */
    private void validateSellerOwnership(Long sellerId, Long orderId) {
        boolean isOwner = orderRepository.findBySellerId(sellerId)
                .stream()
                .anyMatch(o -> o.getId().equals(orderId));
        if (!isOwner) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
    }

    /** 주문번호 생성: ORD-yyyyMMddHHmm-XXXX */
    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmm"));
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "ORD-" + timestamp + "-" + suffix;
    }

    /** 주문 상태 변경 시 구매자에게 이메일 발송 */
    private void sendStatusEmail(Order order, OrderStatus previousStatus) {
        try {
            User buyer = userRepository.findById(order.getBuyerId()).orElse(null);
            if (buyer == null || buyer.getEmail() == null || buyer.getEmail().isBlank())
                return;

            String buyerName = buyer.getName() != null ? buyer.getName() : "고객";

            // ORDERED → ACCEPTED (접수 확인)
            if (previousStatus == OrderStatus.ORDERED && order.getStatus() == OrderStatus.ACCEPTED) {
                String html = OrderEmailTemplate.orderAccepted(buyerName, order.getOrderNumber(),
                        order.getTotalAmount());
                emailService.send(buyer.getEmail(), "[FarmBalance] 주문이 접수되었습니다", html);
            }
            // ACCEPTED → SHIPPED (배송 시작)
            else if (previousStatus == OrderStatus.ACCEPTED && order.getStatus() == OrderStatus.SHIPPED) {
                String html = OrderEmailTemplate.orderShipped(buyerName, order.getOrderNumber());
                emailService.send(buyer.getEmail(), "[FarmBalance] 배송이 시작되었습니다", html);
            }
        } catch (Exception e) {
            log.warn("[주문 이메일] 발송 실패 (주문: {}): {}", order.getOrderNumber(), e.getMessage());
        }
    }

    /** 주문 거절 시 구매자에게 이메일 발송 */
    private void sendCancelEmail(Order order) {
        try {
            User buyer = userRepository.findById(order.getBuyerId()).orElse(null);
            if (buyer == null || buyer.getEmail() == null || buyer.getEmail().isBlank())
                return;

            String buyerName = buyer.getName() != null ? buyer.getName() : "고객";
            String html = OrderEmailTemplate.orderCancelled(buyerName, order.getOrderNumber(), order.getTotalAmount());
            emailService.send(buyer.getEmail(), "[FarmBalance] 주문이 거절되었습니다", html);
        } catch (Exception e) {
            log.warn("[주문 거절 이메일] 발송 실패 (주문: {}): {}", order.getOrderNumber(), e.getMessage());
        }
    }
}
