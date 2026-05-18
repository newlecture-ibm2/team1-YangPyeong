'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import ModalDialog from '@/components/common/Modal/ModalDialog'
import { useModalDialog } from '@/components/common/Modal/useModalDialog'
import styles from './Crops.module.css'
import type {
  AdminCrop, AdminCropCategory,
  CreateCropRequest, UpdateCropRequest,
  CreateCropCategoryRequest, UpdateCropCategoryRequest,
} from '../_lib/crop.types'
import {
  fetchCrops, fetchCropCategories,
  createCrop, updateCrop, deleteCrop,
  createCropCategory, updateCropCategory, deleteCropCategory,
} from '../_lib/crop.api'
import { fetchApiSyncStatuses, triggerApiSync } from '../_lib/apiSync.api'

type TabType = 'crops' | 'categories'

export default function CropsPage() {
  /* ── 상태 ── */
  const [crops, setCrops] = useState<AdminCrop[]>([])
  const [categories, setCategories] = useState<AdminCropCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { toast: showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('crops')
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()

  // 필터
  const [filterCategory, setFilterCategory] = useState<number | undefined>(undefined)
  const [filterKeyword, setFilterKeyword] = useState('')

  // 모달
  const [showCropModal, setShowCropModal] = useState(false)
  const [editingCrop, setEditingCrop] = useState<AdminCrop | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCropCategory | null>(null)

  /* ── 데이터 로드 ── */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cropsData, categoriesData] = await Promise.all([
        fetchCrops(filterCategory, filterKeyword || undefined),
        fetchCropCategories(),
      ])
      setCrops(cropsData)
      setCategories(categoriesData)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '데이터 조회 실패', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterKeyword, showToast])

  useEffect(() => { loadData() }, [loadData])

  /* ── 카테고리명 매핑 ── */
  const getCategoryName = (categoryId: number) =>
    categories.find(c => c.id === categoryId)?.name ?? '-'

  /* ── 작물 모달 ── */
  const openCreateCropModal = () => { setEditingCrop(null); setShowCropModal(true) }
  const openEditCropModal = async (crop: AdminCrop) => { 
    if (crop.dataSource === 'NONGSARO') {
      const confirmed = await showConfirm(`"${crop.name}" 작물은 농사로 API 연동 데이터입니다. 정말 수정하시겠습니까?\n(추후 동기화 시 설정에 따라 덮어쓰기될 수 있습니다)`)
      if (!confirmed) return
    }
    setEditingCrop(crop)
    setShowCropModal(true) 
  }
  const closeCropModal = () => { setShowCropModal(false); setEditingCrop(null) }

  /* ── 작물 폼 제출 ── */
  const handleCropSubmit = async (data: CreateCropRequest | UpdateCropRequest) => {
    try {
      if (editingCrop) {
        await updateCrop(editingCrop.id, data as UpdateCropRequest)
        showToast('작물이 수정되었습니다.', 'success')
      } else {
        await createCrop(data as CreateCropRequest)
        showToast('작물이 등록되었습니다.', 'success')
      }
      closeCropModal()
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '처리 실패', 'error')
    }
  }

  /* ── 작물 삭제 ── */
  const handleDeleteCrop = async (crop: AdminCrop) => {
    const isNongsaro = crop.dataSource === 'NONGSARO'
    const warningText = isNongsaro 
      ? `"${crop.name}" 작물은 농사로 API 연동 데이터입니다. 정말 삭제하시겠습니까?\n(추후 동기화 시 설정에 따라 덮어쓰기될 수 있습니다)`
      : `"${crop.name}" 작물을 삭제하시겠습니까?`
      
    const confirmed = await showConfirm(warningText)
    if (!confirmed) return
    try {
      await deleteCrop(crop.id)
      showToast(`"${crop.name}" 삭제 완료`, 'success')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error')
    }
  }

  /* ── 카테고리 모달 ── */
  const openCreateCategoryModal = () => { setEditingCategory(null); setShowCategoryModal(true) }
  const openEditCategoryModal = async (cat: AdminCropCategory) => { 
    if (cat.dataSource === 'NONGSARO') {
      const confirmed = await showConfirm(`"${cat.name}" 카테고리는 농사로 API 연동 데이터입니다. 정말 수정하시겠습니까?\n(추후 동기화 시 설정에 따라 덮어쓰기될 수 있습니다)`)
      if (!confirmed) return
    }
    setEditingCategory(cat)
    setShowCategoryModal(true) 
  }
  const closeCategoryModal = () => { setShowCategoryModal(false); setEditingCategory(null) }

  /* ── 카테고리 폼 제출 ── */
  const handleCategorySubmit = async (data: CreateCropCategoryRequest | UpdateCropCategoryRequest) => {
    try {
      if (editingCategory) {
        await updateCropCategory(editingCategory.id, data as UpdateCropCategoryRequest)
        showToast('카테고리가 수정되었습니다.', 'success')
      } else {
        await createCropCategory(data as CreateCropCategoryRequest)
        showToast('카테고리가 등록되었습니다.', 'success')
      }
      closeCategoryModal()
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '처리 실패', 'error')
    }
  }

  /* ── 카테고리 삭제 ── */
  const handleDeleteCategory = async (cat: AdminCropCategory) => {
    const isNongsaro = cat.dataSource === 'NONGSARO'
    const warningText = isNongsaro
      ? `"${cat.name}" 카테고리는 농사로 API 연동 데이터입니다. 정말 삭제하시겠습니까?\n(추후 동기화 시 설정에 따라 덮어쓰기될 수 있습니다)`
      : `"${cat.name}" 카테고리를 삭제하시겠습니까?`

    const confirmed = await showConfirm(warningText)
    if (!confirmed) return
    try {
      await deleteCropCategory(cat.id)
      showToast(`"${cat.name}" 삭제 완료`, 'success')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error')
    }
  }

  /* ── 농사로 API 수동 동기화 ── */
  const [syncing, setSyncing] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)

  const handleSyncNongsaro = async (syncMode: 'MERGE' | 'FORCE') => {
    setShowSyncModal(false)
    setSyncing(true)
    try {
      // 1. API 상태 목록에서 NONGSARO_CROP의 ID 찾기
      const statuses = await fetchApiSyncStatuses()
      const nongsaroStatus = statuses.find(s => s.apiName === 'NONGSARO_CROP')
      
      if (!nongsaroStatus) {
        throw new Error('데이터베이스에 NONGSARO_CROP 동기화 설정이 없습니다.')
      }
      
      if (!nongsaroStatus.isActive) {
        throw new Error('농사로 API 수집이 비활성화되어 있습니다. 관리자 데이터 탭에서 활성화해주세요.')
      }

      // 2. 동기화 트리거
      await triggerApiSync(nongsaroStatus.id, syncMode)
      showToast(`농사로 API 동기화가 성공적으로 실행되었습니다. (${syncMode} 모드)`, 'success')
      
      // 3. 완료 후 데이터 재로딩
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '동기화 실패', 'error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>작물 기준정보 관리</h1>
        <div className={styles.headerActions}>
          <Button 
            variant="outline" 
            onClick={() => setShowSyncModal(true)} 
            disabled={syncing}
            style={{ marginRight: '10px' }}
          >
            {syncing ? '동기화 중...' : '🔄 농사로 API 동기화'}
          </Button>
          {activeTab === 'crops' && (
            <Button variant="primary" onClick={openCreateCropModal}>＋ 작물 추가</Button>
          )}
          {activeTab === 'categories' && (
            <Button variant="primary" onClick={openCreateCategoryModal}>＋ 카테고리 추가</Button>
          )}
        </div>
      </div>
      <p className={styles.subtitle}>작물 마스터 데이터와 카테고리를 관리합니다.</p>

      {/* 탭 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'crops' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('crops')}
        >
          작물 목록
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'categories' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          카테고리 관리
        </button>
      </div>

      {/* 작물 탭 */}
      {activeTab === 'crops' && (
        <>
          {/* 필터 */}
          <div className={styles.filterBar}>
            <select
              value={filterCategory ?? ''}
              onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">분류: 전체</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="작물명 검색..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>

          {/* 테이블 */}
          {loading ? (
            <div className={styles.loading}>데이터를 불러오는 중...</div>
          ) : crops.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🌾</div>
              등록된 작물이 없습니다.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={`${styles.table} ${styles.cropsTable}`}>
                <thead>
                  <tr>
                    <th>작물명</th>
                    <th>분류</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((crop) => (
                    <tr key={crop.id}>
                      <td data-label="작물명">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={styles.cropName}>{crop.name}</span>
                          {crop.dataSource === 'NONGSARO' ? (
                            <Badge variant="blue">농사로 API</Badge>
                          ) : (
                            <Badge variant="gray">수동</Badge>
                          )}
                        </div>
                      </td>
                      <td data-label="분류">{getCategoryName(crop.categoryId)}</td>
                      <td data-label="등록일">{crop.createdAt ? new Date(crop.createdAt).toLocaleDateString() : '-'}</td>
                      <td data-label="">
                        <div className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openEditCropModal(crop)}>수정</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCrop(crop)}>삭제</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 카테고리 탭 */}
      {activeTab === 'categories' && (
        <>
          {loading ? (
            <div className={styles.loading}>데이터를 불러오는 중...</div>
          ) : categories.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📁</div>
              등록된 카테고리가 없습니다.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={`${styles.table} ${styles.categoriesTable}`}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>카테고리명</th>
                    <th>설명</th>
                    <th>정렬순서</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td data-label="ID">{cat.id}</td>
                      <td data-label="카테고리명">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={styles.cropName}>{cat.name}</span>
                          {cat.dataSource === 'NONGSARO' ? (
                            <Badge variant="blue">농사로 API</Badge>
                          ) : (
                            <Badge variant="gray">수동</Badge>
                          )}
                        </div>
                      </td>
                      <td data-label="설명">{cat.description ?? '-'}</td>
                      <td data-label="정렬순서">{cat.displayOrder}</td>
                      <td data-label="상태">
                        <Badge variant={cat.isActive ? 'green' : 'red'}>
                          {cat.isActive ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td data-label="">
                        <div className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openEditCategoryModal(cat)}>수정</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat)}>삭제</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 작물 등록/수정 모달 */}
      {showCropModal && (
        <CropFormModal
          editingCrop={editingCrop}
          categories={categories}
          onSubmit={handleCropSubmit}
          onClose={closeCropModal}
        />
      )}

      {/* 카테고리 등록/수정 모달 */}
      {showCategoryModal && (
        <CategoryFormModal
          editingCategory={editingCategory}
          onSubmit={handleCategorySubmit}
          onClose={closeCategoryModal}
        />
      )}

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />

      {/* 동기화 옵션 모달 */}
      {showSyncModal && (
        <SyncOptionsModal
          onSubmit={handleSyncNongsaro}
          onClose={() => setShowSyncModal(false)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════ */
/*  작물 등록/수정 모달 (단순: categoryId + name)         */
/* ═══════════════════════════════════════════════════ */
interface CropFormModalProps {
  editingCrop: AdminCrop | null
  categories: AdminCropCategory[]
  onSubmit: (data: CreateCropRequest | UpdateCropRequest) => void
  onClose: () => void
}

function CropFormModal({ editingCrop, categories, onSubmit, onClose }: CropFormModalProps) {
  const [name, setName] = useState(editingCrop?.name ?? '')
  const [categoryId, setCategoryId] = useState(editingCrop?.categoryId?.toString() ?? '')
  const { dialog, showAlert, handleConfirm, handleClose } = useModalDialog()

  const handleSubmit = () => {
    if (!name.trim()) return showAlert('작물명을 입력해주세요.')
    if (!categoryId) return showAlert('카테고리를 선택해주세요.')

    onSubmit({ categoryId: Number(categoryId), name: name.trim() })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {editingCrop ? '작물 수정' : '새 작물 등록'}
        </h2>

        <div className={styles.formGroup}>
          <label>카테고리 *</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">카테고리 선택</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>작물명 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 상추" />
        </div>

        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingCrop ? '수정' : '등록'}
          </Button>
        </div>
      </div>
      <ModalDialog {...dialog} onConfirm={handleConfirm} onClose={handleClose} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════ */
/*  카테고리 등록/수정 모달                               */
/* ═══════════════════════════════════════════════════ */
interface CategoryFormModalProps {
  editingCategory: AdminCropCategory | null
  onSubmit: (data: CreateCropCategoryRequest | UpdateCropCategoryRequest) => void
  onClose: () => void
}

function CategoryFormModal({ editingCategory, onSubmit, onClose }: CategoryFormModalProps) {
  const [name, setName] = useState(editingCategory?.name ?? '')
  const [description, setDescription] = useState(editingCategory?.description ?? '')
  const [displayOrder, setDisplayOrder] = useState(editingCategory?.displayOrder?.toString() ?? '0')
  const [isActive, setIsActive] = useState(editingCategory?.isActive ?? true)
  const { dialog, showAlert, handleConfirm, handleClose } = useModalDialog()

  const handleSubmit = () => {
    if (!name.trim()) return showAlert('카테고리명을 입력해주세요.')

    const data: CreateCropCategoryRequest | UpdateCropCategoryRequest = {
      name: name.trim(),
      description: description || undefined,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
    }

    if (editingCategory) {
      (data as UpdateCropCategoryRequest).isActive = isActive
    }

    onSubmit(data)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {editingCategory ? '카테고리 수정' : '새 카테고리 등록'}
        </h2>

        <div className={styles.formGroup}>
          <label>카테고리명 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 엽채류" />
        </div>

        <div className={styles.formGroup}>
          <label>설명</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="예: 잎을 식용하는 채소류" />
        </div>

        <div className={styles.formGroup}>
          <label>정렬 순서</label>
          <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="0" />
        </div>

        {editingCategory && (
          <div className={styles.formGroup}>
            <label>활성 상태</label>
            <select value={String(isActive)} onChange={(e) => setIsActive(e.target.value === 'true')}>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>
        )}

        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingCategory ? '수정' : '등록'}
          </Button>
        </div>
      </div>
      <ModalDialog {...dialog} onConfirm={handleConfirm} onClose={handleClose} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════ */
/*  동기화 옵션 모달                                     */
/* ═══════════════════════════════════════════════════ */
interface SyncOptionsModalProps {
  onSubmit: (syncMode: 'MERGE' | 'FORCE') => void
  onClose: () => void
}

function SyncOptionsModal({ onSubmit, onClose }: SyncOptionsModalProps) {
  const [syncMode, setSyncMode] = useState<'MERGE' | 'FORCE'>('MERGE')

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>🔄 농사로 API 동기화 옵션</h2>
        
        <div className={styles.formGroup}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
            <input 
              type="radio" 
              name="syncMode" 
              value="MERGE" 
              checked={syncMode === 'MERGE'} 
              onChange={() => setSyncMode('MERGE')} 
              style={{ marginTop: '4px' }}
            />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>새로운 데이터만 추가 (기본값)</strong>
              <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                기존에 관리자가 수정한 이름이나 상태 변경 내역을 <strong>유지</strong>합니다.
              </p>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="syncMode" 
              value="FORCE" 
              checked={syncMode === 'FORCE'} 
              onChange={() => setSyncMode('FORCE')} 
              style={{ marginTop: '4px' }}
            />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>API 원본 데이터로 전체 덮어쓰기</strong>
              <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                수동 변경사항을 무시하고 API가 제공하는 원본 데이터로 <strong>강제 덮어쓰기</strong>합니다. (수동 추가 작물은 제외)
              </p>
            </div>
          </label>
        </div>

        <div className={styles.modalActions}>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={() => onSubmit(syncMode)}>동기화 시작</Button>
        </div>
      </div>
    </div>
  )
}
