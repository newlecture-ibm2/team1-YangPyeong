'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SellerOrder, SellerOrderKpi, OrderStatus } from '../../_lib/mypage.types';

/* ── 더미 데이터 (백엔드 연동 전) ── */
const DUMMY_ORDERS: SellerOrder[] = [
  {
    id: 1,
    orderNumber: 'ORD-2026042901',
    buyerName: '박농부',
    buyerPhone: '010-1111-2222',
    shippingAddress: '경기도 양평군 양서면 도곡리 123-4',
    shippingMemo: '부재 시 문 앞에 놓아주세요',
    productName: '유기농 상추 x2',
    productId: 1,
    quantity: 2,
    totalAmount: 16000,
    status: 'ORDERED',
    orderedAt: '2026-04-29',
  },
  {
    id: 2,
    orderNumber: 'ORD-2026042801',
    buyerName: '김양평',
    buyerPhone: '010-3333-4444',
    shippingAddress: '경기도 양평군 양평읍 양근리 56',
    shippingMemo: '전화 후 배송 부탁드립니다',
    productName: '무농약 배추 x3',
    productId: 2,
    quantity: 3,
    totalAmount: 15000,
    status: 'ORDERED',
    orderedAt: '2026-04-28',
  },
  {
    id: 3,
    orderNumber: 'ORD-2026042702',
    buyerName: '이소비',
    buyerPhone: '010-5555-6666',
    shippingAddress: '서울시 강남구 테헤란로 427',
    shippingMemo: '경비실에 맡겨주세요',
    productName: '우리밀 통밀가루 x1',
    productId: 4,
    quantity: 1,
    totalAmount: 6500,
    status: 'ACCEPTED',
    orderedAt: '2026-04-27',
  },
  {
    id: 4,
    orderNumber: 'ORD-2026042601',
    buyerName: '이소비',
    buyerPhone: '010-5555-6666',
    shippingAddress: '서울시 강남구 테헤란로 427',
    shippingMemo: '',
    productName: 'GAP 토마토 x1',
    productId: 3,
    quantity: 1,
    totalAmount: 12000,
    status: 'SHIPPED',
    orderedAt: '2026-04-26',
  },
  {
    id: 5,
    orderNumber: 'ORD-2026042501',
    buyerName: '최건강',
    buyerPhone: '010-7777-8888',
    shippingAddress: '경기도 양평군 옥천면 용천리 88',
    shippingMemo: '택배함에 넣어주세요',
    productName: '무농약 배추 x3',
    productId: 2,
    quantity: 3,
    totalAmount: 15000,
    status: 'COMPLETED',
    orderedAt: '2026-04-25',
  },
  {
    id: 6,
    orderNumber: 'ORD-2026042301',
    buyerName: '정원예',
    buyerPhone: '010-9999-0000',
    shippingAddress: '경기도 양평군 강하면 전수리 200',
    shippingMemo: '',
    productName: '양평 꿀 x1',
    productId: 5,
    quantity: 1,
    totalAmount: 18000,
    status: 'CANCELLED',
    orderedAt: '2026-04-23',
  },
];

/** 주문 상태 전환 규칙 */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  ORDERED: 'ACCEPTED',
  ACCEPTED: 'SHIPPED',
  SHIPPED: 'COMPLETED',
};

/** useSellerOrders — 판매 주문 관리 훅 */
export default function useSellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>(DUMMY_ORDERS);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [detailOrder, setDetailOrder] = useState<SellerOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SellerOrder | null>(null);

  /** 필터링된 주문 목록 */
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  /** KPI 계산 */
  const kpi: SellerOrderKpi = useMemo(() => ({
    newOrders: orders.filter((o) => o.status === 'ORDERED').length,
    preparing: orders.filter((o) => o.status === 'ACCEPTED').length,
    shipping: orders.filter((o) => o.status === 'SHIPPED').length,
    monthlySales: orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  }), [orders]);

  /** 주문 상태 다음 단계로 변경 */
  const advanceStatus = useCallback((orderId: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const next = NEXT_STATUS[o.status];
        return next ? { ...o, status: next } : o;
      })
    );
  }, []);

  /** 주문 거절(취소) */
  const handleCancelRequest = useCallback((order: SellerOrder) => {
    setCancelTarget(order);
  }, []);

  const confirmCancel = useCallback(() => {
    if (!cancelTarget) return;
    // TODO: API 호출 (PATCH /api/shop/seller/order/{id}/cancel)
    setOrders((prev) =>
      prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: 'CANCELLED' as OrderStatus } : o))
    );
    setCancelTarget(null);
  }, [cancelTarget]);

  const cancelCancelDialog = useCallback(() => {
    setCancelTarget(null);
  }, []);

  /** 주문 상세 모달 */
  const openDetail = useCallback((order: SellerOrder) => {
    setDetailOrder(order);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOrder(null);
  }, []);

  return {
    orders: filteredOrders,
    kpi,
    statusFilter,
    setStatusFilter,
    advanceStatus,
    detailOrder,
    openDetail,
    closeDetail,
    cancelTarget,
    handleCancelRequest,
    confirmCancel,
    cancelCancelDialog,
  };
}
