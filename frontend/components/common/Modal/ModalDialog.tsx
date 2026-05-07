'use client';

import Modal from './Modal';
import Button from '@/components/common/Button/Button';
import styles from './ModalDialog.module.css';

interface ModalDialogProps {
  /** 모달 열림 여부 */
  isOpen: boolean;
  /** 모달 제목 */
  title: string;
  /** 모달 메시지 */
  message: string;
  /** 모드: alert(확인만) 또는 confirm(확인/취소) */
  mode: 'alert' | 'confirm';
  /** 확인 버튼 클릭 */
  onConfirm: () => void;
  /** 취소/닫기 버튼 클릭 */
  onClose: () => void;
}

/**
 * alert() / confirm()을 대체하는 공통 모달 다이얼로그 컴포넌트.
 * useModalDialog 훅과 함께 사용합니다.
 *
 * @example
 * ```tsx
 * const { dialog, showAlert, showConfirm, handleConfirm, handleClose } = useModalDialog();
 *
 * // alert 대체
 * showAlert('상품명을 먼저 입력해주세요.');
 *
 * // confirm 대체
 * const ok = await showConfirm('기존 데이터를 덮어쓸까요?');
 * if (!ok) return;
 *
 * // JSX
 * <ModalDialog {...dialog} onConfirm={handleConfirm} onClose={handleClose} />
 * ```
 */
export default function ModalDialog({
  isOpen,
  title,
  message,
  mode,
  onConfirm,
  onClose,
}: ModalDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          {mode === 'confirm' && (
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
          )}
          <Button variant="primary" onClick={onConfirm}>
            확인
          </Button>
        </div>
      </div>
    </Modal>
  );
}
