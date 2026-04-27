'use client';

import styles from './SearchInput.module.css';

interface SearchInputProps {
  /** placeholder 텍스트 */
  placeholder?: string;
  /** 현재 값 */
  value?: string;
  /** 값 변경 핸들러 */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 검색 실행 핸들러 (Enter 또는 버튼 클릭) */
  onSearch?: (value: string) => void;
  /** input name 속성 */
  name?: string;
  /** 사이즈 */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** 추가 className */
  className?: string;
}

export default function SearchInput({
  placeholder = '검색어를 입력하세요...',
  value,
  onChange,
  onSearch,
  name,
  size = 'md',
  fullWidth = false,
  className = '',
}: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch((e.target as HTMLInputElement).value);
    }
  };

  const handleSearchClick = () => {
    if (onSearch && value !== undefined) {
      onSearch(value);
    }
  };

  const wrapperClasses = [
    styles.wrapper,
    styles[`wrapper--${size}`],
    fullWidth ? styles['wrapper--full'] : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <span className={styles.icon}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        name={name}
      />
      {onSearch && (
        <button
          type="button"
          className={styles.button}
          onClick={handleSearchClick}
          aria-label="검색"
        >
          검색
        </button>
      )}
    </div>
  );
}
