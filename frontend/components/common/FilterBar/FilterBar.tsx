'use client';

import React from 'react';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  /** 왼쪽에 들어갈 드롭다운 컴포넌트들의 배열 */
  dropdowns?: React.ReactNode[];
  /** 오른쪽에 들어갈 검색 인풋 컴포넌트 */
  search?: React.ReactNode;
  /** 추가 className */
  className?: string;
}

export default function FilterBar({ dropdowns, search, className = '' }: FilterBarProps) {
  return (
    <div className={`${styles.filterBar} ${className}`}>
      {dropdowns && dropdowns.length > 0 && (
        <div className={styles.dropdowns}>
          {dropdowns.map((dropdown, index) => (
            <div key={index} className={styles.dropdownItem}>
              {dropdown}
            </div>
          ))}
        </div>
      )}
      {search && <div className={styles.search}>{search}</div>}
    </div>
  );
}
