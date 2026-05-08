import type { AdminOrder, OrderStatus } from './orders.types'

export async function fetchOrders(): Promise<AdminOrder[]> {
  const res = await fetch('/api/admin/orders')
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || '주문 목록 조회에 실패했습니다.')
  }
  const data = await res.json()
  return data.data
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
  const res = await fetch(`/api/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || '주문 상태 변경에 실패했습니다.')
  }
}
