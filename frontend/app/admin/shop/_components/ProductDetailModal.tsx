import React from 'react'
import { Modal, Badge, Button } from '@/components'
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants'
import type { AdminProduct } from '../../_lib/shop.types'
import styles from './ProductDetailModal.module.css'

interface ProductDetailModalProps {
  isOpen: boolean
  product: AdminProduct | null
  onClose: () => void
  onStatusChange: (productId: number, newStatus: string) => void
  onDelete: (productId: number) => void
}

function formatPrice(price: number): string {
  return price.toLocaleString() + '원'
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

export default function ProductDetailModal({ isOpen, product, onClose, onStatusChange, onDelete }: ProductDetailModalProps) {
  if (!product) return null

  const badge = getStatusBadge(product.status)

  const renderActionButtons = () => {
    // [REVIEW] 탭 소속 (신규 신청 심사)
    if (product.status === 'PENDING') {
      return (
        <div className={styles.actionButtons}>
          <Button variant="primary" onClick={() => onStatusChange(product.id, 'ACTIVE')}>✅ 승인</Button>
          <Button variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => onStatusChange(product.id, 'REJECTED')}>❌ 반려</Button>
        </div>
      )
    }
    if (product.status === 'REJECTED') {
      return (
        <div className={styles.actionButtons}>
          <Button variant="outline" onClick={() => onStatusChange(product.id, 'PENDING')}>⏳ 재검토</Button>
          <Button variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => onDelete(product.id)}>🗑️ 영구 삭제</Button>
        </div>
      )
    }

    // [INVENTORY] 탭 소속 (상점 상품 관리)
    if (product.status === 'ACTIVE' || product.status === 'SOLDOUT') {
      return (
        <div className={styles.actionButtons}>
          {product.status === 'ACTIVE' ? (
            <Button variant="outline" onClick={() => onStatusChange(product.id, 'SOLDOUT')}>🛑 품절처리</Button>
          ) : (
            <Button variant="primary" onClick={() => onStatusChange(product.id, 'ACTIVE')}>✅ 재판매</Button>
          )}
          <Button variant="outline" onClick={() => onStatusChange(product.id, 'INACTIVE')}>⏸️ 숨김</Button>
        </div>
      )
    }
    if (product.status === 'INACTIVE') {
      return (
        <div className={styles.actionButtons}>
          <Button variant="primary" onClick={() => onStatusChange(product.id, 'ACTIVE')}>✅ 판매 복구</Button>
          <Button variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => onDelete(product.id)}>🗑️ 영구 삭제</Button>
        </div>
      )
    }
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="상품 상세 정보">
      <div className={styles.modalBody}>
        <div className={styles.productHeader}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl || DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            className={styles.productImage}
          />
          <div className={styles.productInfo}>
            <div className={styles.statusRow}>
              <Badge variant={badge.variant as any}>{badge.label}</Badge>
            </div>
            <h2 className={styles.productName}>{product.name}</h2>
            <div className={styles.metaInfo}>
              <p><strong>판매자:</strong> {product.sellerName}</p>
              <p><strong>카테고리:</strong> {product.categoryName || '-'}</p>
              <p><strong>판매가:</strong> {formatPrice(product.price)}</p>
              <p><strong>재고:</strong> {product.stock}개</p>
            </div>
          </div>
        </div>

        <div className={styles.descriptionSection}>
          <h3>상품 상세 설명</h3>
          <div className={styles.descriptionBox}>
            {product.description || '상세 설명이 등록되지 않았습니다.'}
          </div>
        </div>

        <div className={styles.modalActions}>
          <div className={styles.leftActions}>
            {renderActionButtons()}
          </div>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </Modal>
  )
}
