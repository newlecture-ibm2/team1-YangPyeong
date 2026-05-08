'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { BuyerOrder, OrderStatus } from '../_lib/mypage.types';
import { getMyOrders } from '@/app/(main)/shop/_lib/shop.api';

/** useOrderHistory — 구매자 주문내역 관리 훅 */
export default function useOrderHistory() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [detailOrder, setDetailOrder] = useState<BuyerOrder | null>(null);

  // 구매자 주문 목록 로드
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyOrders();
      if (result.success && result.data) {
        // Order → BuyerOrder 변환
        const mapped: BuyerOrder[] = result.data.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          productSummary: o.items.map((i) => `${i.productName} x${i.quantity}`).join(', '),
          items: o.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
          })),
          totalAmount: o.totalAmount,
          status: o.status as OrderStatus,
          receiverName: o.receiverName,
          receiverPhone: o.receiverPhone,
          shippingAddress: o.shippingAddress,
          shippingMemo: o.shippingMemo,
          trackingNumber: o.trackingNumber,
          shippedAt: o.shippedAt,
          orderedAt: o.createdAt,
        }));
        setOrders(mapped);
      } else {
        setOrders([]);
        setError('주문내역을 불러오지 못했습니다.');
      }
    } catch {
      setOrders([]);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /** 필터링된 주문 목록 */
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  /** 요약 통계 */
  const stats = useMemo(() => ({
    total: orders.length,
    ordered: orders.filter((o) => o.status === 'ORDERED').length,
    shipping: orders.filter((o) => o.status === 'SHIPPED').length,
    totalSpent: orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  }), [orders]);

  /** 주문 상세 모달 */
  const openDetail = useCallback((order: BuyerOrder) => {
    setDetailOrder(order);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOrder(null);
  }, []);

  return {
    orders: filteredOrders,
    loading,
    error,
    stats,
    statusFilter,
    setStatusFilter,
    detailOrder,
    openDetail,
    closeDetail,
    retry: fetchOrders,
  };
}
