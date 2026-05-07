'use client';

import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number; // 0-based
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * 게시판 페이지네이션 컴포넌트
 * @param currentPage 현재 페이지 (0부터 시작)
 * @param totalPages 전체 페이지 수
 * @param onPageChange 페이지 변경 핸들러
 */
export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // 표시할 페이지 번호 범위 계산 (최대 5개씩)
  const maxButtons = 5;
  let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);

  // 끝부분 조정
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(0, endPage - maxButtons + 1);
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className={styles.pagination}>
      <button 
        className={styles.navBtn} 
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &lt;
      </button>

      {pages.map(page => (
        <button
          key={page}
          className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page + 1}
        </button>
      ))}

      <button 
        className={styles.navBtn} 
        disabled={currentPage === totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        &gt;
      </button>
    </div>
  );
}
