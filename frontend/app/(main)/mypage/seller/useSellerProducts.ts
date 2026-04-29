'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SellerProduct, ProductStatus } from '../_lib/mypage.types';

/* ── 더미 데이터 (백엔드 연동 전) ── */
const DUMMY_PRODUCTS: SellerProduct[] = [
  {
    id: 1,
    name: '유기농 상추 (500g)',
    price: 8000,
    stock: 45,
    salesCount: 128,
    status: 'ACTIVE',
    imageUrls: ['/images/placeholder-product.jpg'],
    categoryName: '채소류',
    description: '양평에서 자란 신선한 유기농 상추입니다.',
    createdAt: '2026-04-10',
  },
  {
    id: 2,
    name: '무농약 배추 (1포기)',
    price: 5000,
    stock: 20,
    salesCount: 87,
    status: 'ACTIVE',
    imageUrls: ['/images/placeholder-product.jpg'],
    categoryName: '채소류',
    description: '겨울철 최고의 무농약 배추입니다.',
    createdAt: '2026-04-15',
  },
  {
    id: 3,
    name: 'GAP 토마토 (1kg)',
    price: 12000,
    stock: 0,
    salesCount: 65,
    status: 'SOLDOUT',
    imageUrls: ['/images/placeholder-product.jpg'],
    categoryName: '과일류',
    description: 'GAP 인증 받은 양평 토마토.',
    createdAt: '2026-04-20',
  },
  {
    id: 4,
    name: '우리밀 통밀가루 (1kg)',
    price: 6500,
    stock: 100,
    salesCount: 42,
    status: 'ACTIVE',
    imageUrls: ['/images/placeholder-product.jpg'],
    categoryName: '곡물·잡곡',
    description: '양평산 우리밀로 만든 통밀가루입니다.',
    createdAt: '2026-04-22',
  },
  {
    id: 5,
    name: '양평 꿀 (500ml)',
    price: 18000,
    stock: 8,
    salesCount: 31,
    status: 'INACTIVE',
    imageUrls: ['/images/placeholder-product.jpg'],
    categoryName: '가공식품',
    description: '양평 양봉 농가에서 채취한 천연 꿀.',
    createdAt: '2026-03-28',
  },
];

/** useSellerProducts — 판매 상품 목록 관리 훅 */
export default function useSellerProducts() {
  const [products, setProducts] = useState<SellerProduct[]>(DUMMY_PRODUCTS);
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null);

  /** 상품 삭제 (판매 중단) */
  const handleDelete = useCallback((product: SellerProduct) => {
    setDeleteTarget(product);
  }, []);

  /** 삭제 확인 */
  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    // TODO: API 호출 (DELETE /api/shop/seller/{id})
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  /** 삭제 모달 닫기 */
  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /** 상품 상태 변경 */
  const toggleStatus = useCallback((productId: number, newStatus: ProductStatus) => {
    // TODO: API 호출 (PATCH /api/shop/seller/{id}/status)
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
    );
  }, []);

  /** 통계 */
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.status === 'ACTIVE').length,
    soldout: products.filter((p) => p.status === 'SOLDOUT').length,
    inactive: products.filter((p) => p.status === 'INACTIVE').length,
  }), [products]);

  return {
    products,
    stats,
    deleteTarget,
    handleDelete,
    confirmDelete,
    cancelDelete,
    toggleStatus,
  };
}
