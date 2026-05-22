'use client';

import { useState } from 'react';
import type { MyReportActivity } from '../../_lib/community-activity.types';
import { REPORT_STATUS_LABEL } from '../_lib/constants';
import ReportDetailModal from './ReportDetailModal';
import styles from '../page.module.css';

interface ReportActivityListProps {
  items: MyReportActivity[];
}

export default function ReportActivityList({ items }: ReportActivityListProps) {
  const [selectedReport, setSelectedReport] = useState<MyReportActivity | null>(null);

  const handleItemClick = (report: MyReportActivity) => {
    setSelectedReport(report);
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
  };

  return (
    <>
      {items.map(report => (
        <div 
          key={report.reportId} 
          className={`${styles.item} ${styles.clickable}`}
          onClick={() => handleItemClick(report)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleItemClick(report);
            }
          }}
        >
          <div className={styles.titleRow}>
            <h3 className={styles.title}>
              [{report.targetType === 'POST' ? '게시글' : '댓글'}] {report.targetTitle}
            </h3>
          </div>
          <div className={styles.meta}>사유: {report.reason}</div>
          <div className={styles.meta}>
            상태: {REPORT_STATUS_LABEL[report.status] ?? report.status} · {new Date(report.createdAt).toLocaleString('ko-KR')}
          </div>
        </div>
      ))}

      <ReportDetailModal 
        isOpen={selectedReport !== null} 
        onClose={handleCloseModal} 
        report={selectedReport} 
      />
    </>
  );
}
