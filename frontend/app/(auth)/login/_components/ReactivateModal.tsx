'use client';

import Button from '@/components/common/Button';
import styles from '../page.module.css';

interface ReactivateModalProps {
  loading: boolean;
  onReactivate: () => void;
  onCancel: () => void;
}

export default function ReactivateModal({ loading, onReactivate, onCancel }: ReactivateModalProps) {
  return (
    <div className={styles.reactivateOverlay}>
      <div className={styles.reactivateModal}>
        <h2 className={styles.reactivateTitle}>계정 복구</h2>
        <p className={styles.reactivateDesc}>
          이전에 탈퇴한 계정입니다.<br />
          다시 FarmBalance를 이용하시겠습니까?
        </p>
        <p className={styles.reactivateNote}>
          계정을 복구하면 기존 프로필 정보로 다시 로그인됩니다.
        </p>
        <div className={styles.reactivateActions}>
          <Button variant="outline" onClick={onCancel} disabled={loading}>취소</Button>
          <Button variant="dark" onClick={onReactivate} disabled={loading}>
            {loading ? '복구 중...' : '다시 시작하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
