'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Dropdown, SearchInput, Spinner, FilterBar } from '@/components'
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
    case 'ACTIVE': return { variant: 'green', label: '승인 (판매중)' }
    case 'INACTIVE': return { variant: 'gray', label: '숨김 (비활성)' }
    case 'PENDING': return { variant: 'orange', label: '승인대기' }
    case 'REJECTED': return { variant: 'red', label: '반려' }
    case 'SOLDOUT': return { variant: 'gray', label: '품절' }
    default: return { variant: 'gray', label: status }
  }
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '⏳ 승인대기' },
  { value: 'ACTIVE', label: '✅ 판매중' },
  { value: 'INACTIVE', label: '⏸️ 숨김 (비활성)' },
  { value: 'REJECTED', label: '❌ 반려' },
  { value: 'SOLDOUT', label: '🛑 품절' },
]

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: '전체 카테고리' },
  { value: '곡물류', label: '곡물류' },
  { value: '채소류', label: '채소류' },
  { value: '과일류', label: '과일류' },
  { value: '특용작물', label: '특용작물' },
  { value: '가공품', label: '가공품' },
]

const FILTER_STATUS_OPTIONS = [
  { value: 'ALL', label: '전체 상태' },
  ...STATUS_OPTIONS
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: '최신순' },
  { value: 'priceHigh', label: '가격 높은순' },
  { value: 'priceLow', label: '가격 낮은순' },
  { value: 'bestSelling', label: '판매량순' },
]

export default function ShopPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  
  // 페이징 및 필터 상태
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sort, setSort] = useState('createdAt')

  const toast = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchProducts(keyword, category, statusFilter, sort, page, 20)
      setProducts(data.products)
      setTotalPages(data.meta.totalPages)
      setTotalCount(data.meta.totalCount)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상품 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [keyword, category, statusFilter, sort, page, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
    setPage(0)
  }

  const handleFilterChange = (type: 'category' | 'status', value: string) => {
    if (type === 'category') setCategory(value)
    if (type === 'status') setStatusFilter(value)
    setPage(0)
  }

  const handleStatusChange = async (productId: number, newStatus: string) => {
    try {
      await updateProductStatus(productId, newStatus)
      toast.success('상품 상태가 성공적으로 변경되었습니다.')
      loadData() // 갱신
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 변경 실패')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>상점 관리</h1>
          <span className={styles.totalCount}>총 {totalCount}건</span>
        </div>
        <div className={styles.actions}>
          <Dropdown
            options={SORT_OPTIONS}
            value={sort}
            onChange={(val) => { setSort(val); setPage(0); }}
          />
        </div>
      </div>

      <FilterBar
        dropdowns={[
          <Dropdown
            key="category"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(val) => handleFilterChange('category', val)}
            placeholder="카테고리"
          />,
          <Dropdown
            key="status"
            options={FILTER_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(val) => handleFilterChange('status', val)}
            placeholder="상태"
          />
        ]}
        search={
          <SearchInput
            placeholder="상품명 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => handleSearch(keyword)}
          />
        }
      />

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner message="상품 정보를 불러오는 중입니다..." />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>판매자명</th>
                <th>판매가</th>
                <th>재고현황</th>
                <th>현재 상태</th>
                <th>등록일자</th>
                <th style={{ width: '160px' }}>상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyRow}>
                    조회된 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const badge = getStatusBadge(product.status)
                  const options = STATUS_OPTIONS.filter(o => o.value !== product.status)
                  
                  return (
                    <tr key={product.id}>
                      <td>#{product.id}</td>
                      <td className={styles.productName}>
                        {product.status === 'PENDING' && <span title="신규 요청" style={{marginRight: '4px'}}>🆕</span>}
                        {product.name}
                      </td>
                      <td>{product.categoryName || '-'}</td>
                      <td>{product.sellerName}</td>
                      <td className={styles.priceCell}>{formatPrice(product.price)}</td>
                      <td>{product.stock}개</td>
                      <td><Badge variant={badge.variant as any}>{badge.label}</Badge></td>
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
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ◀
          </button>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            // 간단한 표시용
            if (i < page - 2 || i > page + 2) return null;
            return (
              <button
                key={i}
                className={`${styles.pageBtn} ${page === i ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            )
          })}

          <button 
            className={styles.pageBtn} 
            disabled={page === totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  )
}
