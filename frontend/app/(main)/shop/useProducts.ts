'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Product, ProductSortType, ProductListParams } from './_lib/shop.types';
import { SORT_OPTIONS, CATEGORY_TABS } from './_lib/shop.types';

// TODO: 백엔드 연동 후 shop.api.ts의 getProducts()로 교체
// 현재는 더미 데이터로 UI를 먼저 구현
const DUMMY_PRODUCTS: Product[] = [
  {
    id: 1, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 1,
    categoryName: '채소류', name: '유기농 배추 1포기', price: 3500, stock: 50,
    description: '양평에서 재배한 신선한 유기농 배추입니다.',
    imageUrls: ['https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 45, createdAt: '2026-04-20T10:00:00Z',
  },
  {
    id: 2, sellerId: 2, sellerName: '양평 햇살 농장', categoryId: 1,
    categoryName: '채소류', name: '청양고추 500g', price: 4800, stock: 30,
    description: '매콤한 양평산 청양고추입니다.',
    imageUrls: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 32, createdAt: '2026-04-19T10:00:00Z',
  },
  {
    id: 3, sellerId: 3, sellerName: '양평 초록 농원', categoryId: 2,
    categoryName: '과일류', name: '방울토마토 1kg', price: 6200, stock: 20,
    description: '달콤한 방울토마토를 산지 직송합니다.',
    imageUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 78, createdAt: '2026-04-18T10:00:00Z',
  },
  {
    id: 4, sellerId: 4, sellerName: '양평 들녘 농장', categoryId: 3,
    categoryName: '곡물·잡곡', name: '햅쌀 5kg', price: 15000, stock: 100,
    description: '양평 들녘에서 수확한 햅쌀입니다.',
    imageUrls: ['https://images.unsplash.com/photo-1508313880080-c8bef1a3ed96?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 120, createdAt: '2026-04-17T10:00:00Z',
  },
  {
    id: 5, sellerId: 1, sellerName: '양평 해맑은 농장', categoryId: 2,
    categoryName: '과일류', name: '유기농 딸기 500g', price: 8900, stock: 15,
    description: '양평에서 유기농으로 재배한 딸기입니다.',
    imageUrls: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 95, createdAt: '2026-04-16T10:00:00Z',
  },
  {
    id: 6, sellerId: 5, sellerName: '양평 꿀 공방', categoryId: 4,
    categoryName: '가공식품', name: '천연 아카시아 꿀 500g', price: 22000, stock: 25,
    description: '양평 산골에서 채취한 천연 아카시아 꿀입니다.',
    imageUrls: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 18, createdAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 7, sellerId: 2, sellerName: '양평 햇살 농장', categoryId: 1,
    categoryName: '채소류', name: '유기농 상추 300g', price: 2800, stock: 40,
    description: '신선한 유기농 상추를 당일 수확합니다.',
    imageUrls: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 55, createdAt: '2026-04-14T10:00:00Z',
  },
  {
    id: 8, sellerId: 3, sellerName: '양평 초록 농원', categoryId: 2,
    categoryName: '과일류', name: '사과 3kg (부사)', price: 12000, stock: 60,
    description: '달콤하고 아삭한 양평산 부사 사과입니다.',
    imageUrls: ['https://images.unsplash.com/photo-1568702846914-96b305d2uj38?w=400&h=300&fit=crop'],
    status: 'ACTIVE', salesCount: 63, createdAt: '2026-04-13T10:00:00Z',
  },
];

/** 상품 목록 페이지 전용 훅 */
export function useProducts() {
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<ProductSortType>('bestSelling');
  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: 백엔드 연동 시 useEffect + getProducts() 호출로 교체
  const products = useMemo(() => {
    let filtered = [...DUMMY_PRODUCTS];

    // 카테고리 필터
    if (category) {
      filtered = filtered.filter((p) => p.categoryName === category);
    }

    // 키워드 검색
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sellerName.toLowerCase().includes(q),
      );
    }

    // 정렬
    switch (sort) {
      case 'priceLow':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceHigh':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'latest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'bestSelling':
      default:
        filtered.sort((a, b) => b.salesCount - a.salesCount);
        break;
    }

    return filtered;
  }, [category, sort, searchQuery]);

  /** 검색 실행 */
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return {
    // 상태
    products,
    category,
    sort,
    keyword,
    // 액션
    setCategory,
    setSort,
    setKeyword,
    handleSearch,
    // 상수
    sortOptions: SORT_OPTIONS,
    categoryTabs: CATEGORY_TABS,
  };
}
