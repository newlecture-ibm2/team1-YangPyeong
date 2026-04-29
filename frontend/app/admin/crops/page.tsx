'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import styles from './Crops.module.css'
import type { AdminCrop, AdminCropCategory, CreateCropRequest, UpdateCropRequest } from '../_lib/crop.types'
import { fetchCrops, fetchCropCategories, createCrop, updateCrop, deactivateCrop } from '../_lib/crop.api'

export default function CropsPage() {
  /* ── 상태 ── */
  const [crops, setCrops] = useState<AdminCrop[]>([])
  const [categories, setCategories] = useState<AdminCropCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { toast: showToast } = useToast()

  // 필터
  const [filterCategory, setFilterCategory] = useState<number | undefined>(undefined)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)

  // 모달
  const [showModal, setShowModal] = useState(false)
  const [editingCrop, setEditingCrop] = useState<AdminCrop | null>(null)

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

  /* ── 카테고리명 매핑 헬퍼 ── */
  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name ?? '-'
  }

  /* ── 모달 열기/닫기 ── */
  const openCreateModal = () => {
    setEditingCrop(null)
    setShowModal(true)
  }

  const openEditModal = (crop: AdminCrop) => {
    setEditingCrop(crop)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCrop(null)
  }

  /* ── 비활성화 ── */
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

  /* ── 폼 제출 ── */
  const handleSubmit = async (data: CreateCropRequest | UpdateCropRequest) => {
    try {
      if (editingCrop) {
        await updateCrop(editingCrop.id, data as UpdateCropRequest)
        showToast('작물 정보가 수정되었습니다.', 'success')
      } else {
        await createCrop(data as CreateCropRequest)
        showToast('작물이 등록되었습니다.', 'success')
      }
      closeModal()
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '처리 실패', 'error')
    }
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>🌱 작물 마스터 데이터 관리</h1>
        <Button variant="primary" onClick={openCreateModal}>＋ 작물 추가</Button>
      </div>

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
                      <Button variant="outline" size="sm" onClick={() => openEditModal(crop)}>수정</Button>
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

      {/* 등록/수정 모달 */}
      {showModal && (
        <CropFormModal
          categories={categories}
          editingCrop={editingCrop}
          onSubmit={handleSubmit}
          onClose={closeModal}
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
