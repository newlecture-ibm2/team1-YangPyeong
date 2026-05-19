'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SellerOrder, SellerOrderKpi, OrderStatus } from '../../_lib/mypage.types';
import { getSellerOrders, updateOrderStatus } from '@/app/(main)/shop/_lib/shop.api';
import { useToast } from '@/components/common/Toast/ToastContext';
import { CHAT_EVENTS, type ChatRefreshEventDetail } from '@/components/common/FarmBot/useChatActions';

/** 주문 상태 전환 규칙 */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  ORDERED: 'ACCEPTED',
  ACCEPTED: 'SHIPPED',
};

/** useSellerOrders — 판매 주문 관리 훅 */
export default function useSellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [detailOrder, setDetailOrder] = useState<SellerOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SellerOrder | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  // 판매자 주문 목록 로드
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const result = await getSellerOrders();
    if (result.success && result.data) {
      // Order → SellerOrder 변환
      const mapped: SellerOrder[] = result.data.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        buyerName: o.receiverName,
        buyerPhone: o.receiverPhone,
        shippingAddress: o.shippingAddress,
        shippingMemo: o.shippingMemo,
        productName: o.items.map((i) => `${i.productName} x${i.quantity}`).join(', '),
        productId: o.items[0]?.productId || 0,
        quantity: o.items.reduce((sum, i) => sum + i.quantity, 0),
        totalAmount: o.totalAmount,
        status: o.status as OrderStatus,
        orderedAt: o.createdAt,
        acceptedAt: o.updatedAt,
      }));
      setOrders(mapped);
    } else {
      setOrders([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 챗봇 REFRESH scope=seller_orders 이벤트 구독
  useEffect(() => {
    const handler = (e: Event) => {
      const { scope } = (e as CustomEvent<ChatRefreshEventDetail>).detail;
      if (scope === 'seller_orders') fetchOrders();
    };
    window.addEventListener(CHAT_EVENTS.refresh, handler);
    return () => window.removeEventListener(CHAT_EVENTS.refresh, handler);
  }, [fetchOrders]);

  /** 필터링된 주문 목록 */
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  /** KPI 계산 */
  const kpi: SellerOrderKpi = useMemo(() => ({
    newOrders: orders.filter((o) => o.status === 'ORDERED').length,
    preparing: orders.filter((o) => o.status === 'ACCEPTED').length,
    shipping: orders.filter((o) => o.status === 'SHIPPED' || o.status === 'COMPLETED').length,
    monthlySales: orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  }), [orders]);

  /** 주문 상태 다음 단계로 변경 */
  const advanceStatus = useCallback(async (orderId: number) => {
    // 현재 상태 확인
    const currentOrder = orders.find((o) => o.id === orderId);
    const action = currentOrder?.status === 'ACCEPTED' ? 'ship' : 'advance';

    // 즉시 UI 반영
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const next = NEXT_STATUS[o.status];
        return next ? { ...o, status: next } : o;
      })
    );
    // 백엔드 동기화
    try {
      await updateOrderStatus(orderId, action);
      toastSuccess(action === 'ship' ? '주문이 발송 처리되었습니다.' : '주문이 접수되었습니다.');
    } catch (e) {
      toastError('주문 상태 변경에 실패했습니다.');
    }
  }, [orders, toastSuccess, toastError]);

  /** 주문 거절(취소) */
  const handleCancelRequest = useCallback((order: SellerOrder) => {
    setCancelTarget(order);
  }, []);

  const confirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      // 백엔드 동기화
      await updateOrderStatus(cancelTarget.id, 'cancel');
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: 'CANCELLED' as OrderStatus } : o))
      );
      toastSuccess('주문이 취소되었습니다.');
    } catch (e) {
      toastError('주문 취소에 실패했습니다.');
    } finally {
      setCancelTarget(null);
    }
  }, [cancelTarget, toastSuccess, toastError]);

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
    loading,
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
