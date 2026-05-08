'use client';

import { useState } from 'react';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  title: string;
}

export default function ReportModal({ isOpen, onClose, onSubmit, title }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('신고 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>신고 사유를 상세히 적어주세요. 관리자 확인 후 조치됩니다.</p>
        
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>신고 사유</label>
          <textarea
            className={styles.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="부적절한 내용, 욕설, 도배 등 구체적인 사유를 입력해주세요."
            required
          />
          
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? '제출 중...' : '신고하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
