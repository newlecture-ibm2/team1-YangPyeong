'use client'

import { useState, useEffect, useCallback } from 'react'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import styles from './Shop.module.css'
import type { AdminProduct, ProductStatus } from '../_lib/shop.types'
import { fetchProducts, updateProductStatus } from '../_lib/shop.api'

function formatPrice(price: number): string {
  return price.toLocaleString() + '원'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getStatusBadge(status: string): { variant: 'green' | 'red' | 'orange' | 'gray'; label: string } {
  switch (status) {
    case 'ACTIVE': return { variant: 'green', label: '활성' }
    case 'INACTIVE': return { variant: 'gray', label: '비활성' }
    case 'PENDING': return { variant: 'orange', label: '승인대기' }
    case 'REJECTED': return { variant: 'red', label: '반려' }
    default: return { variant: 'gray', label: status }
  }
}

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'ACTIVE', label: '승인 (활성)' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'REJECTED', label: '반려' },
]

export default function ShopPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상품 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const handleStatusChange = async (productId: number, newStatus: string) => {
    try {
      await updateProductStatus(productId, newStatus)
      toast.success('상품 상태가 변경되었습니다.')
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus } : p))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 변경 실패')
    }
  }

  if (loading) return <div className={styles.loadingWrap}>상품 로딩 중...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🛒 상점 관리</h1>
          <p className={styles.pageSub}>상품 승인/반려/비활성화를 관리합니다. 총 {products.length}건</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className={styles.emptyState}>등록된 상품이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>상품명</th>
                <th>가격</th>
                <th>재고</th>
                <th>상태</th>
                <th>등록일</th>
                <th>상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const badge = getStatusBadge(product.status)
                return (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className={styles.productName}>{product.name}</td>
                    <td className={styles.priceCell}>{formatPrice(product.price)}</td>
                    <td>{product.stock}개</td>
                    <td><Badge variant={badge.variant}>{badge.label}</Badge></td>
                    <td>{formatDate(product.createdAt)}</td>
                    <td>
                      <select
                        className={styles.statusSelect}
                        value={product.status}
                        onChange={(e) => handleStatusChange(product.id, e.target.value)}
                      >
                        <option value={product.status} disabled>상태 변경</option>
                        {STATUS_OPTIONS.filter(o => o.value !== product.status).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
