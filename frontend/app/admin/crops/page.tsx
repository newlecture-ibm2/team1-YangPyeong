'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import styles from './Crops.module.css'
import type {
  AdminCrop, AdminCropCategory,
  CreateCropRequest, UpdateCropRequest,
  CreateCropCategoryRequest, UpdateCropCategoryRequest,
} from '../_lib/crop.types'
import {
  fetchCrops, fetchCropCategories, createCrop, updateCrop, deactivateCrop,
  createCropCategory, updateCropCategory, deleteCropCategory,
} from '../_lib/crop.api'

type TabType = 'crops' | 'categories'

export default function CropsPage() {
  /* ── 상태 ── */
  const [crops, setCrops] = useState<AdminCrop[]>([])
  const [categories, setCategories] = useState<AdminCropCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { toast: showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('crops')

  // 필터
  const [filterCategory, setFilterCategory] = useState<number | undefined>(undefined)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)

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
        fetchCrops(filterCategory, filterKeyword || undefined, filterActive),
        fetchCropCategories(),
      ])
      setCrops(cropsData)
      setCategories(categoriesData)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '데이터 조회 실패', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterKeyword, filterActive, showToast])

  useEffect(() => { loadData() }, [loadData])

  /* ── 카테고리명 매핑 ── */
  const getCategoryName = (categoryId: number) =>
    categories.find(c => c.id === categoryId)?.name ?? '-'

  /* ── 작물 모달 ── */
  const openCreateCropModal = () => { setEditingCrop(null); setShowCropModal(true) }
  const openEditCropModal = (crop: AdminCrop) => { setEditingCrop(crop); setShowCropModal(true) }
  const closeCropModal = () => { setShowCropModal(false); setEditingCrop(null) }

  /* ── 카테고리 모달 ── */
  const openCreateCategoryModal = () => { setEditingCategory(null); setShowCategoryModal(true) }
  const openEditCategoryModal = (cat: AdminCropCategory) => { setEditingCategory(cat); setShowCategoryModal(true) }
  const closeCategoryModal = () => { setShowCategoryModal(false); setEditingCategory(null) }

  /* ── 작물 비활성화 ── */
  const handleDeactivate = async (crop: AdminCrop) => {
    if (!confirm(`"${crop.name}" 작물을 비활성화하시겠습니까?`)) return
    try {
      await deactivateCrop(crop.id)
      showToast(`"${crop.name}" 비활성화 완료`, 'success')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '비활성화 실패', 'error')
    }
  }

  /* ── 작물 폼 제출 ── */
  const handleCropSubmit = async (data: CreateCropRequest | UpdateCropRequest) => {
    try {
      if (editingCrop) {
        await updateCrop(editingCrop.id, data as UpdateCropRequest)
        showToast('작물 정보가 수정되었습니다.', 'success')
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
    if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) return
    try {
      await deleteCropCategory(cat.id)
      showToast(`"${cat.name}" 삭제 완료`, 'success')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error')
    }
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>🌱 작물 마스터 데이터 관리</h1>
        {activeTab === 'crops' ? (
          <Button variant="primary" onClick={openCreateCropModal}>＋ 작물 추가</Button>
        ) : (
          <Button variant="primary" onClick={openCreateCategoryModal}>＋ 카테고리 추가</Button>
        )}
      </div>

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
            <select
              value={filterActive === undefined ? '' : String(filterActive)}
              onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
            >
              <option value="">상태: 전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
            <input
              type="text"
              placeholder="작물명 또는 코드 검색..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', minWidth: 200 }}
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
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>코드</th>
                    <th>작물명</th>
                    <th>분류</th>
                    <th>재배기간(일)</th>
                    <th>수확량(kg/㎡)</th>
                    <th>생산비(원/㎡)</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((crop) => (
                    <tr key={crop.id}>
                      <td><span className={styles.cropCode}>{crop.code}</span></td>
                      <td><span className={styles.cropName}>{crop.name}</span></td>
                      <td>{getCategoryName(crop.categoryId)}</td>
                      <td>{crop.growthDays ?? '-'}</td>
                      <td>{crop.yieldPerSqm ?? '-'}</td>
                      <td>{crop.avgCostPerSqm ? Number(crop.avgCostPerSqm).toLocaleString() : '-'}</td>
                      <td>
                        <Badge variant={crop.isActive ? 'green' : 'red'}>
                          {crop.isActive ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openEditCropModal(crop)}>수정</Button>
                          {crop.isActive && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeactivate(crop)}>비활성화</Button>
                          )}
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
            <div className={styles.tableWrap}>
              <table className={styles.table}>
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
                      <td>{cat.id}</td>
                      <td><span className={styles.cropName}>{cat.name}</span></td>
                      <td>{cat.description ?? '-'}</td>
                      <td>{cat.displayOrder}</td>
                      <td>
                        <Badge variant={cat.isActive ? 'green' : 'red'}>
                          {cat.isActive ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td>
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
          categories={categories}
          editingCrop={editingCrop}
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
    </div>
  )
}

/* ═══════════════════════════════════════════════════ */
/*  작물 등록/수정 모달                                  */
/* ═══════════════════════════════════════════════════ */
interface CropFormModalProps {
  categories: AdminCropCategory[]
  editingCrop: AdminCrop | null
  onSubmit: (data: CreateCropRequest | UpdateCropRequest) => void
  onClose: () => void
}

function CropFormModal({ categories, editingCrop, onSubmit, onClose }: CropFormModalProps) {
  const [categoryId, setCategoryId] = useState(editingCrop?.categoryId ?? (categories[0]?.id ?? 0))
  const [name, setName] = useState(editingCrop?.name ?? '')
  const [growthDays, setGrowthDays] = useState(editingCrop?.growthDays?.toString() ?? '')
  const [yieldPerSqm, setYieldPerSqm] = useState(editingCrop?.yieldPerSqm?.toString() ?? '')
  const [avgCostPerSqm, setAvgCostPerSqm] = useState(editingCrop?.avgCostPerSqm?.toString() ?? '')
  const [climateConditions, setClimateConditions] = useState(editingCrop?.climateConditions ?? '')
  const [isActive, setIsActive] = useState(editingCrop?.isActive ?? true)

  const handleSubmit = () => {
    if (!name.trim()) return alert('작물명을 입력해주세요.')
    if (!categoryId) return alert('분류를 선택해주세요.')

    const data: CreateCropRequest | UpdateCropRequest = {
      categoryId,
      name: name.trim(),
      growthDays: growthDays ? Number(growthDays) : undefined,
      yieldPerSqm: yieldPerSqm ? Number(yieldPerSqm) : undefined,
      avgCostPerSqm: avgCostPerSqm ? Number(avgCostPerSqm) : undefined,
      climateConditions: climateConditions || undefined,
    }

    if (editingCrop) {
      (data as UpdateCropRequest).isActive = isActive
    }

    onSubmit(data)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {editingCrop ? '작물 정보 수정' : '새 작물 등록'}
        </h2>

        <div className={styles.formGroup}>
          <label>분류 *</label>
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
            <option value={0} disabled>선택하세요</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>작물명 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 상추" />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>재배기간 (일)</label>
            <input type="number" value={growthDays} onChange={(e) => setGrowthDays(e.target.value)} placeholder="예: 60" />
          </div>
          <div className={styles.formGroup}>
            <label>수확량 (kg/㎡)</label>
            <input type="number" step="0.01" value={yieldPerSqm} onChange={(e) => setYieldPerSqm(e.target.value)} placeholder="예: 2.5" />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>평균 생산비 (원/㎡)</label>
          <input type="number" step="0.01" value={avgCostPerSqm} onChange={(e) => setAvgCostPerSqm(e.target.value)} placeholder="예: 1500" />
        </div>

        <div className={styles.formGroup}>
          <label>기후 조건 (JSON)</label>
          <textarea
            value={climateConditions}
            onChange={(e) => setClimateConditions(e.target.value)}
            placeholder='{"minTemp": 15, "maxTemp": 30, "minRainfall": 500, "maxRainfall": 1200}'
            rows={3}
          />
        </div>

        {editingCrop && (
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
            {editingCrop ? '수정' : '등록'}
          </Button>
        </div>
      </div>
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

  const handleSubmit = () => {
    if (!name.trim()) return alert('카테고리명을 입력해주세요.')

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
    </div>
  )
}
