/* ════════════════════════════════════════════════════════
   Shop 도메인 — 공통 타입 정의
   ERD 및 API 스펙 기반
   ════════════════════════════════════════════════════════ */

/** 상품 카테고리 */
export interface ProductCategory {
  id: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

/** 상품 상태 */
export type ProductStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'SOLDOUT';

/** 상품 */
export interface Product {
  id: number;
  sellerId: number;
  sellerName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  /** 상품 이미지 URL 배열 (최대 5장, 첫 번째가 대표 이미지) */
  imageUrls: string[];
  status: ProductStatus;
  salesCount: number;
  createdAt: string;
}

/** 상품 목록 조회 쿼리 파라미터 */
export interface ProductListParams {
  page?: number;
  size?: number;
  category?: string;
  sort?: ProductSortType;
  keyword?: string;
}

/** 상품 정렬 옵션 */
export type ProductSortType = 'bestSelling' | 'priceLow' | 'priceHigh' | 'latest';

/** 정렬 옵션 라벨 매핑 */
export const SORT_OPTIONS: { value: ProductSortType; label: string }[] = [
  { value: 'bestSelling', label: '판매량순' },
  { value: 'priceLow', label: '낮은가격순' },
  { value: 'priceHigh', label: '높은가격순' },
  { value: 'latest', label: '최신순' },
];

/** 카테고리 탭 아이템 타입 (프론트 UI용) */
export interface CategoryTab {
  value: string;
  label: string;
}

/** 장바구니 아이템 */
export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product: Product;
}

/** 주문 상태 */
export type OrderStatus = 'ORDERED' | 'ACCEPTED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

/** 주문 */
export interface Order {
  id: number;
  buyerId: number;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingMemo: string;
  trackingNumber?: string;
  shippedAt?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/** 주문 항목 */
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
