'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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

  // 챗봇 외부 트리거 — REFRESH(scope='cart') 이벤트로만 자동 재조회.
  //
  // ⚠️ 'cart-updated' 이벤트는 구독하지 않는다. removeItem/updateQuantity 등은 이미
  //    optimistic UI 로 즉시 반영되므로 자기 이벤트로 자기를 reload 하면 백엔드 DELETE 가
  //    끝나기 전에 GET 이 발생해 삭제된 item 이 되살아나는 race 가 생긴다.
  //    헤더 뱃지 동기화 용도로만 'cart-updated' 가 외부 리스너(useHeaderData)에서 사용된다.
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

  // 진행 중인 삭제 요청 추적 — 더블 클릭 등으로 같은 ID 가 중복 호출되는 것을 차단
  const pendingDeletesRef = useRef<Set<number>>(new Set());

  /** 아이템 삭제 */
  const removeItem = useCallback((cartItemId: number) => {
    if (pendingDeletesRef.current.has(cartItemId)) return; // 중복 호출 차단
    pendingDeletesRef.current.add(cartItemId);

    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(cartItemId);
      return next;
    });
    // 백엔드 동기화 후 헤더 뱃지 업데이트
    removeCartItem(cartItemId)
      .finally(() => {
        pendingDeletesRef.current.delete(cartItemId);
        window.dispatchEvent(new CustomEvent('cart-updated'));
      });
  }, []);

  /** 선택 아이템 일괄 삭제 */
  const removeSelected = useCallback(() => {
    const idsToRemove = Array.from(selectedIds).filter(
      (id) => !pendingDeletesRef.current.has(id),
    );
    if (idsToRemove.length === 0) return;
    idsToRemove.forEach((id) => pendingDeletesRef.current.add(id));

    setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());

    // 모든 삭제 완료 후 헤더 뱃지 1회 갱신
    Promise.allSettled(idsToRemove.map((id) => removeCartItem(id)))
      .finally(() => {
        idsToRemove.forEach((id) => pendingDeletesRef.current.delete(id));
        window.dispatchEvent(new CustomEvent('cart-updated'));
      });
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
