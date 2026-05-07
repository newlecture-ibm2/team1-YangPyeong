'use client';

import { useState, useCallback, useRef } from 'react';

interface ModalDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  mode: 'alert' | 'confirm';
}

const INITIAL: ModalDialogState = {
  isOpen: false,
  title: '',
  message: '',
  mode: 'alert',
};

/**
 * alert() / confirm()을 공통 Modal 컴포넌트로 대체하기 위한 훅.
 *
 * - showAlert(msg)  → 알림 모달 (확인 버튼만)
 * - showConfirm(msg) → 확인/취소 모달, Promise<boolean> 반환
 */
export function useModalDialog() {
  const [dialog, setDialog] = useState<ModalDialogState>(INITIAL);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  /** 알림 모달 (alert 대체) */
  const showAlert = useCallback((message: string, title = '알림') => {
    setDialog({ isOpen: true, title, message, mode: 'alert' });
  }, []);

  /** 확인 모달 (confirm 대체) — Promise<boolean> 반환 */
  const showConfirm = useCallback(
    (message: string, title = '확인'): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setDialog({ isOpen: true, title, message, mode: 'confirm' });
      });
    },
    [],
  );

  /** 확인 버튼 */
  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setDialog(INITIAL);
  }, []);

  /** 취소/닫기 버튼 */
  const handleClose = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setDialog(INITIAL);
  }, []);

  return { dialog, showAlert, showConfirm, handleConfirm, handleClose };
}
