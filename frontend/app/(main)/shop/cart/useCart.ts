'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CartItem } from '../_lib/shop.types';
import { getCart, updateCartItem, removeCartItem } from '../_lib/shop.api';
import { CHAT_EVENTS, type ChatRefreshEventDetail } from '@/components/common/FarmBot/useChatActions';

/* ════════════════════════════════════════════
   useCart Hook
   ════════════════════════════════════════════ */

export interface UseCartReturn {
  /** 장바구니 아이템 목록 */
  items: CartItem[];
  /** 로딩 상태 */
  loading: boolean;
  /** 선택된 아이템 ID 집합 */
  selectedIds: Set<number>;
  /** 전체 선택 여부 */
  isAllSelected: boolean;
  /** 선택된 아이템 수 */
  selectedCount: number;
  /** 선택된 아이템 합계 금액 */
  selectedTotalPrice: number;
  /** 전체 아이템 합계 금액 */
  totalPrice: number;
  /** 아이템 수량 변경 */
  updateQuantity: (cartItemId: number, quantity: number) => void;
  /** 아이템 삭제 */
  removeItem: (cartItemId: number) => void;
  /** 선택된 아이템 일괄 삭제 */
  removeSelected: () => void;
  /** 아이템 선택/해제 토글 */
  toggleSelect: (cartItemId: number) => void;
  /** 전체 선택/해제 토글 */
  toggleSelectAll: () => void;
  /** 장바구니가 비어있는지 */
  isEmpty: boolean;
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 장바구니 데이터 로드 (재조회 가능하도록 별도 콜백)
  const fetchCart = useCallback(async () => {
    setLoading(true);
    const result = await getCart();
    const data = result.success ? result.data : null;
    if (data) {
      setItems(data);
      setSelectedIds((prev) =>
        prev.size === 0 ? new Set(data.map((item) => item.id)) : prev,
      );
    } else {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 챗봇이 add_to_cart 등을 실행한 후 REFRESH(scope='cart') 이벤트로 자동 재조회
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ChatRefreshEventDetail>).detail;
      if (detail?.scope === 'cart') {
        fetchCart();
      }
    };
    window.addEventListener(CHAT_EVENTS.refresh, handler);
    return () => window.removeEventListener(CHAT_EVENTS.refresh, handler);
  }, [fetchCart]);

  /** 전체 선택 여부 */
  const isAllSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  /** 선택된 아이템 수 */
  const selectedCount = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)).length,
    [items, selectedIds]
  );

  /** 전체 합계 */
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  /** 선택된 아이템 합계 */
  const selectedTotalPrice = useMemo(
    () =>
      items
        .filter((item) => selectedIds.has(item.id))
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items, selectedIds]
  );

  /** 수량 변경 */
  const updateQuantity = useCallback((cartItemId: number, quantity: number) => {
    if (quantity < 1) return;
    // 즉시 UI 반영
    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
    );
    // 백엔드 동기화
    updateCartItem(cartItemId, quantity);
  }, []);

  /** 아이템 삭제 */
  const removeItem = useCallback((cartItemId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(cartItemId);
      return next;
    });
    // 백엔드 동기화
    removeCartItem(cartItemId);
    // 헤더 장바구니 맱지 업데이트
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }, []);

  /** 선택 아이템 일괄 삭제 */
  const removeSelected = useCallback(() => {
    const idsToRemove = Array.from(selectedIds);
    setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    // 백엔드 동기화
    idsToRemove.forEach((id) => removeCartItem(id));
    // 헤더 장바구니 맱지 업데이트
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }, [selectedIds]);

  /** 선택 토글 */
  const toggleSelect = useCallback((cartItemId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cartItemId)) {
        next.delete(cartItemId);
      } else {
        next.add(cartItemId);
      }
      return next;
    });
  }, []);

  /** 전체 선택/해제 */
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [isAllSelected, items]);

  return {
    items,
    loading,
    selectedIds,
    isAllSelected,
    selectedCount,
    selectedTotalPrice,
    totalPrice,
    updateQuantity,
    removeItem,
    removeSelected,
    toggleSelect,
    toggleSelectAll,
    isEmpty: items.length === 0,
  };
}
