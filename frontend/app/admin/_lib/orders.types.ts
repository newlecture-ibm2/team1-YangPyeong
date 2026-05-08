export type OrderStatus = 'ORDERED' | 'ACCEPTED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface AdminOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  id: number;
  buyerId: number;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingMemo: string;
  createdAt: string;
  items: AdminOrderItem[];
}
