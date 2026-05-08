'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Dropdown, SearchInput, Spinner } from '@/components'
import { useToast } from '@/components'
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
    case 'ACTIVE': return { variant: 'green', label: '승인 (활성)' }
    case 'INACTIVE': return { variant: 'gray', label: '비활성' }
    case 'PENDING': return { variant: 'orange', label: '승인대기' }
    case 'REJECTED': return { variant: 'red', label: '반려' }
    default: return { variant: 'gray', label: status }
  }
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: '✅ 승인' },
  { value: 'INACTIVE', label: '⏸️ 비활성' },
  { value: 'REJECTED', label: '❌ 반려' },
]

export default function ShopPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
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
      toast.success('상품 상태가 성공적으로 변경되었습니다.')
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus } : p))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 변경 실패')
    }
  }

  const filteredProducts = useMemo(() => {
    if (!keyword.trim()) return products
    return products.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()))
  }, [products, keyword])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner message="상품 정보를 불러오는 중입니다..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>상점 관리</h1>
          <span className={styles.totalCount}>총 {products.length}건</span>
        </div>
        <div className={styles.actions}>
          <SearchInput 
            placeholder="상품명 검색..." 
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
                <th>No</th>
                <th>상품명</th>
                <th>판매가</th>
                <th>재고현황</th>
                <th>현재 상태</th>
                <th>등록일자</th>
                <th style={{ width: '160px' }}>상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    조회된 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const badge = getStatusBadge(product.status)
                  const options = STATUS_OPTIONS.filter(o => o.value !== product.status)
                  
                  return (
                    <tr key={product.id}>
                      <td>#{product.id}</td>
                      <td className={styles.productName}>
                        {product.status === 'PENDING' && <span title="신규 요청">🆕</span>}
                        {product.name}
                      </td>
                      <td className={styles.priceCell}>{formatPrice(product.price)}</td>
                      <td>{product.stock}개</td>
                      <td><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td>{formatDate(product.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          <Dropdown
                            placeholder="상태 변경"
                            options={options}
                            value=""
                            onChange={(value) => handleStatusChange(product.id, value)}
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
