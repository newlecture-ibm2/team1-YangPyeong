'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Dropdown, SearchInput, Spinner, useToast } from '@/components'
import ResponsiveTable from '@/components/common/ResponsiveTable/ResponsiveTable'
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
        <ResponsiveTable<AdminOrder & Record<string, unknown>>
          columns={[
            { key: 'createdAt', label: '주문일시', render: (o) => formatDate(o.createdAt) },
            { key: 'orderNumber', label: '주문번호', render: (o) => (
              <div className={styles.orderNumber}>
                {o.status === 'ORDERED' && <span title="신규 주문">🆕</span>}
                {o.orderNumber}
              </div>
            )},
            { key: 'items', label: '주문상품', render: (o) => {
              const mainItemName = o.items.length > 0 ? o.items[0].productName : '상품 없음'
              const itemsSummary = o.items.length > 1 ? `${mainItemName} 외 ${o.items.length - 1}건` : mainItemName
              return (
                <div>
                  <div>{itemsSummary}</div>
                  {o.items.length === 1 && (
                    <div className={styles.itemsSummary}>({o.items[0].quantity}개)</div>
                  )}
                </div>
              )
            }},
            { key: 'totalAmount', label: '결제금액', render: (o) => <div className={styles.priceCell}>{formatPrice(o.totalAmount)}</div> },
            { key: 'receiver', label: '수령인', render: (o) => (
              <div>
                <div>{o.receiverName}</div>
                <div className={styles.itemsSummary}>{o.receiverPhone}</div>
              </div>
            )},
            { key: 'status', label: '현재 상태', render: (o) => {
              const badge = getStatusBadge(o.status)
              return <Badge variant={badge.variant as any}>{badge.label}</Badge>
            }},
            { key: 'actions', label: '상태 변경', align: 'center', render: (o) => {
              const options = STATUS_OPTIONS.filter(opt => opt.value !== o.status)
              return (
                <div className={styles.actions}>
                  <Dropdown
                    placeholder="상태 변경"
                    options={options}
                    value=""
                    onChange={(value) => handleStatusChange(o.id, value)}
                    size="sm"
                  />
                </div>
              )
            }}
          ]}
          data={filteredOrders as any}
          rowKey={(o) => String(o.id)}
          emptyMessage="조회된 주문이 없습니다."
        />
      </div>
    </div>
  )
}
