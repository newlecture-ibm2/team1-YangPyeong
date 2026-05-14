'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** 데스크탑에서도 bottom sheet로 표시 (기본은 모달처럼 중앙 정렬) */
  alwaysBottom?: boolean;
  /** 풋터 영역 (확인/취소 버튼 등) */
  footer?: ReactNode;
}

/**
 * 모바일 친화 bottom sheet (768px↓).
 * 데스크탑(769px↑)에서는 중앙 정렬 모달처럼 동작.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  alwaysBottom = false,
  footer,
}: BottomSheetProps) {
  // body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${alwaysBottom ? styles.overlayBottom : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      onClick={onClose}
    >
      <div
        className={`${styles.sheet} ${alwaysBottom ? styles.sheetBottom : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 (모바일 표시) */}
        <div className={styles.handle} aria-hidden="true" />

        {(title || true) && (
          <div className={styles.header}>
            {title && (
              <h2 id="bottom-sheet-title" className={styles.title}>
                {title}
              </h2>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="닫기" type="button">
              <X size={20} />
            </button>
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
