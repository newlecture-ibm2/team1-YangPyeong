package com.farmbalance.shop.adapter.out.persistence;

import com.farmbalance.shop.adapter.out.persistence.entity.OrderItemJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.entity.OrderJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.entity.ProductJpaEntity;
import com.farmbalance.shop.adapter.out.persistence.repository.OrderJpaRepository;
import com.farmbalance.shop.adapter.out.persistence.repository.ProductJpaRepository;
import com.farmbalance.shop.application.port.out.OrderRepository;
import com.farmbalance.shop.domain.Order;
import com.farmbalance.shop.domain.OrderItem;
import com.farmbalance.shop.domain.OrderStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 주문 영속성 어댑터 (Output Port 구현).
 */
@Component
public class OrderPersistenceAdapter implements OrderRepository {

    private final OrderJpaRepository orderJpaRepository;
    private final ProductJpaRepository productJpaRepository;

    public OrderPersistenceAdapter(OrderJpaRepository orderJpaRepository,
                                   ProductJpaRepository productJpaRepository) {
        this.orderJpaRepository = orderJpaRepository;
        this.productJpaRepository = productJpaRepository;
    }

    @Override
    public Order save(Order order) {
        OrderJpaEntity entity;
        if (order.getId() != null) {
            // 수정 (상태 변경)
            entity = orderJpaRepository.findById(order.getId()).orElseThrow();

            // 발송 처리인 경우 (trackingNumber가 새로 설정되었으면)
            if (order.getTrackingNumber() != null && entity.getTrackingNumber() == null) {
                entity.ship(order.getTrackingNumber());
            } else {
                entity.updateStatus(order.getStatus().name());
            }
        } else {
            // 신규 생성
            entity = OrderJpaEntity.builder()
                    .buyerId(order.getBuyerId())
                    .orderNumber(order.getOrderNumber())
                    .totalAmount(order.getTotalAmount())
                    .status(order.getStatus().name())
                    .receiverName(order.getReceiverName())
                    .receiverPhone(order.getReceiverPhone())
                    .shippingAddress(order.getShippingAddress())
                    .shippingMemo(order.getShippingMemo())
                    .build();

            // 주문 항목 추가
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    OrderItemJpaEntity itemEntity = OrderItemJpaEntity.builder()
                            .productId(item.getProductId())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .build();
                    entity.addItem(itemEntity);
                }
            }
        }

        OrderJpaEntity saved = orderJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Order> findById(Long id) {
        return orderJpaRepository.findByIdAndDeletedAtIsNull(id).map(this::toDomain);
    }

    @Override
    public List<Order> findAll() {
        return orderJpaRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByBuyerId(Long buyerId) {
        return orderJpaRepository.findByBuyerIdAndDeletedAtIsNullOrderByCreatedAtDesc(buyerId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findBySellerId(Long sellerId) {
        return orderJpaRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Order> findByTrackingNumber(String trackingNumber) {
        return orderJpaRepository.findByTrackingNumberAndDeletedAtIsNull(trackingNumber)
                .map(this::toDomain);
    }

    // ── 변환 ──

    private Order toDomain(OrderJpaEntity entity) {
        List<OrderItem> items = entity.getItems().stream()
                .map(this::toOrderItemDomain)
                .collect(Collectors.toList());

        return new Order(
                entity.getId(), entity.getBuyerId(), entity.getOrderNumber(),
                entity.getTotalAmount(), OrderStatus.valueOf(entity.getStatus()),
                entity.getReceiverName(), entity.getReceiverPhone(),
                entity.getShippingAddress(), entity.getShippingMemo(),
                entity.getTrackingNumber(), entity.getShippedAt(),
                items, entity.getCreatedAt(), entity.getUpdatedAt()
        );
    }

    private OrderItem toOrderItemDomain(OrderItemJpaEntity entity) {
        // 상품명 조회
        String productName = productJpaRepository.findById(entity.getProductId())
                .map(ProductJpaEntity::getName)
                .orElse("삭제된 상품");

        return new OrderItem(
                entity.getId(), entity.getOrder().getId(), entity.getProductId(),
                productName, entity.getQuantity(), entity.getUnitPrice()
        );
    }
}
