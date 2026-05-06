'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import { useToast } from '@/components/common/Toast'
import styles from './Policy.module.css'
import type { AdminPolicyData, PolicyDataRequest } from '../_lib/policy.types'
import { fetchPolicies, createPolicy, updatePolicy } from '../_lib/policy.api'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function PolicyPage() {
  const [policies, setPolicies] = useState<AdminPolicyData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<AdminPolicyData | null>(null)
  const [formData, setFormData] = useState<PolicyDataRequest>({ externalId: '', data: '' })
  const toast = useToast()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchPolicies()
      setPolicies(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '정책 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const openCreateModal = () => {
    setEditingPolicy(null)
    setFormData({ externalId: '', data: '' })
    setShowModal(true)
  }

  const openEditModal = (policy: AdminPolicyData) => {
    setEditingPolicy(policy)
    setFormData({ externalId: policy.externalId, data: policy.data })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.externalId.trim() || !formData.data.trim()) {
      toast.error('외부 ID와 데이터를 모두 입력해주세요.')
      return
    }

    try {
      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, formData)
        toast.success('정책이 수정되었습니다.')
      } else {
        await createPolicy(formData)
        toast.success('정책이 등록되었습니다.')
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    }
  }

  if (loading) return <div className={styles.loadingWrap}>정책 데이터 로딩 중...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>📋 정책 데이터 관리</h1>
          <p className={styles.pageSub}>지자체 농업 지원 정책 DB를 등록/갱신합니다. 총 {policies.length}건</p>
        </div>
        <button className={styles.addBtn} onClick={openCreateModal}>+ 정책 등록</button>
      </div>

      {policies.length === 0 ? (
        <div className={styles.emptyState}>등록된 정책이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>외부 정책 ID</th>
                <th>데이터 미리보기</th>
                <th>수집일</th>
                <th>등록일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(policy => (
                <tr key={policy.id}>
                  <td>{policy.id}</td>
                  <td className={styles.externalId}>{policy.externalId}</td>
                  <td className={styles.dataPreview}>{policy.data}</td>
                  <td>{formatDate(policy.fetchedAt)}</td>
                  <td>{formatDate(policy.createdAt)}</td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button className={styles.editBtn} onClick={() => openEditModal(policy)}>수정</button>
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
        <Modal
          isOpen={showModal}
          title={editingPolicy ? '정책 데이터 수정' : '정책 데이터 등록'}
          onClose={() => setShowModal(false)}
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>외부 정책 ID</label>
            <input
              className={styles.formInput}
              value={formData.externalId}
              onChange={e => setFormData(prev => ({ ...prev, externalId: e.target.value }))}
              placeholder="예: POLICY-YP-2026-001"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>정책 데이터 (JSON)</label>
            <textarea
              className={styles.formTextarea}
              value={formData.data}
              onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
              placeholder='{"title":"양평군 친환경 농업 지원","amount":500000,...}'
            />
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>취소</button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingPolicy ? '수정' : '등록'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
