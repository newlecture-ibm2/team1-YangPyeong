'use client'

import React, { useState } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import Input from '@/components/common/Input/Input'
import { useToast } from '@/components/common/Toast'
import styles from './CreateAccountModal.module.css'
import type { CreateUserRequest } from '../../_lib/user.types'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: CreateUserRequest) => Promise<void>
}

export default function CreateAccountModal({ isOpen, onClose, onConfirm }: CreateAccountModalProps) {
  const [role, setRole] = useState<'GOV' | 'ADMIN'>('GOV')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  // 모달이 열릴 때 상태 초기화
  React.useEffect(() => {
    if (isOpen) {
      setRole('GOV')
      setEmail('')
      setPassword('')
      setName('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!email || !name || !password) {
      toast.error('모든 입력 필드를 채워주세요.')
      return
    }

    // 간단한 이메일 정규식 체크
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('올바른 이메일 형식을 입력해주세요.')
      return
    }

    if (password.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm({ email, password, name, role })
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleTitle = role === 'GOV' ? '지자체(공공기관) 계정' : '최고 관리자 계정'

  return (
    <Modal
      isOpen={isOpen}
      title="특수 권한 계정 발급"
      onClose={onClose}
    >
      <div className={styles.container}>
        {/* 역할 선택 탭 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${role === 'GOV' ? styles.activeTab : ''}`}
            onClick={() => setRole('GOV')}
          >
            지자체 (GOV)
          </button>
          <button
            className={`${styles.tab} ${role === 'ADMIN' ? styles.activeTab : ''}`}
            onClick={() => setRole('ADMIN')}
          >
            관리자 (ADMIN)
          </button>
        </div>

        <div className={styles.formArea}>
          <p className={styles.description}>
            {role === 'GOV'
              ? '지자체 공무원용 대시보드 접근 권한이 부여됩니다.'
              : '플랫폼의 모든 데이터를 제어할 수 있는 최고 관리자 권한이 부여됩니다.'}
          </p>

          <div className={styles.formGroup}>
            <label>권한 유형</label>
            <div className={styles.readOnlyBadge}>{roleTitle}</div>
          </div>

          <div className={styles.formGroup}>
            <label>아이디 (이메일)</label>
            <Input
              type="email"
              placeholder={role === 'GOV' ? "예) agri_dept@yangpyeong.go.kr" : "예) admin2@farmbalance.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {role === 'GOV' && (
              <span className={styles.helpText}>
                ※ 담당자 개인 이메일보다 부서 공용 이메일 사용을 권장합니다.
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>{role === 'GOV' ? '기관명' : '이름'}</label>
            <Input
              type="text"
              placeholder={role === 'GOV' ? "예) 양평군청 농업기술센터" : "예) 시스템 관리자 2"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>초기 임시 비밀번호</label>
            <Input
              type="text"
              placeholder="임시 비밀번호 입력 (8자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className={styles.helpText}>
              ※ 관리자가 임의로 지정하며, 대상자가 최초 로그인 시 변경해야 합니다.
            </span>
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          취소
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : '계정 발급하기'}
        </Button>
      </div>
    </Modal>
  )
}
