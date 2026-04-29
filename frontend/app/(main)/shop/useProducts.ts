'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Product, ProductSortType } from './_lib/shop.types';
import { SORT_OPTIONS, CATEGORY_TABS } from './_lib/shop.types';
import { getProducts } from './_lib/shop.api';

const PAGE_SIZE = 8;

/** 상품 목록 페이지 전용 훅 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<ProductSortType>('bestSelling');
  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 백엔드 API 호출
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await getProducts({
        category: category || undefined,
        sort,
        keyword: searchQuery || undefined,
        page,
        size: PAGE_SIZE,
      });
      if (result.success && result.data) {
        setProducts(result.data);
        // meta에서 totalCount 추출
        if (result.meta?.total !== undefined) {
          setTotalCount(result.meta.total);
        }
      } else {
        setProducts([]);
        setTotalCount(0);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [category, sort, searchQuery, page]);

  /** 검색 실행 */
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0); // 검색 시 첫 페이지로
  }, []);

  /** 카테고리 변경 시 첫 페이지로 */
  const handleSetCategory = useCallback((cat: string) => {
    setCategory(cat);
    setPage(0);
  }, []);

  /** 정렬 변경 시 첫 페이지로 */
  const handleSetSort = useCallback((s: ProductSortType) => {
    setSort(s);
    setPage(0);
  }, []);

  return {
    // 상태
    products,
    loading,
    category,
    sort,
    keyword,
    // 페이지네이션
    page,
    totalPages,
    totalCount,
    setPage,
    // 액션
    setCategory: handleSetCategory,
    setSort: handleSetSort,
    setKeyword,
    handleSearch,
    // 상수
    sortOptions: SORT_OPTIONS,
    categoryTabs: CATEGORY_TABS,
  };
}
