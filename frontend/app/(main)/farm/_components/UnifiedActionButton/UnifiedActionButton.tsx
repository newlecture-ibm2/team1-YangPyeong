'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './UnifiedActionButton.module.css';

interface UnifiedActionButtonProps {
  onAddHistory: () => void;
}

export default function UnifiedActionButton({ onAddHistory }: UnifiedActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.container} ref={menuRef}>
      {/* 메인 버튼 */}
      <button
        className={`${styles.mainButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={styles.icon}>{isOpen ? '✕' : '＋'}</span>
        <span className={styles.label}>농장 활동</span>
      </button>

      {/* 액션 메뉴 */}
      {isOpen && (
        <div className={styles.menu}>
          <Link href="/farm/cultivation-register" className={styles.menuItem} onClick={() => setIsOpen(false)}>
            <span className={styles.menuIcon}>🌱</span>
            <div className={styles.menuText}>
              <div className={styles.menuTitle}>재배 등록</div>
              <div className={styles.menuDesc}>새로운 작물을 심었나요?</div>
            </div>
          </Link>

          <Link href="/farm/harvest" className={styles.menuItem} onClick={() => setIsOpen(false)}>
            <span className={styles.menuIcon}>🌾</span>
            <div className={styles.menuText}>
              <div className={styles.menuTitle}>수확 완료</div>
              <div className={styles.menuDesc}>수확한 작물을 기록하세요.</div>
            </div>
          </Link>

          <button 
            className={styles.menuItem} 
            onClick={() => {
              onAddHistory();
              setIsOpen(false);
            }}
          >
            <span className={styles.menuIcon}>📝</span>
            <div className={styles.menuText}>
              <div className={styles.menuTitle}>활동 기록</div>
              <div className={styles.menuDesc}>오늘의 영농 일지를 써보세요.</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
