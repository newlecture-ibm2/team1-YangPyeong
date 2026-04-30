'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SellerProduct, ProductStatus } from '../_lib/mypage.types';
import { getSellerProducts, deleteProduct } from '@/app/(main)/shop/_lib/shop.api';

/** useSellerProducts — 판매 상품 목록 관리 훅 */
export default function useSellerProducts() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null);

  // 판매자 상품 목록 로드
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await getSellerProducts();
      if (result.success && result.data) {
        // Product → SellerProduct 변환
        const mapped: SellerProduct[] = result.data.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          salesCount: p.salesCount,
          status: p.stock === 0 ? 'SOLDOUT' : p.status as ProductStatus,
          imageUrls: p.imageUrls,
          categoryName: p.categoryName,
          description: p.description,
          createdAt: p.createdAt,
        }));
        setProducts(mapped);
      } else {
        setProducts([]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  /** 상품 삭제 (판매 중단) */
  const handleDelete = useCallback((product: SellerProduct) => {
    setDeleteTarget(product);
  }, []);

  /** 삭제 확인 */
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  /** 삭제 모달 닫기 */
  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /** 상품 상태 변경 */
  const toggleStatus = useCallback((productId: number, newStatus: ProductStatus) => {
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
    loading,
    stats,
    deleteTarget,
    handleDelete,
    confirmDelete,
    cancelDelete,
    toggleStatus,
  };
}
