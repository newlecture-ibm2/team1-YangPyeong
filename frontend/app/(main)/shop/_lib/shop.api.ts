/* ════════════════════════════════════════════════════════
   Shop 도메인 — 공통 API 함수
   클라이언트 컴포넌트에서 BFF Route Handler 호출
   ════════════════════════════════════════════════════════ */

import { apiFetch } from '@/lib/api-fetch';
import type { Product, ProductCategory, ProductListParams, CartItem, Order } from './shop.types';

/* ── 카테고리 ── */

/** 활성 카테고리 목록 조회 */
export async function getCategories() {
  return apiFetch<ProductCategory[]>('/api/shop/category');
}

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

/* ── 주문 ── */

/** 주문 생성 */
export async function createOrder(data: {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingMemo: string;
  items: { productId: number; quantity: number }[];
}) {
  return apiFetch<Order>('/api/shop/order', {
    method: 'POST',
    body: data,
  });
}

/** 내 주문 내역 조회 */
export async function getMyOrders() {
  return apiFetch<Order[]>('/api/shop/order');
}

/** 구매자 주문 취소 (ORDERED 상태만 허용) */
export async function cancelMyOrder(orderId: number) {
  return apiFetch<Order>(`/api/shop/order/${orderId}/cancel`, {
    method: 'PATCH',
  });
}

/** 배송 조회 (더미 택배사) */
export async function trackOrder(trackingNumber: string) {
  return apiFetch<{ time: string; location: string; description: string; current: boolean }[]>(
    `/api/shop/courier/track?trackingNumber=${trackingNumber}`
  );
}

/* ── 판매자 ── */

/** 판매자 상품 목록 */
export async function getSellerProducts() {
  return apiFetch<Product[]>('/api/shop/seller');
}

/** 판매자 상품 등록 */
export async function registerProduct(data: {
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryName: string;
  imageUrls: string[];
}) {
  return apiFetch<Product>('/api/shop/seller', {
    method: 'POST',
    body: data,
  });
}

/** 판매자 상품 수정 */
export async function updateProduct(id: number, data: {
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryName: string;
  imageUrls: string[];
}) {
  return apiFetch<Product>(`/api/shop/seller/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

/** 판매자 상품 삭제 */
export async function deleteProduct(id: number) {
  return apiFetch<void>(`/api/shop/seller/${id}`, {
    method: 'DELETE',
  });
}

/** 판매자 상품 상태 단건 변경 (판매중/품절/숨김) */
export async function changeProductStatus(id: number, status: string) {
  return apiFetch<Product>(`/api/shop/seller/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

/* ── 주문 ── */

/** 판매자 주문 목록 */
export async function getSellerOrders() {
  return apiFetch<Order[]>('/api/shop/seller/order');
}

/** 판매자 주문 상태 변경 */
export async function updateOrderStatus(orderId: number, action: 'advance' | 'cancel' | 'ship') {
  return apiFetch<Order>(`/api/shop/seller/order/${orderId}`, {
    method: 'PATCH',
    body: { action },
  });
}
