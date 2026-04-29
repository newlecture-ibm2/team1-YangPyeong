/* ════════════════════════════════════════════════════════
   Shop 도메인 — 공통 API 함수
   클라이언트 컴포넌트에서 BFF Route Handler 호출
   ════════════════════════════════════════════════════════ */

import { apiFetch } from '@/lib/api-client';
import type { Product, ProductListParams, CartItem } from './shop.types';

/* ── 상품 ── */

/** 상품 목록 조회 */
export async function getProducts(params: ProductListParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  if (params.category) query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);
  if (params.keyword) query.set('keyword', params.keyword);

  const qs = query.toString();
  return apiFetch<Product[]>(`/api/shop/product${qs ? `?${qs}` : ''}`);
}

/** 상품 상세 조회 */
export async function getProduct(id: number) {
  return apiFetch<Product>(`/api/shop/product/${id}`);
}

/* ── 장바구니 ── */

/** 장바구니 조회 */
export async function getCart() {
  return apiFetch<CartItem[]>('/api/shop/cart');
}

/** 장바구니 담기 */
export async function addToCart(productId: number, quantity: number = 1) {
  return apiFetch<CartItem>('/api/shop/cart', {
    method: 'POST',
    body: { productId, quantity },
  });
}

/** 장바구니 수량 수정 */
export async function updateCartItem(cartItemId: number, quantity: number) {
  return apiFetch<CartItem>(`/api/shop/cart/${cartItemId}`, {
    method: 'PATCH',
    body: { quantity },
  });
}

/** 장바구니 항목 삭제 */
export async function removeCartItem(cartItemId: number) {
  return apiFetch<null>(`/api/shop/cart/${cartItemId}`, {
    method: 'DELETE',
  });
}
