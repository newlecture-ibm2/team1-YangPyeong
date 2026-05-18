'use client';

import { ReactNode } from 'react';
import styles from './ResponsiveTable.module.css';

export interface ResponsiveTableColumn<T> {
  key: string;
  label: string;
  /** 셀 렌더 함수. 없으면 row[key] 그대로 표시 */
  render?: (row: T) => ReactNode;
  /** 모바일 카드에서 숨길 컬럼 (예: 너무 긴 ID 같은 것) */
  hideOnMobile?: boolean;
  /** 데스크탑 컬럼 정렬 */
  align?: 'left' | 'center' | 'right';
}

export interface ResponsiveTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  /** 모바일 카드 헤더로 표시할 텍스트. 미지정 시 첫 컬럼 사용. */
  cardTitle?: (row: T) => ReactNode;
  /** 우측 액션 영역 (버튼 등) */
  actions?: (row: T) => ReactNode;
  /** 행 클릭 핸들러 */
  onRowClick?: (row: T) => void;
  /** 키 추출 (default: index) */
  rowKey?: (row: T, index: number) => string | number;
  /** 데이터 없을 때 표시 */
  emptyMessage?: string;
}

/**
 * 데스크탑: 표준 테이블 / 모바일: 카드 변환
 *
 * 예시:
 * ```tsx
 * <ResponsiveTable
 *   columns={[
 *     { key: 'name', label: '이름' },
 *     { key: 'email', label: '이메일' },
 *   ]}
 *   data={users}
 *   actions={(u) => <Button>승인</Button>}
 * />
 * ```
 */
export default function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  cardTitle,
  actions,
  onRowClick,
  rowKey,
  emptyMessage = '데이터가 없습니다.',
}: ResponsiveTableProps<T>) {
  const getKey = (row: T, idx: number) =>
    rowKey ? rowKey(row, idx) : String(idx);

  const renderCell = (col: ResponsiveTableColumn<T>, row: T): ReactNode => {
    if (col.render) return col.render(row);
    const v = (row as Record<string, unknown>)[col.key];
    return v == null ? '-' : String(v);
  };

  if (data.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <>
      {/* ── 데스크탑: 표준 테이블 ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={styles.th}
                  style={{ textAlign: c.align ?? 'left' }}
                >
                  {c.label}
                </th>
              ))}
              {actions && <th className={styles.th} aria-label="액션" />}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={getKey(row, i)}
                className={`${styles.tr} ${onRowClick ? styles.trClickable : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={styles.td}
                    style={{ textAlign: c.align ?? 'left' }}
                  >
                    {renderCell(c, row)}
                  </td>
                ))}
                {actions && (
                  <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 모바일: 카드 ── */}
      <div className={styles.cardList}>
        {data.map((row, i) => {
          const title = cardTitle
            ? cardTitle(row)
            : renderCell(columns[0], row);
          const visibleCols = columns.filter(
            (c, idx) => !c.hideOnMobile && (cardTitle || idx !== 0),
          );

          return (
            <div
              key={getKey(row, i)}
              className={`${styles.card} ${onRowClick ? styles.cardClickable : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{title}</span>
                {actions && (
                  <span className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </span>
                )}
              </div>
              {visibleCols.length > 0 && (
                <dl className={styles.cardFields}>
                  {visibleCols.map((c) => (
                    <div key={c.key} className={styles.cardField}>
                      <dt className={styles.cardFieldLabel}>{c.label}</dt>
                      <dd className={styles.cardFieldValue}>{renderCell(c, row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
