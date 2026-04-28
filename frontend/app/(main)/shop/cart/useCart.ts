'use client';

import { useState, useCallback, useMemo } from 'react';
import type { CartItem, Product } from '../_lib/shop.types';

/* ════════════════════════════════════════════
   더미 데이터 — 백엔드 연동 후 제거
   ════════════════════════════════════════════ */
const DUMMY_CART_ITEMS: CartItem[] = [
  {
    id: 1,
    userId: 1,
    productId: 1,
    quantity: 2,
    product: {
      id: 1, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 1,
      categoryName: '채소류', name: '유기농 배추 1포기', price: 3500, stock: 50,
      description: '', imageUrls: [
        'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=200&h=200&fit=crop',
      ],
      status: 'ACTIVE', salesCount: 45, createdAt: '2026-04-20T10:00:00Z',
    },
  },
  {
    id: 2,
    userId: 1,
    productId: 2,
    quantity: 1,
    product: {
      id: 2, sellerId: 2, sellerName: '양평 햇살 농장', categoryId: 1,
      categoryName: '채소류', name: '청양고추 500g', price: 4800, stock: 30,
      description: '', imageUrls: [
        'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=200&h=200&fit=crop',
      ],
      status: 'ACTIVE', salesCount: 32, createdAt: '2026-04-21T10:00:00Z',
    },
  },
  {
    id: 3,
    userId: 1,
    productId: 3,
    quantity: 3,
    product: {
      id: 3, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 1,
      categoryName: '채소류', name: '유기농 상추 300g', price: 2800, stock: 40,
      description: '', imageUrls: [
        'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=200&h=200&fit=crop',
      ],
      status: 'ACTIVE', salesCount: 55, createdAt: '2026-04-18T10:00:00Z',
    },
  },
  {
    id: 4,
    userId: 1,
    productId: 5,
    quantity: 1,
    product: {
      id: 5, sellerId: 3, sellerName: '양평 두물머리 농원', categoryId: 2,
      categoryName: '과일류', name: '한봉 꿀 500g', price: 18000, stock: 15,
      description: '', imageUrls: [
        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop',
      ],
      status: 'ACTIVE', salesCount: 28, createdAt: '2026-04-15T10:00:00Z',
    },
  },
];

/* ════════════════════════════════════════════
   useCart Hook
   ════════════════════════════════════════════ */

export interface UseCartReturn {
  /** 장바구니 아이템 목록 */
  items: CartItem[];
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
  // TODO: 백엔드 연동 시 API 호출로 교체
  const [items, setItems] = useState<CartItem[]>(DUMMY_CART_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(DUMMY_CART_ITEMS.map((item) => item.id))
  );

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
    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
    );
    // TODO: updateCartItem API 호출
  }, []);

  /** 아이템 삭제 */
  const removeItem = useCallback((cartItemId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(cartItemId);
      return next;
    });
    // TODO: removeCartItem API 호출
  }, []);

  /** 선택 아이템 일괄 삭제 */
  const removeSelected = useCallback(() => {
    setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
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
