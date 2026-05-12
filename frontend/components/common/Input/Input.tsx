'use client';

import { useState } from 'react';
import styles from './Input.module.css';

/** HMR/청크 경로에서 lucide 청크와 충돌하는 사례가 있어 인라인 SVG 사용 */
function IconEye({ hidden }: { hidden: boolean }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (hidden) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden {...common}>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden {...common}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  as?: 'input' | 'textarea';
  rows?: number;
  autoComplete?: string;
  /** type="password"일 때 눈 아이콘 토글 표시 (기본 true) */
  passwordToggle?: boolean;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  name,
  id,
  required = false,
  disabled = false,
  className = '',
  as = 'input',
  rows = 4,
  autoComplete,
  passwordToggle = true,
}: InputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const showPwToggle = as === 'input' && type === 'password' && passwordToggle;
  const inputType = showPwToggle && passwordVisible ? 'text' : type;

  const renderField = () => {
    if (as === 'textarea') {
      return (
        <textarea
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          id={id}
          required={required}
          disabled={disabled}
          rows={rows}
          autoComplete={autoComplete}
        />
      );
    }

    const inputClass = `${styles.input}${showPwToggle ? ` ${styles.inputWithToggle}` : ''}`;

    const inputEl = (
      <input
        className={inputClass}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        name={name}
        id={id}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    );

    if (!showPwToggle) return inputEl;

    return (
      <div className={styles.inputWrap}>
        {inputEl}
        <button
          type="button"
          className={styles.toggleVisibility}
          aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
          disabled={disabled}
          onClick={() => setPasswordVisible((v) => !v)}
        >
          <IconEye hidden={passwordVisible} />
        </button>
      </div>
    );
  };

  return (
    <div className={`${styles.group} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {renderField()}
    </div>
  );
}
