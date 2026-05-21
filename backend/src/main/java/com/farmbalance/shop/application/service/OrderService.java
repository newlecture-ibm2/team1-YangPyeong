package com.farmbalance.shop.application.service;

import com.farmbalance.global.email.EmailService;
import com.farmbalance.global.email.OrderEmailTemplate;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import com.farmbalance.shop.application.port.in.OrderUseCase;
import com.farmbalance.shop.application.port.out.CartRepository;
import com.farmbalance.shop.application.port.out.OrderRepository;
import com.farmbalance.shop.application.port.out.ProductRepository;
import com.farmbalance.shop.domain.CartItem;
import com.farmbalance.shop.domain.Order;
import com.farmbalance.shop.domain.OrderItem;
import com.farmbalance.shop.domain.OrderStatus;
import com.farmbalance.shop.domain.Product;
import com.farmbalance.notification.application.port.in.NotificationUseCase;
import com.farmbalance.notification.domain.NotificationCategory;
import com.farmbalance.notification.domain.NotificationType;
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
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationUseCase notificationUseCase;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
            CartRepository cartRepository,
            UserRepository userRepository, EmailService emailService, NotificationUseCase notificationUseCase) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.notificationUseCase = notificationUseCase;
    }

    @Override
    @Transactional
    public Order createOrder(Long buyerId, String receiverName, String receiverPhone,
            String shippingAddress, String shippingMemo,
            List<OrderItemCommand> items) {
        List<OrderItem> orderItems = new ArrayList<>();
        int totalAmount = 0;
        List<Long> sellerIds = new ArrayList<>();

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
            
            if (!sellerIds.contains(product.getSellerId())) {
                sellerIds.add(product.getSellerId());
            }
        }

        String orderNumber = generateOrderNumber();

        Order order = new Order(
                null, buyerId, orderNumber, totalAmount, OrderStatus.ORDERED,
                receiverName, receiverPhone, shippingAddress, shippingMemo,
                null, null, orderItems, LocalDateTime.now(), null);

        Order savedOrder = orderRepository.save(order);

        // 주문된 상품의 장바구니 항목 자동 삭제
        for (OrderItemCommand cmd : items) {
            cartRepository.findByUserIdAndProductId(buyerId, cmd.productId())
                    .map(CartItem::getId)
                    .ifPresent(cartRepository::delete);
        }

        // O-1 새 주문 결제 완료 알림 (셀러 대상)
        for (Long sellerId : sellerIds) {
            notificationUseCase.createNotification(
                    sellerId,
                    NotificationType.ORDER,
                    NotificationCategory.ORDER,
                    "새 결제/주문 완료",
                    String.format("새 결제 및 주문이 확정되었습니다. 배송을 준비해주세요. (주문번호: %s)", savedOrder.getOrderNumber()),
                    "/mypage/seller/orders"
            );
        }

        // 구매자에게 결제/주문 확정 이메일 및 알림 자동 발송
        sendStatusEmail(savedOrder, OrderStatus.ORDERED);

        return savedOrder;
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

    @Override
    @Transactional
    public Order buyerCancelOrder(Long buyerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // 본인 주문인지 검증
        if (!order.getBuyerId().equals(buyerId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        // ORDERED 상태(판매자 미접수)일 때만 즉시 취소 허용
        if (order.getStatus() != OrderStatus.ORDERED) {
            throw new BusinessException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
        }

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

        // 취소 이메일 발송 (비동기)
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
                
                // O-2 주문 접수 확인 인앱 알림
                notificationUseCase.createNotification(
                        order.getBuyerId(),
                        NotificationType.ORDER,
                    NotificationCategory.ORDER,
                        "주문 접수 완료",
                        "주문하신 상품이 접수되었습니다.",
                        "/mypage/history"
                );
            }
            // ACCEPTED → SHIPPED (배송 시작)
            else if (previousStatus == OrderStatus.ACCEPTED && order.getStatus() == OrderStatus.SHIPPED) {
                String html = OrderEmailTemplate.orderShipped(buyerName, order.getOrderNumber());
                emailService.send(buyer.getEmail(), "[FarmBalance] 배송이 시작되었습니다", html);
                
                // O-3 배송 시작 인앱 알림
                notificationUseCase.createNotification(
                        order.getBuyerId(),
                        NotificationType.ORDER,
                    NotificationCategory.ORDER,
                        "배송 시작",
                        String.format("주문하신 상품이 배송 시작되었습니다. (송장: %s)", order.getTrackingNumber()),
                        "/mypage/history"
                );
            }
        } catch (Exception e) {
            log.warn("[주문 알림] 발송 실패 (주문: {}): {}", order.getOrderNumber(), e.getMessage());
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
            
            // O-4 주문 거절 인앱 알림
            notificationUseCase.createNotification(
                    order.getBuyerId(),
                    NotificationType.ORDER,
                    NotificationCategory.ORDER,
                    "주문 거절",
                    String.format("주문이 거절되었습니다. (주문번호: %s)", order.getOrderNumber()),
                    "/mypage/history"
            );
        } catch (Exception e) {
            log.warn("[주문 거절 알림] 발송 실패 (주문: {}): {}", order.getOrderNumber(), e.getMessage());
        }
    }
}
