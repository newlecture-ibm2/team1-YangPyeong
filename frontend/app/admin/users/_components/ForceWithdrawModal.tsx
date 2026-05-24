import { useState } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import Dropdown from '@/components/common/Dropdown/Dropdown'
import { useToast } from '@/components/common/Toast'
import styles from './ForceWithdrawModal.module.css'

interface ForceWithdrawModalProps {
  isOpen: boolean
  userName: string
  onClose: () => void
  onConfirm: (reasonType: string, reasonDetail: string) => void
}

const REASON_OPTIONS = [
  { label: '선택하세요', value: '' },
  { label: '고객센터(CS) 요청 대행', value: 'CS_REQUEST' },
  { label: '허위 농장 등록', value: 'FAKE_FARM' },
  { label: '커뮤니티 어뷰징 / 도배', value: 'ABUSIVE_COMMUNITY' },
  { label: '불건전한 상점 이용', value: 'ABUSIVE_SHOP' },
  { label: '기타 사유', value: 'OTHER' },
]

export default function ForceWithdrawModal({
  isOpen,
  userName,
  onClose,
  onConfirm,
}: ForceWithdrawModalProps) {
  const [reasonType, setReasonType] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const toast = useToast()

  const handleConfirm = () => {
    if (!reasonType) {
      toast.error('제재 사유 카테고리를 선택해주세요.')
      return
    }
    onConfirm(reasonType, reasonDetail)
  }

  // 모달이 닫힐 때 상태 초기화
  const handleClose = () => {
    setReasonType('')
    setReasonDetail('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🚨 관리자 강제 탈퇴 (제재)" size="sm">
      <div className={styles.container}>
        <p className={styles.warningText}>
          <strong>{userName}</strong> 사용자를 즉시 강제 탈퇴 처리합니다. <br />
          상점 상품은 즉시 비활성화되며, 30일 내에 수동 복구하지 않으면 영구 파기됩니다.
        </p>

        <div className={styles.formGroup}>
          <label>제재 사유 카테고리 <span className={styles.required}>*</span></label>
          <Dropdown
            options={REASON_OPTIONS}
            value={reasonType}
            onChange={setReasonType}
          />
        </div>

        <div className={styles.formGroup}>
          <label>상세 사유 (선택)</label>
          <textarea
            className={styles.textarea}
            placeholder="상세한 제재 사유를 입력하세요..."
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            rows={4}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <Button variant="outline" onClick={handleClose}>취소</Button>
          <Button variant="primary" onClick={handleConfirm}>강제 탈퇴 실행</Button>
        </div>
      </div>
    </Modal>
  )
}
