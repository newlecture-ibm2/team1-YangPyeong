import React, { useState } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import styles from './ReasonModal.module.css'

interface ReasonModalProps {
  isOpen: boolean
  title: string
  label?: string
  placeholder?: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export default function ReasonModal({ isOpen, title, label = '사유', placeholder = '사유를 입력해주세요', onClose, onConfirm }: ReasonModalProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('사유를 입력해주세요.')
      return
    }
    onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  const PRESETS = [
    '스팸 / 홍보성 글',
    '욕설 / 비방 / 혐오 발언',
    '농산물과 무관한 글',
    '부적절한 내용',
    'AI 시스템에 의한 자동 유해성 판단'
  ]

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className={styles.modalBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>{label}</label>
          <textarea
            className={styles.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            rows={4}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>빠른 입력</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PRESETS.map((preset, idx) => (
              <button 
                key={idx} 
                className={styles.presetBtn} 
                onClick={() => setReason(preset)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-bg-sub)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={handleClose}>취소</Button>
          <Button variant="primary" onClick={handleConfirm} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>확인</Button>
        </div>
      </div>
    </Modal>
  )
}
