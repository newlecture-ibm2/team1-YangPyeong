'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge, Dropdown, SearchInput, Spinner, FilterBar } from '@/components'
import { useToast } from '@/components'
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants'
import styles from './Shop.module.css'
import type { AdminProduct } from '../_lib/shop.types'
import { fetchProducts, updateProductStatus, deleteAdminProduct, aiAuditProducts } from '../_lib/shop.api'

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

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: '전체 카테고리' },
  { value: '곡물류', label: '곡물류' },
  { value: '채소류', label: '채소류' },
  { value: '과일류', label: '과일류' },
  { value: '특용작물', label: '특용작물' },
  { value: '가공품', label: '가공품' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: '최신순' },
  { value: 'priceHigh', label: '가격 높은순' },
  { value: 'priceLow', label: '가격 낮은순' },
  { value: 'bestSelling', label: '판매량순' },
]

const SUB_TABS = {
  INVENTORY: [
    { value: 'ALL', label: '전체' },
    { value: 'ACTIVE', label: '✅ 판매중' },
    { value: 'SOLDOUT', label: '🛑 품절' },
    { value: 'INACTIVE', label: '⏸️ 숨김' }
  ],
  REVIEW: [
    { value: 'ALL', label: '전체' },
    { value: 'PENDING', label: '⏳ 승인 대기중' },
    { value: 'REJECTED', label: '❌ 반려됨' }
  ]
}

type TabType = 'INVENTORY' | 'REVIEW'

export default function ShopPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)

  // 페이징 및 필터 상태
  const [activeTab, setActiveTab] = useState<TabType>('INVENTORY')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [isAuditing, setIsAuditing] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('ALL')
  const [sort, setSort] = useState('createdAt')

  const toast = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 선택된 서브 탭이 'ALL'이면 해당 탭에 속한 모든 구체적 상태값들을 쉼표로 이어붙임
      let statusQuery = statusFilter
      if (statusFilter === 'ALL') {
        statusQuery = SUB_TABS[activeTab]
          .filter(t => t.value !== 'ALL')
          .map(t => t.value)
          .join(',')
      }

      const [mainData, pendingData] = await Promise.all([
        fetchProducts(keyword, category, statusQuery, sort, page, 20),
        fetchProducts('', 'ALL', 'PENDING', 'createdAt', 0, 1) // 승인대기 카운트용
      ])

      setProducts(mainData.products)
      setTotalPages(mainData.meta.totalPages)
      setTotalCount(mainData.meta.totalCount)
      setPendingCount(pendingData.meta.totalCount)

    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상품 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [activeTab, statusFilter, keyword, category, sort, page, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
    setPage(0)
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setStatusFilter('ALL') // 탭 변경 시 서브 필터 초기화
    setPage(0)
  }

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter)
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

  const handleDelete = async (productId: number) => {
    if (!confirm('이 상품을 시스템에서 영구적으로 삭제하시겠습니까? (연관 데이터 보호를 위해 실제로는 숨김 처리됩니다)')) return
    try {
      await deleteAdminProduct(productId)
      toast.success('상품이 안전하게 삭제되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상품 삭제 실패')
    }
  }

  const handleAiAudit = async () => {
    if (!confirm('현재 대기 중인 신규 신청 상품들을 AI가 일괄 심사합니다. 진행하시겠습니까?')) return
    setIsAuditing(true)
    try {
      const res = await aiAuditProducts()
      toast.success(`총 ${res.approvedCount}개의 상품이 정상으로 확인되어 자동 승인되었습니다!`)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 자동 심사 실패')
    } finally {
      setIsAuditing(false)
    }
  }

  const renderActionButtons = (product: AdminProduct) => {
    // [REVIEW] 탭 소속 (신규 신청 심사)
    if (product.status === 'PENDING') {
      return (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} ${styles.btnApprove}`} onClick={() => handleStatusChange(product.id, 'ACTIVE')}>✅ 승인</button>
          <button className={`${styles.actionBtn} ${styles.btnReject}`} onClick={() => handleStatusChange(product.id, 'REJECTED')}>❌ 반려</button>
        </div>
      )
    }
    if (product.status === 'REJECTED') {
      return (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} ${styles.btnRestore}`} onClick={() => handleStatusChange(product.id, 'PENDING')}>⏳ 재검토</button>
          <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDelete(product.id)}>🗑️ 영구 삭제</button>
        </div>
      )
    }

    // [INVENTORY] 탭 소속 (상점 상품 관리)
    if (product.status === 'ACTIVE' || product.status === 'SOLDOUT') {
      return (
        <div className={styles.actionButtons}>
          {product.status === 'ACTIVE' ? (
            <button className={`${styles.actionBtn} ${styles.btnSoldout}`} onClick={() => handleStatusChange(product.id, 'SOLDOUT')}>🛑 품절처리</button>
          ) : (
            <button className={`${styles.actionBtn} ${styles.btnApprove}`} onClick={() => handleStatusChange(product.id, 'ACTIVE')}>✅ 재판매</button>
          )}
          <button className={`${styles.actionBtn} ${styles.btnHide}`} onClick={() => handleStatusChange(product.id, 'INACTIVE')}>⏸️ 숨김</button>
        </div>
      )
    }
    if (product.status === 'INACTIVE') {
      return (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} ${styles.btnRestore}`} onClick={() => handleStatusChange(product.id, 'ACTIVE')}>✅ 판매 복구</button>
          <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDelete(product.id)}>🗑️ 영구 삭제</button>
        </div>
      )
    }

    return null
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

      <div className={styles.tabs}>
        <button
          className={`${styles.tabItem} ${activeTab === 'INVENTORY' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('INVENTORY')}
        >
          상점 상품 관리
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === 'REVIEW' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('REVIEW')}
        >
          신규 신청 심사
          {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className={styles.subTabs} style={{ marginBottom: 0 }}>
          {SUB_TABS[activeTab].map(tab => (
            <button
              key={tab.value}
              className={`${styles.subTab} ${statusFilter === tab.value ? styles.subTabActive : ''}`}
              onClick={() => handleStatusFilterChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === 'REVIEW' && (
          <button 
            className={`${styles.actionBtn} ${styles.btnApprove}`}
            style={{ padding: '8px 16px', fontSize: '14px', background: 'var(--color-primary)', color: 'white' }}
            onClick={handleAiAudit}
            disabled={isAuditing}
          >
            {isAuditing ? 'AI 심사 중...' : '🤖 AI 일괄 자동 심사'}
          </button>
        )}
      </div>

      <FilterBar
        dropdowns={[
          <Dropdown
            key="category"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(val) => { setCategory(val); setPage(0); }}
            placeholder="카테고리"
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
                <th style={{ width: '160px' }}>액션</th>
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

                  return (
                    <tr key={product.id}>
                      <td>#{product.id}</td>
                      <td>
                        <div className={styles.productCell}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl || DEFAULT_PRODUCT_IMAGE}
                            alt={product.name}
                            className={styles.productThumbnail}
                          />
                          <div className={styles.productName}>
                            {product.status === 'PENDING' && <span title="신규 요청" style={{ marginRight: '4px' }}>🆕</span>}
                            {product.name}
                          </div>
                        </div>
                      </td>
                      <td>{product.categoryName || '-'}</td>
                      <td>{product.sellerName}</td>
                      <td className={styles.priceCell}>{formatPrice(product.price)}</td>
                      <td>{product.stock}개</td>
                      <td><Badge variant={badge.variant as any}>{badge.label}</Badge></td>
                      <td>{formatDate(product.createdAt)}</td>
                      <td>{renderActionButtons(product)}</td>
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
