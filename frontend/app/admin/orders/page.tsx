'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Dropdown, SearchInput, Spinner, useToast } from '@/components'
import styles from './Orders.module.css'
import type { AdminOrder, OrderStatus } from '../_lib/orders.types'
import { fetchOrders, updateOrderStatus } from '../_lib/orders.api'

function formatPrice(price: number): string {
  return price.toLocaleString() + '원'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getStatusBadge(status: string): { variant: 'green' | 'red' | 'orange' | 'gray' | 'blue'; label: string } {
  switch (status) {
    case 'ORDERED': return { variant: 'orange', label: '주문완료' }
    case 'ACCEPTED': return { variant: 'blue', label: '접수완료' }
    case 'SHIPPED': return { variant: 'green', label: '배송중' }
    case 'COMPLETED': return { variant: 'gray', label: '배송완료' }
    case 'CANCELLED': return { variant: 'red', label: '취소됨' }
    default: return { variant: 'gray', label: status }
  }
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'ORDERED', label: '📝 주문완료' },
  { value: 'ACCEPTED', label: '✅ 접수완료' },
  { value: 'SHIPPED', label: '🚚 배송중' },
  { value: 'COMPLETED', label: '📦 배송완료' },
  { value: 'CANCELLED', label: '❌ 취소됨' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const toast = useToast()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchOrders()
      setOrders(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '주문 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as OrderStatus)
      toast.success('주문 상태가 성공적으로 변경되었습니다.')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 변경 실패')
    }
  }

  const filteredOrders = useMemo(() => {
    if (!keyword.trim()) return orders
    return orders.filter(o => 
      o.orderNumber.toLowerCase().includes(keyword.toLowerCase()) ||
      o.receiverName.toLowerCase().includes(keyword.toLowerCase())
    )
  }, [orders, keyword])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner message="주문 정보를 불러오는 중입니다..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>주문 관리</h1>
          <span className={styles.totalCount}>총 {orders.length}건</span>
        </div>
        <div className={styles.actions}>
          <SearchInput 
            placeholder="주문번호, 수령인 검색..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => {}}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
              <tr>
                <th>주문일시</th>
                <th>주문번호</th>
                <th>주문상품</th>
                <th>총 결제금액</th>
                <th>수령인</th>
                <th>현재 상태</th>
                <th style={{ width: '160px' }}>상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    조회된 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const badge = getStatusBadge(order.status)
                  const options = STATUS_OPTIONS.filter(o => o.value !== order.status)
                  const mainItemName = order.items.length > 0 ? order.items[0].productName : '상품 없음'
                  const itemsSummary = order.items.length > 1 ? `${mainItemName} 외 ${order.items.length - 1}건` : mainItemName

                  return (
                    <tr key={order.id}>
                      <td>{formatDate(order.createdAt)}</td>
                      <td className={styles.orderNumber}>
                        {order.status === 'ORDERED' && <span title="신규 주문">🆕</span>}
                        {order.orderNumber}
                      </td>
                      <td>
                        <div>{itemsSummary}</div>
                        {order.items.length === 1 && (
                          <div className={styles.itemsSummary}>({order.items[0].quantity}개)</div>
                        )}
                      </td>
                      <td className={styles.priceCell}>{formatPrice(order.totalAmount)}</td>
                      <td>
                        <div>{order.receiverName}</div>
                        <div className={styles.itemsSummary}>{order.receiverPhone}</div>
                      </td>
                      <td><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td>
                        <div className={styles.actions}>
                          <Dropdown
                            placeholder="상태 변경"
                            options={options}
                            value=""
                            onChange={(value) => handleStatusChange(order.id, value)}
                            size="sm"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
    </div>
  )
}
