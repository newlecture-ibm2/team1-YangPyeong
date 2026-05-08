'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SellerProduct, ProductStatus } from '../_lib/mypage.types';
import { getSellerProducts, deleteProduct } from '@/app/(main)/shop/_lib/shop.api';
import { useToast } from '@/components/common/Toast/ToastContext';

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

  const { success, error: showError } = useToast();

  /** 상품 상태 변경 */
  const handleStatusChange = useCallback(async (id: number, newStatus: ProductStatus) => {
    // 롤백을 위해 이전 상태 백업
    const originalProduct = products.find(p => p.id === id);
    if (!originalProduct) return;
    const oldStatus = originalProduct.status;

    // 1. Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    
    // 2. Call API
    import('@/app/(main)/shop/_lib/shop.api').then(async ({ changeProductStatus }) => {
      const res = await changeProductStatus(id, newStatus);
      if (!res.success) {
        // Rollback on failure
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: oldStatus } : p))
        );
        showError(`상태 변경에 실패했습니다: ${res.error?.message}`);
      } else {
        success('상품 상태가 성공적으로 변경되었습니다.');
      }
    });
  }, [products, success, showError]);

  /** 필터 탭 상태 */
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'SOLDOUT' | 'INACTIVE'>('ALL');

  /** 상태별 개수 통계 */
  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.status === 'ACTIVE').length,
      soldout: products.filter((p) => p.status === 'SOLDOUT').length,
      inactive: products.filter((p) => p.status === 'INACTIVE').length,
    };
  }, [products]);

  /** 필터링된 상품 목록 */
  const filteredProducts = useMemo(() => {
    if (filterTab === 'ALL') return products;
    return products.filter((p) => p.status === filterTab);
  }, [products, filterTab]);

  return {
    products: filteredProducts,
    allProducts: products, // 인사이트용으로 전체 배열 전달용
    stats,
    filterTab,
    setFilterTab,
    deleteTarget,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleStatusChange,
    loading,
  };
}
