'use client'

import { useState } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import styles from './PostDetailModal.module.css'

interface SanctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { deleteContent: boolean; suspendUser: boolean }) => void;
}

export default function SanctionModal({ isOpen, onClose, onConfirm }: SanctionModalProps) {
  const [deleteContent, setDeleteContent] = useState(true)
  const [suspendUser, setSuspendUser] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm({ deleteContent, suspendUser })
    // 초기화
    setDeleteContent(true)
    setSuspendUser(false)
  }

  const handleClose = () => {
    onClose()
    setDeleteContent(true)
    setSuspendUser(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🚨 신고 제재 처리">
      <div className={styles.modalContent} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
        <p style={{ color: 'var(--color-text)', lineHeight: '1.5' }}>
          해당 신고를 처리완료 상태로 변경하며, 아래의 제재를 가합니다.
        </p>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={deleteContent} 
            onChange={(e) => setDeleteContent(e.target.checked)} 
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '1rem', color: 'var(--color-text)' }}>해당 악성 게시글/댓글 삭제 처리</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={suspendUser} 
            onChange={(e) => setSuspendUser(e.target.checked)} 
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '1rem', color: 'var(--color-danger)' }}>작성자 계정 무기한 이용 정지 (영구 차단)</span>
        </label>

        <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={handleClose}>취소</Button>
          <Button variant="primary" onClick={handleConfirm} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'white' }}>
            제재 확정
          </Button>
        </div>
      </div>
    </Modal>
  )
}
