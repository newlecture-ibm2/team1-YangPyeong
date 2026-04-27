'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  /** 라벨 텍스트 (생략 가능) */
  label?: string;
  /** 드롭다운 옵션 목록 */
  options: DropdownOption[];
  /** 현재 선택된 값 */
  value?: string;
  /** 값 변경 핸들러 */
  onChange?: (value: string) => void;
  /** input name 속성 (hidden input에 사용) */
  name?: string;
  /** placeholder 텍스트 (기본 선택지) */
  placeholder?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 필수 입력 여부 */
  required?: boolean;
  /** 사이즈 */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** 추가 className */
  className?: string;
}

export default function Dropdown({
  label,
  options,
  value,
  onChange,
  name,
  placeholder,
  disabled = false,
  required = false,
  size = 'md',
  fullWidth = false,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 라벨 찾기
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder || '선택하세요';

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.addEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  const selectClasses = [
    styles.select,
    styles[`select--${size}`],
    fullWidth ? styles['select--full'] : '',
    disabled ? styles['select--disabled'] : '',
    isOpen ? styles['select--open'] : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.group} ${fullWidth ? styles['group--full'] : ''}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.wrapper} ref={dropdownRef}>
        {/* 실제 폼 전송용 hidden input */}
        {name && <input type="hidden" name={name} value={value || ''} required={required} />}

        <div
          className={selectClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !disabled && setIsOpen(!isOpen);
            }
          }}
        >
          <span className={!selectedOption ? styles.placeholderText : ''}>
            {displayLabel}
          </span>
          <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {isOpen && (
          <ul className={styles.dropdownMenu}>
            {options.map((opt) => (
              <li
                key={opt.value}
                className={`${styles.dropdownItem} ${value === opt.value ? styles.dropdownItemActive : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
                {value === opt.value && (
                  <span className={styles.checkIcon}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
