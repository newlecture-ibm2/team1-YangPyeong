'use client';

import { useEffect, useCallback } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  /** 모달 표시 위치: 화면 가운데 또는 하단(바텀시트) */
  position?: 'center' | 'bottom';
  className?: string;
}

export default function Modal({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  position = 'center',
  className = '',
}: ModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const overlayClass = position === 'bottom'
    ? styles.overlayBottom
    : styles.overlay;

  const modalClass = position === 'bottom'
    ? `${styles.modalBottom} ${className}`
    : `${styles.modal} ${styles[`modal--${size}`]} ${className}`;

  return (
    <div className={overlayClass} onClick={onClose}>
      <div
        className={modalClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        <div className={styles.header}>
          {title && (
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
          )}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
