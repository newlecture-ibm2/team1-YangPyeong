'use client';

import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal/Modal';
import styles from '../page.module.css';

interface ReactivateModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onReactivate: () => void;
}

/** 탈퇴 계정 재가입 안내 모달 */
export default function ReactivateModal({ isOpen, email, onClose, onReactivate }: ReactivateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="탈퇴 계정 안내">
      <div className={styles.reactivateModal}>
        <p className={styles.reactivateText}>
          해당 이메일(<strong>{email}</strong>)은 이전에 탈퇴한 계정입니다.<br />
          기존 계정을 재활성화하시겠습니까?
        </p>
        <p className={styles.reactivateHint}>
          재활성화하면 이전 정보로 다시 로그인할 수 있습니다.
        </p>
        <div className={styles.reactivateBtnGroup}>
          <Button variant="outline" size="lg" onClick={onClose}>취소</Button>
          <Button variant="primary" size="lg" onClick={onReactivate}>재활성화 후 로그인</Button>
        </div>
      </div>
    </Modal>
  );
}
