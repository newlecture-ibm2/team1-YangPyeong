'use client';

import { useState } from 'react';
import { PasswordVisibilityIcon } from '@/components/icons';
import styles from './Input.module.css';

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
          <PasswordVisibilityIcon revealed={passwordVisible} />
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
