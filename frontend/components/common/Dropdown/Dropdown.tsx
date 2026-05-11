'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  /** 복수 선택 여부 */
  multiple?: boolean;
  /** 인라인 스타일 */
  style?: React.CSSProperties;
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
  multiple = false,
  style,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (dropdownRef.current && isOpen) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true); // true for capturing scroll on all scrollable parents
    }
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);
  const currentValues = value ? value.split(',').filter(Boolean) : [];
  let displayLabel = placeholder || '선택하세요';
  
  if (multiple) {
    if (currentValues.length > 0) {
      const firstLabel = options.find(opt => opt.value === currentValues[0])?.label || currentValues[0];
      displayLabel = currentValues.length > 1 ? `${firstLabel} 외 ${currentValues.length - 1}건` : firstLabel;
    }
  } else {
    const selectedOption = options.find((opt) => opt.value === value);
    if (selectedOption) displayLabel = selectedOption.label;
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutsideWrapper = dropdownRef.current && !dropdownRef.current.contains(target);
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(target);

      if (clickedOutsideWrapper && clickedOutsideMenu) {
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

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      let newValues;
      if (currentValues.includes(optionValue)) {
        newValues = currentValues.filter(v => v !== optionValue);
      } else {
        newValues = [...currentValues, optionValue];
      }
      if (onChange) onChange(newValues.join(','));
    } else {
      if (onChange) {
        onChange(optionValue);
      }
      setIsOpen(false);
    }
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
    <div className={`${styles.group} ${fullWidth ? styles['group--full'] : ''}`} style={style}>
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
          <span className={(!multiple && !currentValues.length) || (multiple && currentValues.length === 0) ? styles.placeholderText : ''}>
            {displayLabel}
          </span>
          <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {isOpen && mounted && createPortal(
          <ul className={styles.dropdownMenu} style={{ ...menuStyle }} ref={menuRef}>
            {options.map((opt) => {
              const isSelected = multiple ? currentValues.includes(opt.value) : value === opt.value;
              return (
                <li
                  key={opt.value}
                  className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(opt.value);
                  }}
                >
                  {opt.label}
                  {isSelected && (
                    <span className={styles.checkIcon}>
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
      </div>
    </div>
  );
}
